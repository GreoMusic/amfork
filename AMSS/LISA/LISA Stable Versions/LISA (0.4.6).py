import torch
import torch.nn as nn # Kept for potential future use or if you decide to reintroduce a trained NN
import torch.nn.functional as F # Kept for potential future use
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np
import random
import os

# --- Constants for Configuration ---
LISA_VERSION = "0.4.6 (Improved Clarity & Structure)"
SBERT_MODEL_NAME = 'all-MiniLM-L6-v2'
SIMILARITY_THRESHOLD_NUDGE = 0.45 # Adjusted slightly for more specific nudges
SIMILARITY_THRESHOLD_HIGH_COVERAGE = 0.78 # Adjusted slightly for higher confidence in coverage

print(f"----- LISA IS LOADING VERSION {LISA_VERSION} -----")

app = Flask(__name__)

# --- Flask-CORS Configuration ---
# Ensure this is comprehensive for your frontend needs.
CORS(app, resources={r"/lisa_prompt": {"origins": "*", "methods": ["POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# ----------------------------------------------------
# ⚙️ Detect Device (MPS or CPU)
# ----------------------------------------------------
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

# ----------------------------------------------------
# 🧠 Load Sentence Transformer Model (and move to detected device)
# ----------------------------------------------------
try:
    sbert_model = SentenceTransformer(SBERT_MODEL_NAME).to(device)
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}. LISA will not be able to embed text.")
    sbert_model = None # Set to None if loading fails

# Define categories with significantly expanded keywords for breadth and depth
categories = {
    "Reading/ELA": ["reading", "english", "literature", "grammar", "essay", "writing", "analysis", "poetry", "fiction", "non-fiction", "summary", "paragraph", "sentence", "novel", "play", "author", "theme", "character", "plot", "structure", "rhetoric", "composition", "journalism", "narrative", "persuasive", "expository", "argumentative", "literary device", "vocabulary", "punctuation", "spelling", "thesis"],
    "Math": ["math", "mathematics", "algebra", "geometry", "calculus", "equation", "formula", "solve", "number", "calculation", "statistic", "probability", "graph", "function", "theorem", "proof", "trigonometry", "arithmetic", "data analysis", "problem solving", "variable", "exponent", "derivative", "integral", "geometry", "fractions", "decimals", "percentages"],
    "Science": ["science", "biology", "chemistry", "physics", "ecology", "environment", "research", "experiment", "hypothesis", "lab", "data", "climate", "geology", "astronomy", "scientific method", "anatomy", "physiology", "chemical", "physical", "biological", "ecosystem", "cell", "molecule", "atom", "reaction", "force", "energy", "matter", "observation", "conclusion", "theory", "evolution", "genetics", "earth science"],
    "History/Social Studies": ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war", "revolution", "society", "civilization", "constitution", "democracy", "map", "country", "region", "historical", "sociology", "psychology", "anthropology", "ancient", "modern", "world", "american", "primary source", "secondary source", "economy", "trade", "law", "citizen", "global"],
    "Creative Writing": ["story", "poem", "creative", "narrative", "fiction", "character", "plot", "setting", "dialogue", "imagery", "metaphor", "verse", "stanza", "prose", "screenplay", "playwriting", "short story", "novel excerpt", "world-building", "voice", "show don't tell", "figurative language", "rhyme", "meter"],
    "Art/Music": ["art", "music", "painting", "drawing", "sculpture", "song", "composition", "harmony", "rhythm", "instrument", "melody", "choir", "orchestra", "theory", "sketch", "canvas", "brushstroke", "color", "design", "medium", "critique", "art history", "movement", "artist", "performance", "audition", "technique", "form", "texture", "scale"],
    "Foreign Language": ["spanish", "french", "german", "mandarin", "language", "translate", "vocabulary", "conjugation", "dialogue", "grammar", "phrase", "sentence structure", "culture", "pronunciation", "verb", "noun", "adjective", "tense", "gender", "plural", "idiom", "accent", "listening", "speaking", "reading comprehension", "writing practice"],
    "General": ["report", "project", "presentation", "topic", "information", "study", "notes", "concept", "theory", "analysis", "review", "summary", "outline", "proposal", "research paper", "argument", "evidence", "introduction", "conclusion", "body paragraph", "structure", "clarity", "organization", "convention"]
}

# Invert categories for reverse lookup
category_map = {idx: name for idx, name in enumerate(categories.keys())}
# Create a flat list of keywords for direct string matching
all_keywords = {keyword: category for category, keywords in categories.items() for keyword in keywords}

# Specific high-value keywords for prioritization in subject classification
PRIORITY_SCIENCE_KEYWORDS = ["climate", "environment", "biology", "chemistry", "physics", "ecology", "research", "experiment", "hypothesis", "lab", "data", "anatomy", "ecosystem", "molecule", "energy", "evolution", "scientific method"]
PRIORITY_HISTORY_KEYWORDS = ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war", "revolution", "society", "civilization", "constitution", "democracy", "primary source", "secondary source"]

def classify_subject(text, assignment_title):
    """
    Classifies the subject of the assignment based on keywords in the combined text
    (assignment title, rubric, and user text) and the assignment title itself.
    Prioritizes specific high-value keywords.
    """
    text_lower = text.lower()
    assignment_title_lower = assignment_title.lower()

    print(f"DEBUG: classify_subject - text_lower (FULL, SANITIZED): {text_lower}")
    print(f"DEBUG: classify_subject - assignment_title_lower: {assignment_title_lower}")

    # Priority 1: Specific high-value keywords across all text (title + rubric + user_text)
    for keyword in PRIORITY_SCIENCE_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched Science keyword (priority): {keyword}")
            return "Science"

    for keyword in PRIORITY_HISTORY_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched History keyword (priority): {keyword}")
            return "History/Social Studies"

    # Priority 2: Assignment title keywords
    for keyword, category in all_keywords.items():
        if re.search(r'\b' + re.escape(keyword) + r'\b', assignment_title_lower):
            print(f"DEBUG: classify_subject - Matched assignment title keyword: {keyword} -> {category}")
            return category

    # Priority 3: General text keywords (if not already matched)
    for keyword, category in all_keywords.items():
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched general text keyword: {keyword} -> {category}")
            return category

    print("DEBUG: No specific keyword match found. Defaulting to General.")
    return "General"


def find_most_relevant_rubric_point(user_text_embedding, rubric_point_embeddings, rubric_points_list):
    """
    Finds the rubric point semantically most similar to the user's current text.
    """
    if user_text_embedding is None or rubric_point_embeddings is None or len(rubric_points_list) == 0:
        return None, 0.0

    # Ensure embeddings are on the same device and are 2D
    user_text_embedding = user_text_embedding.to(device).view(1, -1) # Ensure it's (1, embedding_dim)
    rubric_point_embeddings = rubric_point_embeddings.to(device) # Should already be (num_points, embedding_dim)

    # Perform cosine similarity calculation on CPU for sklearn compatibility
    similarities = cosine_similarity(user_text_embedding.cpu().numpy(), rubric_point_embeddings.cpu().numpy())

    most_relevant_idx = np.argmax(similarities)
    most_relevant_text = rubric_points_list[most_relevant_idx]
    most_relevant_similarity = similarities[0, most_relevant_idx]

    return most_relevant_text, most_relevant_similarity

# --- Initial Guidance Generation ---
def get_initial_guidance(detected_subject, first_rubric_point_lower):
    """Generates an initial prompt for a blank page based on subject and rubric."""
    guidance_map = {
        "Creative Writing": "Perhaps you can start with a compelling opening hook or introduce your main character, setting the scene for your story.",
        "Math": "How about outlining the first step to solving the problem, clearly showing your approach to the equation or concept?",
        "Art/Music": "Consider writing about your initial concept, sketch, or the main theme of your composition. What is the core idea you want to convey?",
        "Foreign Language": "Try writing your first sentence in the target language, or explaining how you'd begin to approach the conversation/topic in that language.",
    }

    if detected_subject in guidance_map:
        print(f"DEBUG: Initial Prompt - {detected_subject} subject detected. Guidance: {guidance_map[detected_subject]}")
        return guidance_map[detected_subject]
    elif detected_subject in ["Science", "History/Social Studies", "Reading/ELA", "General"]:
        print(f"DEBUG: Initial Prompt - Academic subject detected. Checking for specific intro phrases.")
        # Refined regex for topic extraction
        match = re.search(r"clearly introduce the topic of\s*(.+?)(?:\.|\s*and\s*its\s*impact|\s*that\s*is\s*relevant\s*to\s*the\s*assignment|$|\s*and\s*briefly\s*outline\s*your\s*main\s*points)", first_rubric_point_lower)
        if match:
            topic_phrase = match.group(1).strip()
            if topic_phrase.endswith('.'):
                topic_phrase = topic_phrase[:-1]
            print(f"DEBUG: Initial Prompt - Topic phrase extracted: {repr(topic_phrase)}")
            return f"How about starting with a clear introduction to the topic of **{topic_phrase}**, setting the stage for your discussion?"
        elif "concise thesis statement outlining the main arguments" in first_rubric_point_lower:
            print(f"DEBUG: Initial Prompt - Found 'concise thesis statement'.")
            return "Consider starting with a concise thesis statement outlining your main arguments for the essay."
        elif "introduce the topic" in first_rubric_point_lower: # More general than "clearly introduce the topic of"
            print(f"DEBUG: Initial Prompt - Found 'introduce the topic'.")
            return "Perhaps you can begin with a clear introduction to the topic."
        elif "introduction" in first_rubric_point_lower:
            print(f"DEBUG: Initial Prompt - Found 'introduction' (general).")
            return "How about writing a strong introductory paragraph to get your ideas flowing?"
        else:
            print(f"DEBUG: Initial Prompt - No specific intro instruction found for academic subject. Defaulting to general academic intro.")
            return "What's the first thing you want to write? A strong introductory paragraph is often a good start."
    else: # Fallback for any other unhandled detected_subject
        print(f"DEBUG: Initial Prompt - Unhandled subject type. Defaulting to general intro.")
        return "What's the first thing you want to write? A clear introductory paragraph is usually a good starting point."

# --- Specific Rephrasing Rules for Rubric Concepts ---
# Map specific rubric point phrases to a rephrased concept for cleaner output.
# These should be lowercased keys.
RUBRIC_CONCEPT_REPHRASING = {
    "discuss the reduction of greenhouse gas emissions and its effect on climate change": "reducing greenhouse gas emissions and its effect on climate change",
    "define renewable energy comprehensively": "defining renewable energy comprehensively",
    "describe at least three different types of renewable energy": "describing different types of renewable energy (e.g., solar, wind, hydro)",
    "show your steps for solving the problem": "showing your steps for solving the problem",
    "analyze the use of color and light in the painting": "analyzing the use of color and light in the painting",
    # Add more as needed
}

def get_rephrased_rubric_concept(rubric_point_text):
    """Applies specific rephrasing rules to a rubric concept."""
    return RUBRIC_CONCEPT_REPHRASING.get(rubric_point_text.lower(), rubric_point_text)

# ----------------------------------------------------
# 💡 CORE LISA LOGIC
# ----------------------------------------------------
def generate_lisa_response(
    assignment_title, rubric, user_text, previous_user_text,
    inactivity_timer_fired, paragraph_finished, sentence_finished,
    current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
    predicted_class, most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
    detected_subject, recent_sentence_completed, assignment_complete
):
    # --- 1. Initial Blank Page / Introductory Prompt ---
    if not user_text.strip() and not assignment_complete:
        initial_guidance = ""
        if rubric_points_list:
            first_rubric_point_lower = rubric_points_list[0].lower()
            print(f"DEBUG: Initial Prompt - First rubric point for processing: {repr(first_rubric_point_lower)}")
            initial_guidance = get_initial_guidance(detected_subject, first_rubric_point_lower)
        else:
            print("DEBUG: Initial Prompt - No rubric points found. Defaulting.")
            initial_guidance = "What's the first thing you want to write? A strong introductory paragraph is usually a good place to begin."

        print(f"DEBUG: Initial Prompt - Detected subject: {detected_subject}")
        print(f"DEBUG: Initial Prompt - Final initial_guidance: {initial_guidance}")

        lisa_response = (
            f"Let's get started! Your teacher has given you \"{assignment_title}\". "
            f"{initial_guidance}"
        )
        return lisa_response

    # --- 2. Natural Output Nudge (when user has typed and relevant rubric point found) ---
    if most_relevant_rubric_point_text and user_text.strip() and most_relevant_rubric_point_similarity > SIMILARITY_THRESHOLD_NUDGE:
        rephrased_rubric_concept = get_rephrased_rubric_concept(most_relevant_rubric_point_text)

        # Dynamically summarize user's text for 'user_text_brief'
        user_text_brief = user_text.strip()
        print(f"DEBUG: User text before brief processing: '{user_text_brief}')")

        if len(user_text_brief) > 70:
            user_text_brief = user_text_brief[:67] + "..."
            print("DEBUG: user_text_brief set by truncation.")
        else:
            print("DEBUG: user_text_brief kept as original (no specific match/truncation needed).")

        print(f"DEBUG: Final user_text_brief: '{user_text_brief}'")

        follow_up_questions_general = [
            f"How can we connect your current thoughts to **{rephrased_rubric_concept}**?",
            f"What more can you add about **{rephrased_rubric_concept}** to provide greater depth or detail?",
            f"Can you elaborate further on **{rephrased_rubric_concept}**?",
            f"How does your point relate to **{rephrased_rubric_concept}** more specifically? Could you provide examples?",
            f"What specific examples or supporting evidence can you include to strengthen your coverage of **{rephrased_rubric_concept}**?",
            f"How can you expand on this to ensure you cover all necessary aspects of **{rephrased_rubric_concept}** as mentioned in the rubric?",
            f"What are the key elements of **{rephrased_rubric_concept}** you'd like to discuss next to ensure you're addressing the prompt fully?",
            f"To fully address **{rephrased_rubric_concept}**, what additional information or perspectives might be crucial to include?",
            f"Consider exploring **{rephrased_rubric_concept}** from another angle or with more supporting arguments.",
            f"You've touched on **{rephrased_rubric_concept}**. How can you develop this idea further or provide more specific insights?",
            f"What details can you add to really flesh out your thoughts on **{rephrased_rubric_concept}**?",
            f"Have you considered all the facets of **{rephrased_rubric_concept}**? What else could be included?"
        ]

        follow_up_questions_high_sim = [
            f"That's a strong start on **{rephrased_rubric_concept}**! What's the next key detail or argument you want to add to complete this point?",
            f"Excellent! You're really covering **{rephrased_rubric_concept}** well. How can you build on this to add more depth or nuance?",
            f"Perfect! Now that you've clearly addressed **{rephrased_rubric_concept}**, what's the next logical step or transition to the next part of your assignment?",
            f"You've clearly grasped **{rephrased_rubric_concept}**. Is there anything else you'd like to reinforce or clarify about this part before moving on?",
            f"Fantastic progress on **{rephrased_rubric_concept}**! What's the most impactful next piece of information you can provide to elevate your discussion?",
            f"You're doing great with **{rephrased_rubric_concept}**! How can you ensure this point is as robust and complete as possible?",
            f"Wonderful! Your work on **{rephrased_rubric_concept}** is solid. What's the next big idea you want to introduce?",
        ]

        # Choose question based on similarity threshold
        if most_relevant_rubric_point_similarity > SIMILARITY_THRESHOLD_HIGH_COVERAGE:
            chosen_question = random.choice(follow_up_questions_high_sim)
            lisa_response = f"Excellent! {chosen_question}"
            return lisa_response
        else:
            chosen_question = random.choice(follow_up_questions_general)
            lisa_response = (
                f"Keep up the great work! Your sentence on '{user_text_brief}' is a good start, but {chosen_question.lower()}"
            )
            return lisa_response

    # --- 3. Default/Fallback Responses (if no specific nudge above is returned) ---
    if inactivity_timer_fired:
        return "It looks like you've been inactive for a bit. Do you need some help continuing with this section?"
    elif sentence_finished:
        return "That's a solid sentence. What's the next point you want to make or how does this connect to the rubric?"
    elif paragraph_finished:
        return "Great work on that paragraph! What's the next section you plan to tackle, or how can you deepen the current ideas?"
    else:
        # Generic prompt if no specific rubric match or other trigger
        return "Keep writing! I'm here to help you develop your ideas and ensure you cover all aspects of your assignment."


# ----------------------------------------------------
# 🌐 Flask Routes
# ----------------------------------------------------
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
        previous_user_text = data.get('previous_user_text', '') # Kept for future use if needed
        inactivity_timer_fired = data.get('inactivity_timer_fired', False)
        paragraph_finished = data.get('paragraph_finished', False)
        sentence_finished = data.get('sentence_finished', False)
        assignment_complete = data.get('assignment_complete', False)
        recent_sentence_completed = data.get('recent_sentence_completed', False)

        # Process Rubric (split into points)
        # Using a more robust regex to handle various bullet types and bolding
        rubric_points = [point.strip() for point in re.split(r'\n[*-]?\s*|\*\*(.*?)\*\*', rubric) if point and point.strip() and not point.strip().startswith('**')]
        rubric_points_list = []
        for point in rubric_points:
            cleaned_point = re.sub(r'^\s*[-*•]?\s*', '', point).strip() # Clean leading bullets/hyphens
            if cleaned_point:
                rubric_points_list.append(cleaned_point)

        # Embed rubric points
        rubric_point_embeddings = None
        if sbert_model and rubric_points_list:
            rubric_point_embeddings = sbert_model.encode(rubric_points_list, convert_to_tensor=True).to(device)
        else:
            print("Warning: Rubric points or SentenceTransformer model not available for embedding. Cannot provide rubric-specific feedback.")

        # Embed current user text
        current_text_embedding = None
        if sbert_model and user_text.strip():
            current_text_embedding = sbert_model.encode(user_text, convert_to_tensor=True).to(device)
        else:
            print("Warning: User text not available for embedding. Cannot provide text-specific feedback.")

        # Embed assignment title (if needed, though not directly used in core response generation now)
        title_embedding = None
        if sbert_model and assignment_title.strip():
            title_embedding = sbert_model.encode(assignment_title, convert_to_tensor=True).to(device)


        # Initialize predicted_class (still not used for prediction in this version, but kept for signature)
        predicted_class = None
        most_relevant_rubric_point_text = None
        most_relevant_rubric_point_similarity = 0.0

        if current_text_embedding is not None and rubric_point_embeddings is not None and rubric_point_embeddings.numel() > 0:
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity = \
                find_most_relevant_rubric_point(current_text_embedding, rubric_point_embeddings, rubric_points_list)
            print(f"Most relevant rubric point: '{most_relevant_rubric_point_text}' (Similarity: {most_relevant_rubric_point_similarity:.2f})")
        else:
            print("Warning: Cannot find most relevant rubric point (missing user text embedding or rubric embeddings).")


        # Subject detection uses the rule-based classify_subject function
        # Combine relevant texts for subject classification
        combined_text_for_subject = assignment_title + " " + rubric + " " + user_text
        detected_subject = classify_subject(combined_text_for_subject, assignment_title)
        print(f"Detected Subject: {detected_subject}")


        # Call generate_lisa_response with all necessary (and computed) arguments
        lisa_response = generate_lisa_response(
            assignment_title, rubric, user_text, previous_user_text,
            inactivity_timer_fired, paragraph_finished, sentence_finished,
            current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
            predicted_class, # Now correctly passed but still unused for prediction logic
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
            detected_subject, recent_sentence_completed, assignment_complete
        )
        print(f"DEBUG: LISA response being sent to frontend: {lisa_response}")
        return jsonify({"suggested_next_step": lisa_response})

    except Exception as e:
        print(f"An error occurred in lisa_prompt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# Make sure this part is at the very end of your file
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)