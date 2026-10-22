import os
import re
import gc

import pandas as pd
import torch
from transformers import pipeline
from tqdm import tqdm

FILE_PATH = "backend\\stanfordMOOCForumPostsSet.xlsx" 
CHECKPOINT_PATH = "Processed_forum_posts.csv"

# Change to None when ready to run all 28,682 rows (~12-15 mins).
MAX_ROWS = None


# =====================================================================
# STAGE 1: DATA INGESTION, CLEANING & STANDARDIZATION
# =====================================================================

def clean_text(text: str) -> str:
    text = str(text)
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'_x[0-9a-fA-F]+_', ' ', text)
    text = text.replace('\\"', '"').replace('\\', '')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def run_stage_1_cleaning() -> pd.DataFrame:
    print("--- 1.0 Loading & Cleaning Raw Dataset ---")
    dataset = pd.read_excel(FILE_PATH)

    required_cols = ['Text', 'forum_uid', 'created_at', 'CourseType']
    df_cleaned = dataset.dropna(subset=required_cols).copy()

    df_cleaned['created_at'] = pd.to_datetime(df_cleaned['created_at'], errors='coerce')
    df_cleaned = df_cleaned.dropna(subset=['created_at']).copy()

    df_cleaned = df_cleaned.drop_duplicates(subset=['forum_uid', 'Text'], keep='first').copy()

    df_cleaned['Processed_Text'] = df_cleaned['Text'].apply(clean_text)
    df_cleaned['word_count'] = df_cleaned['Processed_Text'].apply(lambda x: len(x.split()))
    df_cleaned = df_cleaned[df_cleaned['word_count'] >= 3].copy()

    # Keep only the clean columns needed downstream
    keep_cols = ['forum_uid', 'CourseType', 'created_at', 'word_count', 'Processed_Text']
    df_cleaned = df_cleaned[keep_cols].reset_index(drop=True)

    print(f"Stage 1 Complete: {df_cleaned.shape[0]} clean posts across {df_cleaned['forum_uid'].nunique()} students.")
    return df_cleaned


# =====================================================================
# STAGE 2: BATCH NLP INFERENCE & CHECKPOINT GENERATION
# =====================================================================

def get_optimal_device():
    if torch.cuda.is_available():
        print(f"Hardware selected: NVIDIA CUDA GPU ({torch.cuda.get_device_name(0)})")
        return 0
    elif torch.backends.mps.is_available():
        print("Hardware selected: Apple Silicon GPU (M1 Pro MPS)")
        return "mps"
    else:
        print("Hardware selected: CPU Fallback")
        return -1

def run_stage_2_batch_inference(df_cleaned: pd.DataFrame, max_rows: int = None) -> pd.DataFrame:
    # If checkpoint already exists on disk, load it directly to save GPU time
    if os.path.exists(CHECKPOINT_PATH):
        print(f"\n--- Found existing checkpoint '{CHECKPOINT_PATH}'! Loading from disk ---")
        df_scored = pd.read_csv(CHECKPOINT_PATH, parse_dates=['created_at'])
        print(f"Loaded {df_scored.shape[0]} scored posts from checkpoint.")
        return df_scored

    df_target = df_cleaned.head(max_rows).copy() if max_rows else df_cleaned.copy()
    total_posts = len(df_target)
    texts = df_target['Processed_Text'].tolist()

    print(f"\n--- 2.0 Starting Batch NLP Inference on {total_posts} posts ---")
    device = get_optimal_device()
    precision = torch.float16 if device == 0 else torch.float32

    # -----------------------------------------------------------------
    # 2.1 AFFECTIVE DIMENSION (SamLowe/roberta-base-go_emotions)
    # -----------------------------------------------------------------
    print("\n[1/2] Loading Affective Model (SamLowe/roberta-base-go_emotions)...")
    affective_pipe = pipeline(
        "text-classification",
        model="SamLowe/roberta-base-go_emotions",
        top_k=None,
        truncation=True,
        max_length=512,
        device=device,
        dtype=precision
    )

    distress_set = {
        'confusion', 'annoyance', 'disappointment', 'nervousness', 'fear',
        'sadness', 'anger', 'embarrassment', 'disapproval', 'remorse', 'grief'
    }

    primary_emotions = []
    emotion_scores_pct = []
    distress_pcts = []
    aff_batch_size = 32

    for i in tqdm(range(0, total_posts, aff_batch_size), desc="Affective Inference (RoBERTa)"):
        batch_texts = texts[i : i + aff_batch_size]
        batch_out = affective_pipe(batch_texts, batch_size=aff_batch_size)

        for post_preds in batch_out:
            primary_emotions.append(post_preds[0]['label'])
            emotion_scores_pct.append(round(post_preds[0]['score'] * 100, 2))
            raw_distress = sum(x['score'] for x in post_preds if x['label'] in distress_set)
            distress_pcts.append(round(min(1.0, raw_distress) * 100, 2))

    df_target['primary_emotion'] = primary_emotions
    df_target['emotion_score_pct'] = emotion_scores_pct
    df_target['distress_pct'] = distress_pcts

    # Free RoBERTa from VRAM before loading DeBERTa-v3
    del affective_pipe
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    # -----------------------------------------------------------------
    # 2.2 COGNITIVE DIMENSION (MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli)
    # -----------------------------------------------------------------
    print("\n[2/2] Loading Cognitive Model (MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli)...")
    cognitive_pipe = pipeline(
        "zero-shot-classification",
        model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
        device=device,
        dtype=precision
    )

    intent_map = {
        "asking a question, expressing confusion, or requesting help": "Seeking Clarification",
        "sharing a personal opinion, reflection, or explaining an idea": "Conceptual Discussion",
        "reporting a technical issue, grading question, or course deadline": "Course Logistics",
        "thanking classmates, offering encouragement, or greeting peers": "Peer Support"
    }
    candidate_labels = list(intent_map.keys())

    cognitive_intents = []
    intent_scores_pct = []
    cog_batch_size = 16

    for i in tqdm(range(0, total_posts, cog_batch_size), desc="Cognitive Inference (DeBERTa-v3)"):
        batch_texts = texts[i : i + cog_batch_size]
        batch_out = cognitive_pipe(
            batch_texts,
            candidate_labels=candidate_labels,
            hypothesis_template="In this course forum post, the student is {}.",
            truncation=True,
            batch_size=cog_batch_size
        )
        # Ensure batch_out is always a list even if final batch has 1 item
        if isinstance(batch_out, dict):
            batch_out = [batch_out]

        for out in batch_out:
            cognitive_intents.append(intent_map[out['labels'][0]])
            intent_scores_pct.append(round(out['scores'][0] * 100, 2))

    df_target['cognitive_intent'] = cognitive_intents
    df_target['intent_score_pct'] = intent_scores_pct

    # Free DeBERTa-v3 from VRAM
    del cognitive_pipe
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    # -----------------------------------------------------------------
    # 2.3 SAVE CHECKPOINT & SUMMARY STATS
    # -----------------------------------------------------------------
    df_target.to_csv(CHECKPOINT_PATH, index=False)
    print(f"\nCheckpoint successfully saved to '{CHECKPOINT_PATH}' ({len(df_target)} rows)!")

    print("\n--- Affective & Cognitive Summary Breakdown ---")
    print("\nTop 5 Detected Emotions:")
    print(df_target['primary_emotion'].value_counts().head(5))
    print("\nCognitive Intent Distribution:")
    print(df_target['cognitive_intent'].value_counts())

    return df_target


if __name__ == "__main__":
    df_clean = run_stage_1_cleaning()
    df_scored = run_stage_2_batch_inference(df_clean, max_rows=MAX_ROWS)