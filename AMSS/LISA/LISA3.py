import os
import re
import time
import string
from collections import defaultdict

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

# Local-only ML: torch + sentence-transformers for embeddings
import torch
import torch.nn as nn
import torch.nn.functional as F
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

"""
LISA3(Beta): Local-only nudging assistant
- No external API calls
- Uses local embeddings (SentenceTransformer) + tiny neural policy
- Produces context-aware nudges (not answers), aligned to rubric and student flow
"""

app = Flask(__name__)
CORS(app, resources={r"/lisa_prompt": {"origins": "*", "methods": ["POST", "OPTIONS"]}})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response

# Device selection
device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
print("----- LISA3(Beta) Local Nudging Assistant -----")
print(f"Using device: {device}")

# Embedding model (local)
try:
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    sbert_model = None


class NudgePolicy(nn.Module):
    def __init__(self, input_size: int, hidden_size: int = 128):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 5)  # classes: intro, elaborate, evidence, connection, transition

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        return self.fc2(x)


# Simple session memory per (assignment_title)
session_state = defaultdict(lambda: {
    'last_text': '',
    'covered_points': set(),
    'last_nudge_time': 0.0
})


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def split_rubric_points(rubric_text: str):
    if not rubric_text:
        return []
    text = re.sub(r'[\d]+\.|\*|-|\•', '\n', rubric_text)
    pts = [p.strip() for p in text.split('\n') if p.strip()]
    return pts


def format_point_for_display(pt: str) -> str:
    pt = re.sub(r'\s*\(\d+%\)\s*', '', pt).strip()
    pt = re.sub(r'^[-\d\.\s]+', '', pt).strip()
    return pt


def most_relevant_point(user_emb: torch.Tensor, rubric_embs: torch.Tensor, points: list[str]):
    if user_emb is None or rubric_embs.numel() == 0:
        return None, 0.0
    u = user_emb.cpu().numpy().reshape(1, -1)
    r = rubric_embs.cpu().numpy()
    sims = cosine_similarity(u, r)[0]
    idx = sims.argmax()
    return points[idx], float(sims[idx])


def choose_nudge_class(policy: NudgePolicy, features: torch.Tensor) -> int:
    with torch.no_grad():
        logits = policy(features.unsqueeze(0))
        return int(torch.argmax(logits, dim=1).item())


def build_features(user_emb: torch.Tensor, title_emb: torch.Tensor, coverage_ratio: float) -> torch.Tensor:
    if user_emb is None:
        user_emb = torch.zeros_like(title_emb)
    cov = torch.tensor([coverage_ratio], device=title_emb.device)
    return torch.cat([user_emb, title_emb, cov], dim=0)


def generate_nudge(nudge_cls: int, last_sentence: str, detected_point: str | None, weak_similarity: bool) -> str:
    last_q = f'"{last_sentence}"' if last_sentence else "that idea"
    dp = f"the {format_point_for_display(detected_point)}" if detected_point else "the rubric"
    if nudge_cls == 0:
        return f"Let's set the stage. What is your main goal here? How will you introduce it clearly?"
    if nudge_cls == 1:
        return f"Good start with {last_q}. Can you elaborate with specific details to deepen the idea?"
    if nudge_cls == 2:
        return f"What evidence supports {last_q}? Try adding a concrete example or source."
    if nudge_cls == 3:
        tip = " Make the link to {dp} explicit." if weak_similarity and detected_point else ""
        return f"How does {last_q} connect to your main argument?{tip}".replace('{dp}', dp)
    if nudge_cls == 4:
        return f"What’s the next step after {last_q}? Add a smooth transition into your next point."
    return "Keep going—what’s the next small step you can take right now?"


def extract_last_meaningful_sentence(text: str) -> str:
    sentences = re.findall(r'[^.!?\n]+[.!?\n]*', text or '')
    sentences = [s.strip() for s in sentences if s.strip() and not all(ch in string.punctuation or ch.isspace() for ch in s)]
    if not sentences:
        return ''
    s = sentences[-1]
    if s and s[-1] in '.!?':
        s = s[:-1].strip()
    return s


@app.route('/lisa_prompt', methods=['POST', 'OPTIONS'])
def lisa3_prompt():
    global sbert_model
    if request.method == 'OPTIONS':
        return make_response('', 200)

    if sbert_model is None:
        return jsonify({"suggested_next_step": "LISA3 is resting. Model not loaded."}), 500

    data = request.get_json() or {}
    assignment_title = data.get('assignment_title', '')
    rubric = data.get('rubric', '')
    user_text = data.get('user_text', '')
    inactivity_timer_fired = bool(data.get('inactivity_timer_fired', False))
    paragraph_finished = bool(data.get('paragraph_finished', False))
    sentence_finished = bool(data.get('sentence_finished', False))
    previous_user_text = data.get('previous_user_text', '')
    recent_sentence_completed = bool(data.get('recent_sentence_completed', False))
    assignment_complete = bool(data.get('assignment_complete', False))

    key = assignment_title or 'default'
    state = session_state[key]

    user_text_clean = clean_text(user_text)
    prev_text_clean = clean_text(previous_user_text)

    # Embed inputs (local-only)
    user_emb = sbert_model.encode(user_text_clean, convert_to_tensor=True).to(device) if user_text_clean else None
    title_emb = sbert_model.encode(assignment_title or 'assignment', convert_to_tensor=True).to(device)
    points = split_rubric_points(rubric)
    rubric_embs = torch.empty(0, sbert_model.get_sentence_embedding_dimension(), device=device)
    if points:
        rubric_embs = sbert_model.encode(points, convert_to_tensor=True).to(device)

    # Track rubric coverage by measuring similarity
    covered = state['covered_points']
    if user_emb is not None and rubric_embs.numel() > 0:
        sims = cosine_similarity(user_emb.cpu().numpy().reshape(1, -1), rubric_embs.cpu().numpy())[0]
        for i, sim in enumerate(sims):
            if sim > 0.68:  # mark as covered
                covered.add(i)
    coverage_ratio = (len(covered) / max(1, len(points))) if points else 0.0

    # Last sentence for context
    last_sentence = extract_last_meaningful_sentence(user_text_clean)

    # Determine most relevant rubric point for the current text
    detected_point, sim_val = most_relevant_point(user_emb, rubric_embs, points) if points else (None, 0.0)
    weak_similarity = sim_val < 0.55 if points else False

    # Build simple features and choose nudge class
    input_size = sbert_model.get_sentence_embedding_dimension()
    policy = NudgePolicy(input_size * 2 + 1).to(device)
    # Randomly initialized tiny policy is sufficient as a heuristic router; not trained
    feats = build_features(user_emb, title_emb, coverage_ratio)
    nudge_cls = choose_nudge_class(policy, feats)

    # High priority events
    if assignment_complete:
        msg = "Great work finishing your draft. Compare your writing against the rubric and tighten any weak spots before submitting."
        return jsonify({"suggested_next_step": msg})

    if not user_text_clean:
        # Initial gentle kickoff using rubric
        if points:
            fp = format_point_for_display(points[0])
            return jsonify({"suggested_next_step": f"Let's get started. Focus first on the {fp}. What’s one sentence you can write for it?"})
        return jsonify({"suggested_next_step": "What’s the main goal of this assignment? Write a clear starting line to begin."})

    # Event-driven tweaks
    if recent_sentence_completed or sentence_finished:
        nudge_cls = 3 if weak_similarity else nudge_cls

    if paragraph_finished and weak_similarity:
        nudge_cls = 2  # encourage adding evidence if connection is weak

    # Produce nudge (no answers; guidance only)
    nudge = generate_nudge(nudge_cls, last_sentence, detected_point, weak_similarity)

    # Update state
    state['last_text'] = user_text_clean
    state['last_nudge_time'] = time.time()
    session_state[key] = state

    return jsonify({"suggested_next_step": nudge})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'service': 'lisa3-beta',
        'timestamp': time.time()
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)


