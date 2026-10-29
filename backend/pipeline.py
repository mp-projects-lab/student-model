import os
import re
import gc
import json
import warnings

# Silence Windows Hugging Face symlink and token warnings
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
warnings.filterwarnings("ignore", category=UserWarning)

import pandas as pd
import torch
from transformers import pipeline
from tqdm import tqdm

FILE_PATH = "backend\\stanfordMOOCForumPostsSet.xlsx" if os.path.exists("backend\\stanfordMOOCForumPostsSet.xlsx") else "stanfordMOOCForumPostsSet.xlsx"
CHECKPOINT_PATH = "Processed_forum_posts.csv"
PROFILES_JSON_PATH = "student_profiles.json"

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

    # Garrison's Community of Inquiry (CoI) Cognitive Presence Taxonomy
    intent_map = {
        "reporting a technical issue, course deadline, or greeting and thanking peers": "Course Logistics & Social",
        "asking a question, expressing confusion, or requesting help with a problem": "Triggering (Questioning)",
        "sharing a personal opinion, reflection, or brainstorming ideas about the topic": "Exploration (Discussion)",
        "explaining a solution, connecting concepts with evidence, or teaching a peer": "Integration (Synthesis)"
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


# =====================================================================
# STAGE 3: MULTIDIMENSIONAL STUDENT AGGREGATION (BEHAVIORAL + NLP)
# =====================================================================

def run_stage_3_student_aggregation(df_scored: pd.DataFrame) -> list:
    print("\n--- 3.0 Running Stage 3: Multidimensional Student Aggregation ---")
    df = df_scored.copy()
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['post_date'] = df['created_at'].dt.date

    # Map both our initial labels and the CoI labels to Cognitive Depth Weights (0-100)
    cognitive_weights = {
        # CoI Taxonomy Labels
        "Course Logistics & Social": 30.0,
        "Triggering (Questioning)": 45.0,
        "Exploration (Discussion)": 75.0,
        "Integration (Synthesis)": 100.0,
        # Backwards-compatible mapping for existing CSV checkpoint
        "Course Logistics": 30.0,
        "Peer Support": 40.0,
        "Seeking Clarification": 45.0,
        "Conceptual Discussion": 85.0
    }
    df['cognitive_depth_weight'] = df['cognitive_intent'].map(cognitive_weights).fillna(50.0)

    # Sort chronologically for accurate time-series timelines
    df = df.sort_values(by=['forum_uid', 'created_at'])

    # 3.1 Group by student (Entity Matching)
    grouped = df.groupby('forum_uid').agg(
        course_type=('CourseType', 'first'),
        last_updated=('created_at', 'max'),
        first_post=('created_at', 'min'),
        # Behavioral raw metrics
        total_posts=('Processed_Text', 'count'),
        avg_word_count=('word_count', 'mean'),
        total_words=('word_count', 'sum'),
        unique_active_days=('post_date', 'nunique'),
        # Affective aggregated metrics
        avg_distress_pct=('distress_pct', 'mean'),
        max_distress_pct=('distress_pct', 'max'),
        primary_emotion=('primary_emotion', lambda s: s.mode().iloc[0] if not s.mode().empty else "neutral"),
        # Cognitive aggregated metrics
        primary_intent=('cognitive_intent', lambda s: s.mode().iloc[0] if not s.mode().empty else "Exploration (Discussion)"),
        avg_intent_confidence_pct=('intent_score_pct', 'mean'),
        cognitive_mastery_pct=('cognitive_depth_weight', 'mean')
    ).reset_index()

    grouped['active_span_days'] = (grouped['last_updated'] - grouped['first_post']).dt.days

    # 3.2 Compute Cohort-Normalized Behavioral Engagement Score (0-100%)
    p_posts = grouped.groupby('course_type')['total_posts'].rank(pct=True)
    p_words = grouped.groupby('course_type')['avg_word_count'].rank(pct=True)
    p_days = grouped.groupby('course_type')['unique_active_days'].rank(pct=True)

    grouped['behavioral_score_pct'] = (
        (0.45 * p_posts) + (0.35 * p_words) + (0.20 * p_days)
    ) * 100

    # Pre-group posts by student for fast O(N) timeline construction across 28,682 rows
    posts_by_student = {
        uid: group.to_dict('records')
        for uid, group in df.groupby('forum_uid', sort=False)
    }

    # 3.3 Build JSON Payload with Nested Dimensions + Time-Series Timeline
    student_profiles = []
    for row in grouped.to_dict('records'):
        uid = row['forum_uid']
        student_posts = posts_by_student.get(uid, [])

        timeline = [
            {
                "created_at": post['created_at'].isoformat(),
                "word_count": int(post['word_count']),
                "primary_emotion": post['primary_emotion'],
                "distress_pct": round(float(post['distress_pct']), 2),
                "cognitive_intent": post['cognitive_intent'],
                "intent_score_pct": round(float(post['intent_score_pct']), 2),
                "text_preview": str(post['Processed_Text'])[:140] + ("..." if len(str(post['Processed_Text'])) > 140 else "")
            }
            for post in student_posts
        ]

        avg_distress = round(float(row['avg_distress_pct']), 2)
        beh_score = round(float(row['behavioral_score_pct']), 2)
        cog_score = round(float(row['cognitive_mastery_pct']), 2)

        profile = {
            "student_id": uid,
            "course_type": row['course_type'],
            "last_updated": row['last_updated'].isoformat(),
            "high_distress_flag": bool(avg_distress >= 30.0),
            # Ready-to-plot 0-100% axes for Mario's Recharts RadarChart
            "radar_chart_data": [
                {"dimension": "Behavioral Engagement", "score": beh_score, "fullMark": 100},
                {"dimension": "Cognitive Depth", "score": cog_score, "fullMark": 100},
                {"dimension": "Affective Stability", "score": round(100.0 - avg_distress, 2), "fullMark": 100},
                {"dimension": "Distress Risk", "score": avg_distress, "fullMark": 100}
            ],
            "dimensions": {
                "behavioral": {
                    "engagement_score_pct": beh_score,
                    "total_posts": int(row['total_posts']),
                    "avg_word_count": round(float(row['avg_word_count']), 1),
                    "total_words": int(row['total_words']),
                    "unique_active_days": int(row['unique_active_days']),
                    "active_span_days": int(row['active_span_days'])
                },
                "affective": {
                    "avg_distress_pct": avg_distress,
                    "max_distress_pct": round(float(row['max_distress_pct']), 2),
                    "affective_stability_pct": round(100.0 - avg_distress, 2),
                    "primary_emotion": row['primary_emotion'],
                    "high_distress_flag": bool(avg_distress >= 30.0)
                },
                "cognitive": {
                    "cognitive_mastery_pct": cog_score,
                    "primary_intent": row['primary_intent'],
                    "avg_intent_confidence_pct": round(float(row['avg_intent_confidence_pct']), 2)
                }
            },
            "timeline": timeline
        }
        student_profiles.append(profile)

    # Sort students so multi-post active students appear first in Mario's table
    student_profiles.sort(
        key=lambda x: (
            x['dimensions']['behavioral']['total_posts'],
            x['dimensions']['affective']['avg_distress_pct']
        ),
        reverse=True
    )

    with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(student_profiles, f, indent=2)

    print(f"Stage 3 Complete! Generated {len(student_profiles)} student profiles -> '{PROFILES_JSON_PATH}'")
    print("\n--- Top 3 Most Active Student Profiles Preview ---")
    for s in student_profiles[:3]:
        print(
            f"ID: {s['student_id'][:10]}... | Course: {s['course_type']} | "
            f"Posts: {s['dimensions']['behavioral']['total_posts']} | "
            f"Behavioral: {s['dimensions']['behavioral']['engagement_score_pct']}% | "
            f"Distress: {s['dimensions']['affective']['avg_distress_pct']}% | "
            f"Cognitive Mastery: {s['dimensions']['cognitive']['cognitive_mastery_pct']}% "
            f"({s['dimensions']['cognitive']['primary_intent']})"
        )
    return student_profiles


if __name__ == "__main__":
    if os.path.exists(CHECKPOINT_PATH):
        df_scored = run_stage_2_batch_inference(pd.DataFrame(), max_rows=MAX_ROWS)
    else:
        df_clean = run_stage_1_cleaning()
        df_scored = run_stage_2_batch_inference(df_clean, max_rows=MAX_ROWS)
    run_stage_3_student_aggregation(df_scored)
