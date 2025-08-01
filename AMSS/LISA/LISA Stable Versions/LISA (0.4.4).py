import torch
import torch.nn as nn
import torch.nn.functional as F
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import string
import numpy as np
import random 
import os

# At the top of your LISA2.py file, outside any function:
session_cache = {} 

print("----- LISA IS LOADING VERSION 0.4.4 (Natural Outputs - Enhanced Subject Prompts) -----") # Increment version for clarity

app = Flask(__name__)

# --- Flask-CORS Configuration ---
CORS(app, resources={r"/lisa_prompt": {"origins": "*", "methods": ["POST", "OPTIONS"]}})

# --- GLOBAL AFTER_REQUEST HOOK FOR CORS ---
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response

# ----------------------------------------------------\
# 🧠 Detect Device (MPS or CPU)
# ----------------------------------------------------\
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")


# ----------------------------------------------------\
# 🧠 Load Sentence Transformer Model (and move to detected device)
# ----------------------------------------------------\
try:
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    sbert_model = None # Set to None if loading fails

# ----------------------------------------------------\
# 🧠 Define the subject classification neural network (identical to your provided code)
# ----------------------------------------------------\
class SubjectClassifier(nn.Module):
    def __init__(self, input_dim, num_classes):
        super(SubjectClassifier, self).__init__()
        self.fc1 = nn.Linear(input_dim, 256)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(256, num_classes)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

# Define categories
categories = {
    "Reading/ELA": ["reading", "english", "literature", "grammar", "essay", "writing", "analysis", "poetry", "fiction", "non-fiction", "summary", "paragraph", "sentence"],
    "Math": ["math", "mathematics", "algebra", "geometry", "calculus", "equation", "formula", "solve", "number", "calculation"],
    "Science": ["science", "biology", "chemistry", "physics", "ecology", "environment", "research", "experiment", "hypothesis", "lab", "data", "climate"],
    "History/Social Studies": ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war"],
    "Creative Writing": ["story", "poem", "creative", "narrative", "fiction", "character", "plot", "setting", "dialogue", "imagery", "metaphor"],
    "Art/Music": ["art", "music", "painting", "drawing", "sculpture", "song", "composition", "harmony", "rhythm", "instrument"],
    "Foreign Language": ["spanish", "french", "german", "mandarin", "language", "translate", "vocabulary", "conjugation", "dialogue"],
    "General": ["report", "project", "presentation", "topic", "information", "study", "notes", "concept", "theory"]
}

# Invert categories for reverse lookup
category_map = {idx: name for idx, name in enumerate(categories.keys())}
# Create a flat list of keywords for direct string matching
all_keywords = {keyword: category for category, keywords in categories.items() for keyword in keywords}


# Updated classify_subject function to prioritize specific subjects
def classify_subject(text, assignment_title):
    text_lower = text.lower() # This includes rubric and user text
    assignment_title_lower = assignment_title.lower()

    print(f"DEBUG: classify_subject - text_lower (FULL, SANITIZED): {text_lower}")
    print(f"DEBUG: classify_subject - assignment_title_lower: {assignment_title_lower}")

    # Priority 1: Specific high-value keywords across all text (title + rubric + user_text)
    # Check for "Science" or "History" before generic terms like "essay"
    science_keywords = ["climate", "environment", "biology", "chemistry", "physics", "ecology", "research", "experiment", "hypothesis", "lab", "data"]
    history_keywords = ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war"]
    
    for keyword in science_keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched Science keyword: {keyword}")
            return "Science"
    
    for keyword in history_keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched History keyword: {keyword}")
            return "History/Social Studies"

    # Priority 2: Assignment title keywords (less specific, like "essay")
    for keyword, category in all_keywords.items():
        if re.search(r'\b' + re.escape(keyword) + r'\b', assignment_title_lower):
            print(f"DEBUG: classify_subject - Matched assignment title keyword: {keyword}")
            return category
    
    # Priority 3: General text keywords (if not already matched)
    for keyword, category in all_keywords.items():
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched general text keyword: {keyword}")
            return category

    print("DEBUG: No specific keyword match found. Defaulting to General.")
    return "General"


# Function to find the most relevant rubric point
def find_most_relevant_rubric_point(user_text_embedding, rubric_point_embeddings, rubric_points_list):
    if user_text_embedding is None or rubric_point_embeddings is None or len(rubric_points_list) == 0:
        return None, 0.0

    # Ensure embeddings are on the same device and are 2D
    user_text_embedding = user_text_embedding.to(device).view(1, -1) # Ensure it's (1, embedding_dim)
    rubric_point_embeddings = rubric_point_embeddings.to(device) # Should already be (num_points, embedding_dim)

    similarities = cosine_similarity(user_text_embedding.cpu().numpy(), rubric_point_embeddings.cpu().numpy())
    
    most_relevant_idx = np.argmax(similarities)
    most_relevant_text = rubric_points_list[most_relevant_idx]
    most_relevant_similarity = similarities[0, most_relevant_idx]

    return most_relevant_text, most_relevant_similarity

# ----------------------------------------------------\
# 🧠 CORE LISA LOGIC
# ----------------------------------------------------\
def generate_lisa_response(
    assignment_title, rubric, user_text, previous_user_text,
    inactivity_timer_fired, paragraph_finished, sentence_finished,
    current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
    predicted_class, most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
    detected_subject, recent_sentence_completed, assignment_complete
):
    # Initialize variables to avoid UnboundLocalError if rubric_points_list is empty
    first_rubric_point_lower = "" 
    example_intro = ""

    # --- 1. Initial Blank Page / Introductory Prompt ---
    if not user_text.strip() and not assignment_complete:
        if rubric_points_list:
            first_rubric_point_lower = rubric_points_list[0].lower()
            print(f"DEBUG: Initial Prompt - First rubric point for processing: {repr(first_rubric_point_lower)}")
            
            if detected_subject == "Creative Writing":
                example_intro = "compelling opening hook or introduce your main character"
                print(f"DEBUG: Initial Prompt - Creative Writing subject detected. Intro: {example_intro}")
            elif detected_subject == "Math":
                example_intro = "the first step to solving the problem or your approach to the equation"
                print(f"DEBUG: Initial Prompt - Math subject detected. Intro: {example_intro}")
            elif detected_subject == "Art/Music":
                example_intro = "your initial concept, sketch, or the main theme of your composition"
                print(f"DEBUG: Initial Prompt - Art/Music subject detected. Intro: {example_intro}")
            elif detected_subject == "Foreign Language":
                example_intro = "your first sentence in the target language or how you'd start the conversation"
                print(f"DEBUG: Initial Prompt - Foreign Language subject detected. Intro: {example_intro}")
            elif detected_subject in ["Science", "History/Social Studies", "Reading/ELA", "General"]:
                print(f"DEBUG: Initial Prompt - Academic subject detected. Checking for specific intro phrases.")
                if "clearly introduce the topic of" in first_rubric_point_lower:
                    print(f"DEBUG: Initial Prompt - Found 'clearly introduce the topic of'. Attempting regex.")
                    match = re.search(r"clearly introduce the topic of (.+)", first_rubric_point_lower)
                    if match:
                        topic_phrase = match.group(1).strip()
                        if topic_phrase.endswith('.'):
                            topic_phrase = topic_phrase[:-1]
                        print(f"DEBUG: Initial Prompt - Topic phrase extracted: {repr(topic_phrase)}")
                        example_intro = f"clear introduction to the topic of **{topic_phrase}**"
                    else:
                        print("DEBUG: Initial Prompt - Regex match failed for topic extraction (after 'clearly introduce' found).")
                        example_intro = "clear introduction to the topic and its importance"
                elif "concise thesis statement outlining the main arguments" in first_rubric_point_lower:
                    print(f"DEBUG: Initial Prompt - Found 'concise thesis statement'.")
                    example_intro = "concise thesis statement outlining your main arguments"
                elif "introduce the topic" in first_rubric_point_lower:
                    print(f"DEBUG: Initial Prompt - Found 'introduce the topic'.")
                    example_intro = "clear introduction to the topic"
                elif "introduction" in first_rubric_point_lower:
                    print(f"DEBUG: Initial Prompt - Found 'introduction' (general).")
                    example_intro = "strong introductory paragraph"
                else:
                    print(f"DEBUG: Initial Prompt - No specific intro instruction found for academic academic subject. Defaulting.")
                    example_intro = "strong introductory paragraph"
            else: # Fallback for any other unhandled detected_subject (shouldn't happen with current categories)
                print(f"DEBUG: Initial Prompt - Unhandled subject type. Defaulting to general intro.")
                example_intro = "clear introductory paragraph"
        else: # Fallback if rubric_points_list is empty
            print("DEBUG: Initial Prompt - No rubric points found. Defaulting.")
            example_intro = "strong introductory paragraph"

        print(f"DEBUG: Initial Prompt - Detected subject: {detected_subject}")
        print(f"DEBUG: Initial Prompt - Final example_intro: {example_intro}")

        lisa_response = (
            f"Let's get started! Your teacher has given you \"{assignment_title}\"."
            f" For starters, what is the first thing we can write? Maybe a {example_intro} perhaps?"
        )
        return lisa_response

    # --- 2. Natural Output Nudge (when user has typed and relevant rubric point found) ---
    # Adjust the similarity threshold as needed for when LISA should give specific nudges
    if most_relevant_rubric_point_text and user_text.strip() and most_relevant_rubric_point_similarity > 0.4:
        rephrased_rubric_concept = most_relevant_rubric_point_text
        
        # --- Dynamically summarize user's text for 'user_text_brief' ---
        # NOTE: For advanced, truly dynamic acknowledgements across all subjects (e.g., "your equation", "your sketch"),
        # a more sophisticated NLP approach beyond simple keyword matching and truncation would be required.
        # This update removes specific hardcoded topic acknowledgements to make it consistent.
        user_text_brief = user_text.strip()
        print(f"DEBUG: User text before brief processing: '{user_text_brief}'")
        
        # Removed specific hardcoded topic checks (e.g., greenhouse gas, carbon capturing)
        # Now, it will primarily rely on truncation for the user_text_brief
        if len(user_text_brief) > 70: 
            user_text_brief = user_text_brief[:67] + "..."
            print("DEBUG: user_text_brief set by truncation.")
        else:
            print("DEBUG: user_text_brief kept as original (no specific match/truncation needed).")

        print(f"DEBUG: Final user_text_brief: '{user_text_brief}'")


        # --- Specific Rephrasing Rules for Rubric Concepts ---
        # These are kept for precise rephrasing of the rubric point
        if "discuss the reduction of greenhouse gas emissions and its effect on climate change" in most_relevant_rubric_point_text.lower():
            rephrased_rubric_concept = "reducing greenhouse gas emissions and its effect on climate change" # Re-added the full context
        elif "define renewable energy comprehensively" in most_relevant_rubric_point_text.lower():
            rephrased_rubric_concept = "defining renewable energy comprehensively"
        elif "describe at least three different types of renewable energy" in most_relevant_rubric_point_text.lower():
            rephrased_rubric_concept = "describing different types of renewable energy (e.g., solar, wind, hydro)"
        
        # --- Diversify the follow-up question based on user progress/similarity ---
        follow_up_questions_general = [
            f"how can we connect it to {rephrased_rubric_concept}?",
            f"what more can you add about {rephrased_rubric_concept}?",
            f"can you elaborate further on {rephrased_rubric_concept}?",
            f"how does this relate to {rephrased_rubric_concept}?",
            f"what specific examples or details can you include about {rephrased_rubric_concept}?",
            f"how can you expand on this to cover {rephrased_rubric_concept}?",
            f"what are the key aspects of {rephrased_rubric_concept} you'd like to discuss next?"
        ]

        follow_up_questions_high_sim = [ # For when user is very close to covering the point
            f"That's a great start on {rephrased_rubric_concept}! What's the next key detail or argument you want to add?",
            f"Excellent! You're really covering {rephrased_rubric_concept}. How can you build on this even more?",
            f"Perfect! Now that you've introduced {rephrased_rubric_concept}, what's the next step to fully develop it?"
        ]

        # Choose question based on similarity threshold
        if most_relevant_rubric_point_similarity > 0.75: # Higher threshold for "near completion" or good coverage
            chosen_question = random.choice(follow_up_questions_high_sim)
            # Prepend a more positive opening for high similarity
            lisa_response = f"Excellent! {chosen_question}"
            return lisa_response
        else: # For lower similarity, use general questions
            chosen_question = random.choice(follow_up_questions_general)
            lisa_response = (
                f"Keep up the great work! Your sentence on {user_text_brief} is compelling, "
                f"but {chosen_question.lower()}" # Ensure the question starts lowercase after "but"
            )
            return lisa_response

    # --- 3. Default/Fallback Responses (if no specific nudge above is returned) ---
    if inactivity_timer_fired:
        return "It looks like you've been inactive for a bit. Do you need some help with this section?"
    elif sentence_finished:
        return "That's a solid sentence. What's the next point you want to make?"
    elif paragraph_finished:
        return "Great work on that paragraph! What's the next section you plan to tackle?"
    else:
        return "Keep writing! I'm here to help you develop your ideas."


# ----------------------------------------------------\
# 🌐 Flask Routes
# ----------------------------------------------------\
@app.route('/')
def home():
    return "LISA Flask server is running!"

@app.route('/lisa_prompt', methods=['POST'])
def lisa_prompt():
    try:
        data = request.get_json()
        assignment_title = data.get('assignment_title', '')
        rubric = data.get('rubric', '')
        user_text = data.get('user_text', '')
        previous_user_text = data.get('previous_user_text', '')
        inactivity_timer_fired = data.get('inactivity_timer_fired', False)
        paragraph_finished = data.get('paragraph_finished', False)
        sentence_finished = data.get('sentence_finished', False)
        assignment_complete = data.get('assignment_complete', False)
        recent_sentence_completed = data.get('recent_sentence_completed', False)


        # Process Rubric (split into points)
        rubric_points = [point.strip() for point in rubric.split('\n') if point.strip() and not point.strip().startswith('**')]
        rubric_points_list = []
        for point in rubric_points:
            # Clean up leading hyphens or bullets
            cleaned_point = re.sub(r'^-?\s*|\*\*(.*?)\*\*', '', point).strip()
            if cleaned_point: # Only add if not empty after cleaning
                rubric_points_list.append(cleaned_point)
        
        # Embed rubric points
        rubric_point_embeddings = None
        if sbert_model and rubric_points_list:
            rubric_point_embeddings = sbert_model.encode(rubric_points_list, convert_to_tensor=True).to(device)
        else:
            print("Warning: Rubric points or SentenceTransformer model not available for embedding.")
        
        # Embed current user text
        current_text_embedding = None
        if sbert_model and user_text.strip():
            current_text_embedding = sbert_model.encode(user_text, convert_to_tensor=True).to(device)
        else:
            print("Warning: User text not available for embedding.")

        # Embed assignment title (if needed, e.g., for general context similarity)
        title_embedding = None
        if sbert_model and assignment_title.strip():
            title_embedding = sbert_model.encode(assignment_title, convert_to_tensor=True).to(device)

        # Initialize these as None or default values if they might not be computed every time
        predicted_class = None
        most_relevant_rubric_point_text = None
        most_relevant_rubric_point_similarity = 0.0
        

        if current_text_embedding is not None and rubric_point_embeddings is not None and rubric_point_embeddings.numel() > 0:
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity = \
                find_most_relevant_rubric_point(current_text_embedding, rubric_point_embeddings, rubric_points_list)
            print(f"Most relevant rubric point: '{most_relevant_rubric_point_text}' (Similarity: {most_relevant_rubric_point_similarity:.2f})")
        else:
            print("Warning: Cannot find most relevant rubric point (missing user text embedding or rubric embeddings).")


        detected_subject = classify_subject(assignment_title + " " + rubric + " " + user_text, assignment_title)
        print(f"Detected Subject: {detected_subject}")


        # Call generate_lisa_response with all necessary (and computed) arguments
        lisa_response = generate_lisa_response(
            assignment_title, rubric, user_text, previous_user_text,
            inactivity_timer_fired, paragraph_finished, sentence_finished,
            current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
            predicted_class, # Now correctly passed
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
            detected_subject, recent_sentence_completed, assignment_complete
        )

        return jsonify({"suggested_next_step": lisa_response})

    except Exception as e:
        print(f"An error occurred in lisa_prompt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# Make sure this part is at the very end of your file
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) # Or whatever port you use