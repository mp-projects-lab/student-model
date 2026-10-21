import pandas as pd
import re
import torch
from transformers import pipeline

FILE_PATH = "backend\\stanfordMOOCForumPostsSet.xlsx"

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

    print(f"Stage 1 Complete: {df_cleaned.shape[0]} clean posts across {df_cleaned['forum_uid'].nunique()} students.")
    return df_cleaned


# =====================================================================
# STAGE 2: REFINED HUGGING FACE INFERENCE (0-100% SCALE + GPU BATCHING)
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

def run_stage_2_sample_inference(df_cleaned: pd.DataFrame, sample_size: int = 10) -> pd.DataFrame:
    print(f"\n--- 2.0 Initializing Refined Stage 2 Inference ({sample_size} rows) ---")
    device = get_optimal_device()
    df_sample = df_cleaned.head(sample_size).copy()
    texts = df_sample['Processed_Text'].tolist()

    # 2.1 AFFECTIVE MODEL: SamLowe/roberta-base-go_emotions
    print("Loading Affective Model (SamLowe/roberta-base-go_emotions)...")
    affective_pipe = pipeline(
        task="text-classification",
        model="SamLowe/roberta-base-go_emotions",
        top_k=None,
        truncation=True,
        max_length=512,
        device=device,
        batch_size=32  # Parallel batching for RTX 3070
    )

    print("Running Affective Inference...")
    affective_outputs = affective_pipe(texts)

    distress_labels = {'confusion', 'annoyance', 'disappointment', 'nervousness', 'fear', 'sadness', 'anger'}

    primary_emotions = []
    emotion_scores_pct = []
    distress_probs_pct = []

    for post_preds in affective_outputs:
        primary_emotions.append(post_preds[0]['label'])
        # Normalize to 0-100% scale
        emotion_scores_pct.append(round(post_preds[0]['score'] * 100, 2))
        
        # Sum struggle/distress probabilities, cap at 1.0, and convert to 0-100%
        raw_distress = sum(item['score'] for item in post_preds if item['label'] in distress_labels)
        distress_probs_pct.append(round(min(1.0, raw_distress) * 100, 2))

    df_sample['primary_emotion'] = primary_emotions
    df_sample['emotion_score_pct'] = emotion_scores_pct
    df_sample['distress_pct'] = distress_probs_pct

    # 2.2 COGNITIVE MODEL: facebook/bart-large-mnli (Refined NLI Framing)
    print("Loading Cognitive Model (facebook/bart-large-mnli)...")
    cognitive_pipe = pipeline(
        task="zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=device,
        batch_size=16  # Optimal batch size for 4-label NLI on 8GB VRAM
    )

    # Map descriptive NLI verb phrases to clean UI labels
    intent_mapping = {
        "asking a question or seeking help with a problem": "Seeking Clarification",
        "sharing an opinion, insight, or discussing course concepts": "Conceptual Discussion",
        "asking about grades, deadlines, exams, or technical issues": "Course Logistics",
        "encouraging classmates, thanking peers, or socializing": "Peer Support"
    }
    candidate_descriptions = list(intent_mapping.keys())

    print("Running Refined Cognitive Zero-Shot Inference...")
    cognitive_outputs = cognitive_pipe(
        texts,
        candidate_labels=candidate_descriptions,
        hypothesis_template="In this course forum post, the student is {}.",
        truncation=True
    )

    # Map winning description back to clean UI category and convert score to 0-100%
    df_sample['cognitive_intent'] = [intent_mapping[out['labels'][0]] for out in cognitive_outputs]
    df_sample['intent_score_pct'] = [round(out['scores'][0] * 100, 2) for out in cognitive_outputs]

    # 2.3 Preview Refined Output
    print("\n--- Refined Stage 2 Multidimensional Preview (0-100% Scale) ---")
    output_cols = [
        'forum_uid', 'word_count', 'primary_emotion', 
        'distress_pct', 'cognitive_intent', 'intent_score_pct'
    ]
    print(df_sample[output_cols].to_string(index=False))
    return df_sample


if __name__ == "__main__":
    df_clean = run_stage_1_cleaning()
    df_scored_sample = run_stage_2_sample_inference(df_clean, sample_size=10)