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

print("----- LISA IS LOADING VERSION 0.3.9 (Deeply Contextual Nudges) -----")

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

# ----------------------------------------------------
# 🧠 Detect Device (MPS or CPU)
# ----------------------------------------------------
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")


# ----------------------------------------------------
# 🧠 Load Sentence Transformer Model (and move to detected device)
# ----------------------------------------------------
try:
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    sbert_model = None

# ------------------------------------
# 🧠 A tiny neural "reasoning" engine
# ------------------------------------
class LisaNeuralNet(nn.Module):
    # CHANGED: input_size from 768 to 384 to match 'all-MiniLM-L6-v2' embeddings
    def __init__(self, input_size=384, hidden_size=128): 
        super(LisaNeuralNet, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 3) # Output classes: Intro, Inactivity, Advance/Paragraph

    def forward(self, x):
        x = F.relu(self.fc1(x))
        return self.fc2(x)

# ----------------------------------------
# 🧠 Prepare model (on boot) and move to detected device
# ----------------------------------------
model = LisaNeuralNet(input_size=384).to(device) # CHANGED: input_size here too


# ----------------------------------------
# Helper for cleaning and splitting rubric points
# ----------------------------------------
def clean_and_split_rubric(rubric_text):
    if not rubric_text:
        return []
    rubric_text = re.sub(r'[\d]+\.|\*|-|\•', '\n', rubric_text)
    points = [p.strip() for p in rubric_text.split('\n') if p.strip()]
    return points

# ----------------------------------------
# Helper for formatting rubric points for LISA's display
# ----------------------------------------
def format_rubric_point_for_lisa(point_text):
    """Removes percentage and extra formatting for cleaner display in LISA's response."""
    # Remove things like (10%) or (5%)
    clean_point = re.sub(r'\s*\(\d+%\)\s*', '', point_text).strip()
    # Remove leading dashes or numbers, if they somehow persist
    clean_point = re.sub(r'^[-\d\.\s]+', '', clean_point).strip()
    return clean_point

# ----------------------------------------
# Helper for cleaning assignment title for display
# ----------------------------------------
def get_display_assignment_title(full_title):
    """
    Extracts a cleaner, more natural assignment title for display.
    e.g., "Research Essay: Climate Change" -> "Climate Change essay"
    """
    parts = full_title.split(':')
    if len(parts) > 1:
        # Check if the prefix implies "essay" or "report" etc.
        prefix_lower = parts[0].strip().lower()
        if "essay" in prefix_lower or "report" in prefix_lower or "paper" in prefix_lower:
            return f"{parts[1].strip()} essay"
        elif "project" in prefix_lower:
            return f"{parts[1].strip()} project"
        elif "assignment" in prefix_lower:
            return f"{parts[1].strip()} assignment"
        return f"{parts[1].strip()}" # Default if no clear type
    
    # If no colon, just append "assignment" for naturalness
    return f"{full_title.strip()} assignment"


# ----------------------------------------
# Helper for finding most relevant rubric point
# ----------------------------------------
def find_most_relevant_rubric_point(user_text_embedding, rubric_point_embeddings, original_rubric_points):
    if user_text_embedding is None or rubric_point_embeddings.numel() == 0:
        return None, 0.0

    user_text_embedding_np = user_text_embedding.cpu().numpy().reshape(1, -1)
    rubric_point_embeddings_np = rubric_point_embeddings.cpu().numpy()
    
    similarities = cosine_similarity(user_text_embedding_np, rubric_point_embeddings_np)[0]
    
    most_similar_idx = np.argmax(similarities)
    max_similarity = similarities[most_similar_idx]

    return original_rubric_points[most_similar_idx], max_similarity

# ----------------------------------------
# Basic Subject Classification
# ----------------------------------------
def classify_subject(text, assignment_title=""):
    # Start with the raw lowercased text
    text_lower_raw = text.lower()

    # Sanitize text by removing non-printable ASCII characters and replacing multiple spaces
    text_lower = re.sub(r'[^\x20-\x7E\s]+', '', text_lower_raw).strip()
    text_lower = re.sub(r'\s+', ' ', text_lower) # Replace sequences of whitespace with a single space

    assignment_title_lower = assignment_title.lower()

    print(f"DEBUG: classify_subject - text_lower (FULL, SANITIZED): {text_lower}")
    print(f"DEBUG: classify_subject - assignment_title_lower: {assignment_title_lower}")

    # Helper function to check for whole word match using regex
    def has_word(text, keywords):
        for keyword in keywords:
            # \b ensures a whole word match
            if re.search(r'\b' + re.escape(keyword) + r'\b', text):
                print(f"DEBUG: Matched word-boundary keyword: {keyword}")
                return True
        return False

    # Creative Writing (highest priority due to distinct style)
    creative_writing_keywords = ["poem", "story", "fiction", "creative", "narrative", "poetry"]
    if any(keyword in assignment_title_lower for keyword in creative_writing_keywords) or \
       has_word(text_lower, ["creative writing", "story"]): # Use has_word for multi-word phrases or specific words
        print("DEBUG: classify_subject - Matched Creative Writing")
        return "Creative Writing"

    # Math
    math_keywords = ["equation", "solve for x", "graph", "formula", "algebra", "calculus", "geometry", "proof", "math", "theorem", "numeric", "derive"]
    if has_word(text_lower, math_keywords):
        print("DEBUG: classify_subject - Matched Math")
        return "Math"

    # Science - UPDATED keywords for better climate/environment detection
    science_keywords = ["experiment", "hypothesis", "data", "biology", "chemistry", "physics", "scientific method", "research", "lab", "science", "observation", "analysis", "conclusion",
                                                "climate change", "environment", "environmental", "ecology", "renewable energy", "sustainability", "ecosystem", "geology"]
    if has_word(text_lower, science_keywords):
        print("DEBUG: classify_subject - Matched Science")
        return "Science"

    # Reading/ELA
    ela_keywords = ["theme", "character", "plot", "literary analysis", "poetry", "novel", "rhetoric", "argument", "evidence", "essay", "writing", "english", "literature", "author", "textual"]
    if has_word(text_lower, ela_keywords):
        print("DEBUG: classify_subject - Matched Reading/ELA")
        return "Reading/ELA"

    # History/Social Studies
    history_keywords = ["history", "event", "period", "figure", "document", "source", "analysis", "social studies", "geography", "civics", "cause", "effect", "historical"]
    if has_word(text_lower, history_keywords):
        print("DEBUG: classify_subject - Matched History/Social Studies")
        return "History/Social Studies"
    
    print("DEBUG: classify_subject - Defaulting to General")
    return "General"


# ----------------------------------------
# 🧠 Simple Plagiarism/Copy-Paste Detection (ULTRA DEBUG)
# ----------------------------------------
def detect_copy_paste(user_text, previous_text=""):
    clean_user_text = re.sub(r'\s+', ' ', user_text).strip()
    clean_previous_text = re.sub(r'\s+', ' ', previous_text).strip()

    print("\n--- DEBUG: Copy-Paste Detection Call ---")
    print(f"  Clean User Text (len {len(clean_user_text)}): '{clean_user_text[:min(len(clean_user_text), 70)]}...'")
    print(f"  Clean Previous Text (len {len(clean_previous_text)}): '{clean_previous_text[:min(len(clean_previous_text), 70)]}...'")
    print(f"  Raw User Text (len {len(user_text)}): '{user_text[:min(len(user_text), 70)]}...'")
    print(f"  Raw Previous Text (len {len(previous_text)}): '{previous_previous_text[:min(len(previous_text), 70)]}...'")

    raw_length_increase = len(user_text) - len(previous_text)
    
    if raw_length_increase > 0 and raw_length_increase <= 2 and clean_user_text == clean_previous_text:
        print(f"  SKIPPED: Rule (Very small raw typing addition, length={raw_length_increase}, cleaned texts identical)")
        print("--- DEBUG: No Copy-Paste Detected ---")
        return False

    if len(clean_previous_text) == 0:
        if len(clean_user_text) > 500: 
            print("  TRIGGERED: Rule 2a (Large Initial Paste from Empty, > 500 chars)")
            return True
        print("  SKIPPED: Rule 2a (Previous text empty, current not excessively long)")
        print("--- DEBUG: No Copy-Paste Detected ---")
        return False

    if len(clean_previous_text) < 30 and "start writing" in clean_previous_text.lower():
        print(f"  SKIPPED: Rule 2b (Previous text was short placeholder, len {len(clean_previous_text)})")
        print("--- DEBUG: No Copy-Paste Detected ---")
        return False

    if clean_user_text == clean_previous_text and len(clean_user_text) > 10:
        print("  TRIGGERED: Rule 1 (Near Exact Match after cleaning, & > 10 chars, raw diff > 2)")
        return True

    length_increase_ratio = len(clean_user_text) / len(clean_previous_text) if len(clean_previous_text) > 0 else 0
    
    common_prefix_length = 0
    if len(clean_user_text) > 0 and len(clean_previous_text) > 0:
        for i in range(min(len(clean_user_text), len(clean_previous_text))):
            if clean_user_text[i] == clean_previous_text[i]:
                common_prefix_length += 1
            else:
                break
    
    prefix_match_ratio = (common_prefix_length / len(clean_previous_text)) if len(clean_previous_text) > 0 else 0

    print(f"  Calculations: raw_length_increase={raw_length_increase}, length_increase_ratio={length_increase_ratio:.2f}, common_prefix_length={common_prefix_length}, prefix_match_ratio={prefix_match_ratio:.2f}")

    if prefix_match_ratio < 0.7 and length_increase_ratio > 3.0: 
         print(f"  TRIGGERED: Rule 2c (Significant Jump ({length_increase_ratio:.2f} > 3.0) AND No Strong Prefix ({prefix_match_ratio:.2f} < 0.7))")
         return True

    print("--- DEBUG: No Copy-Paste Detected ---")
    return False

# ----------------------------------------
# 🧠 Helper Functions for Deeper Analysis (Placeholders for now)
# ----------------------------------------

def is_claim_without_evidence(sentence_text: str, detected_subject: str, sbert_model, device) -> bool:
    """
    Identifies if a sentence makes a claim without explicit evidence.
    Placeholder for detailed implementation.
    """
    # Example basic checks (will need more sophisticated semantic analysis)
    claim_keywords = ["i believe", "it is clear that", "should", "is important", "i argue", "my opinion is", "consequently", "therefore", "thus", "clearly", "undoubtedly"]
    evidence_indicators = ["for example", "for instance", "studies show", "research indicates", "according to", "data suggests", "statistics reveal", "proof", "demonstrates", "illustrates", "cite", "source", "figure", "table"]

    text_lower = sentence_text.lower()
    
    # Simple check for claim keywords
    is_claim = any(keyword in text_lower for keyword in claim_keywords)
    # Simple check for absence of evidence indicators
    has_evidence = any(indicator in text_lower for indicator in evidence_indicators) or \
                   re.search(r'\b\d{4}\b', text_lower) or \
                   re.search(r'\b\d+\.?\d*\s*(%|million|billion|trillion)\b', text_lower)
    
    # This is a very basic heuristic. Real implementation would involve NLP and deeper semantic analysis.
    return is_claim and not has_evidence

def is_evidence_without_explanation(user_text: str, recent_sentence_completed: str, sbert_model, device) -> bool:
    """
    Identifies if a sentence presents evidence but lacks subsequent analysis/explanation.
    Placeholder for detailed implementation.
    """
    # This is complex and would ideally involve comparing embeddings of the current sentence
    # with a potential "explanation" sentence (e.g., the next sentence if it exists).
    # For now, a very basic heuristic might be:
    evidence_indicators = ["for example", "for instance", "studies show", "research indicates", "according to", "data suggests", "statistics reveal", "proof", "demonstrates", "illustrates", "cite", "source", "figure", "table"]
    
    if not recent_sentence_completed:
        return False

    recent_sentence_lower = recent_sentence_completed.lower()
    if any(indicator in recent_sentence_lower for indicator in evidence_indicators) or \
       re.search(r'\b\d{4}\b', recent_sentence_lower) or \
       re.search(r'\b\d+\.?\d*\s*(%|million|billion|trillion)\b', recent_sentence_lower):
        
        # This is a very simplistic check. In a real scenario, you'd analyze the next sentence.
        # For this placeholder, assume if the user text *just* contains the evidence and
        # not much more, it might need explanation.
        remaining_text_after_recent = user_text.lower().replace(recent_sentence_completed.lower(), "").strip()
        if len(remaining_text_after_recent.split()) < 10: # If very little text follows the evidence
            return True
            
    return False


def needs_definition_or_clarification(user_text: str, assignment_title: str, rubric: str, sbert_model, device) -> bool:
    """
    Identifies if complex terms are used without clear definition.
    Placeholder for detailed implementation.
    """
    combined_context = (assignment_title + " " + rubric + " " + user_text).lower()
    
    # Identify potential complex terms from rubric/assignment title
    potential_terms = set()
    for text_block in [rubric, assignment_title]:
        # Simple regex to find multi-word terms or capitalized words that aren't at sentence start
        matches = re.findall(r'\b[A-Z][a-z]+(?: [A-Z][a-z]+)?\b|\b[a-z]+(?: [a-z]+){1,3}\b', text_block)
        for m in matches:
            if len(m.split()) > 1 or (len(m.split()) == 1 and m.istitle() and m not in ["I", "The", "A", "An"]): # Basic filter
                 potential_terms.add(m.lower())
    
    # Very rudimentary check: if a potential term is in user_text but not followed by
    # a definition pattern (e.g., "is defined as", "means that")
    definition_patterns = ["is defined as", "means that", "refers to", "can be described as"]
    
    for term in potential_terms:
        if term in user_text.lower():
            # Check if definition pattern appears near the term
            found_definition = False
            for pattern in definition_patterns:
                if f"{term} {pattern}" in user_text.lower() or \
                   f"{pattern} {term}" in user_text.lower(): # Covers cases like "defined as X"
                    found_definition = True
                    break
            if not found_definition:
                return True # Term used without apparent definition
                
    return False

# ----------------------------------------
# 🧠 Logic for Generating Suggestions (More Contextual and Dynamic)
# ----------------------------------------
def generate_lisa_response(assignment_title, rubric, user_text, previous_user_text, inactivity_timer_fired, paragraph_finished, sentence_finished,
                           current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list, predicted_class,
                           most_relevant_rubric_point_text, most_relevant_rubric_point_similarity, detected_subject, recent_sentence_completed,
                           assignment_complete): 

    response = ""
    
    clean_user_text = re.sub(r'\s+', ' ', user_text).strip()
    clean_previous_text = re.sub(r'\s+', ' ', previous_user_text).strip()

    last_meaningful_sentence = ""
    last_meaningful_sentence_for_prompt = "that idea" # Default placeholder

    if not user_text.strip() and not assignment_complete: # Check if user_text is empty or just whitespace
        example_intro = ""
        # Determine an appropriate introductory example based on the detected subject and rubric
        if detected_subject == "Creative Writing":
            example_intro = "compelling opening hook or introduce your main character"
        elif detected_subject in ["Science", "History/Social Studies", "Reading/ELA", "General"]:
            if rubric_points_list:
                first_rubric_point_lower = rubric_points_list[0].lower() # Convert to lower once
                
                if "introduction" in first_rubric_point_lower: # Check if the first point is about introduction
                    if "concise thesis statement outlining the main arguments" in first_rubric_point_lower:
                        example_intro = "concise thesis statement outlining your main arguments"
                    elif "clearly introduce the topic of" in first_rubric_point_lower:
                        # Attempt to extract the specific topic from the rubric
                        # This regex tries to capture everything after "clearly introduce the topic of" until a period or next section indicator
                        match = re.search(r"clearly introduce the topic of (.+?)(?:\.|$|-| - )", first_rubric_point_lower)
                        if match:
                            topic_phrase = match.group(1).strip()
                            # Clean up common trailing words if they were captured by the regex (e.g., from "- Define...")
                            if topic_phrase.endswith(" and its importance"):
                                # If it ends with "and its importance", keep it as it's part of the requirement
                                pass
                            elif topic_phrase.endswith(" -"): # Catch common rubric formatting
                                topic_phrase = topic_phrase[:-2].strip()
                            
                            example_intro = f"clear introduction to the topic of **{topic_phrase}**"
                        else:
                            # Fallback if specific topic extraction fails
                            example_intro = "clear introduction to the topic and its importance"
                    elif "introduce the topic" in first_rubric_point_lower: # More general case
                        example_intro = "clear introduction to the topic"
                    else: # General intro guidance if no specific keywords match
                        example_intro = "strong introductory paragraph"
                else: # Fallback if the first rubric point isn't clearly about the intro
                    example_intro = "strong introductory paragraph"
            else: # Fallback if no rubric points are available
                example_intro = "strong introductory paragraph"
        else: # Fallback for any other unexpected subject or scenario
            example_intro = "clear introductory paragraph"

        lisa_response = (
            f"Let's get started! Your teacher has given you \"{assignment_title}\"."
            f" For starters, what is the first thing we can write? Maybe a {example_intro} perhaps?"
        )
        return lisa_response # LISA returns this prompt immediately if user_text is empty

    if sentence_finished and clean_user_text: 
        sentences_in_user_text = re.findall(r'[^.!?\n]+[.!?\n]*', clean_user_text)
        
        meaningful_sentences_in_user_text = [
            s.strip() for s in sentences_in_user_text
            if s.strip() and not all(char in string.punctuation or char.isspace() for char in s.strip())
        ]

        if meaningful_sentences_in_user_text:
            last_meaningful_sentence = meaningful_sentences_in_user_text[-1]
            if last_meaningful_sentence and last_meaningful_sentence[-1] in '.!?':
                last_meaningful_sentence = last_meaningful_sentence[:-1].strip()
            
            if last_meaningful_sentence: # Use the actual sentence if found
                last_meaningful_sentence_for_prompt = f'"{last_meaningful_sentence}"'
            else: # Fallback if no full sentence detected, but some input came in
                last_meaningful_sentence_for_prompt = "your recent thought"

    # --- Varied Encouragement Phrases ---
    positive_feedback_phrases = [
        "Excellent point!", "You're on the right track!", "That's a great start!", 
        "Fantastic insight!", "Keep up the great work!", "Impressive writing!",
        "You're making great progress!", "Nicely done!"
    ]

    # --- Refined Rubric Engagement (Beyond Simple Similarity) ---
    # This logic takes precedence if a relevant rubric point is found
    if most_relevant_rubric_point_text:
        # When most_relevant_rubric_point_similarity is moderate (e.g., 0.5-0.75):
        if 0.5 <= most_relevant_rubric_point_similarity <= 0.75:
            response = random.choice(positive_feedback_phrases) + " " + random.choice([
                f"Your last sentence about {last_meaningful_sentence_for_prompt} relates to the rubric's point on '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}', but could you expand on how your point contributes to fully addressing it?",
                f"You're touching on '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}' with {last_meaningful_sentence_for_prompt}. What more can you add to develop this idea completely?",
                f"Good start connecting to '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}' with {last_meaningful_sentence_for_prompt}. What specific details are still needed to fully meet this rubric requirement?",
                f"Your thought on {last_meaningful_sentence_for_prompt} is relevant to '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}'. How can you deepen your explanation or provide more context?"
            ])
            return response
        # When most_relevant_rubric_point_similarity is low (e.g., <0.5):
        elif most_relevant_rubric_point_similarity < 0.5 and most_relevant_rubric_point_similarity > 0.0: # Ensure it's not zero similarity, meaning no relevant point was found at all
            response = random.choice([
                f"While your current thought on {last_meaningful_sentence_for_prompt} is interesting, the rubric point '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}' seems to be a more direct focus for this section. How can you shift your writing to address that?",
                f"Your text about {last_meaningful_sentence_for_prompt} is not strongly aligned with '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}'. Consider re-evaluating your focus.",
                f"The rubric point '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}' is important here. How can you reframe {last_meaningful_sentence_for_prompt} to better address it?",
                f"It seems {last_meaningful_sentence_for_prompt} is moving away from the closest rubric point: '{format_rubric_point_for_lisa(most_relevant_rubric_point_text)}'. What specific part of this rubric point are you trying to address?"
            ])
            return response
    
    # --- Define specific prompt lists with placeholders for dynamic content ---
    # GENERAL PROMPT TEMPLATES (can be used for any subject if no specific one is available)
    default_elaboration_prompts = [
        "That's a good point! How can you elaborate on {last_meaningful_sentence_for_prompt}? Are there more specific details or explanations you could add?",
        "To make {last_meaningful_sentence_for_prompt} even stronger, consider expanding on it. What further insights or explanations can you offer?",
        "Tell me more about why {last_meaningful_sentence_for_prompt} is important. What makes it stand out and how it contributes to your writing?",
        "Interesting idea! Can you dive a bit deeper into what you mean with {last_meaningful_sentence_for_prompt}? What kind of details would help your reader understand fully?",
        "You've got a solid foundation with {last_meaningful_sentence_for_prompt}. Now, how can you build upon that with more specific information or a clearer explanation?",
        "Let's unpack {last_meaningful_sentence_for_prompt} a bit. What are the key components or nuances of this idea that you want to highlight?",
        "That's a good claim with {last_meaningful_sentence_for_prompt}. What evidence or explanation can you add to really convince your reader?"
    ]
    default_evidence_prompts = [
        "What evidence or data supports {last_meaningful_sentence_for_prompt}? Can you include a specific example or source, even if it's conceptual for now?",
        "Where did you get this information for {last_meaningful_sentence_for_prompt}? Could you mention the source or type of evidence to back this up?",
        "How can you strengthen {last_meaningful_sentence_for_prompt}? What facts, figures, or examples could you provide?",
        "To support {last_meaningful_sentence_for_prompt}, what specific facts or data can you include? Remember to provide strong evidence for your statements.",
        "Can you provide a concrete example or a piece of research to illustrate {last_meaningful_sentence_for_prompt}?",
        "What statistics, facts, or expert opinions could you bring in to reinforce {last_meaningful_sentence_for_prompt}?",
        "How are you backing up {last_meaningful_sentence_for_prompt}? What proof or demonstration can you offer?",
        "It's good to state your ideas. What evidence makes {last_meaningful_sentence_for_prompt} undeniable? What can you cite or show?"
    ]
    default_analysis_prompts = [
        "You've stated {last_meaningful_sentence_for_prompt}. Now, what's your analysis or interpretation of it? What does it mean in context?",
        "Why is {last_meaningful_sentence_for_prompt} significant to your overall argument? What deeper meaning or implications does it have?",
        "Beyond stating {last_meaningful_sentence_for_prompt}, how can you break down and explain the importance of this idea?",
        "Okay, so what does {last_meaningful_sentence_for_prompt} tell us? Delve deeper into the underlying meaning or consequences of this idea.",
        "What insights can you draw from {last_meaningful_sentence_for_prompt}? How does this piece of information contribute to your larger argument?",
        "Don't just present information; analyze it! What conclusions can you reach based on {last_meaningful_sentence_for_prompt}?",
        "What's the 'so what?' behind {last_meaningful_sentence_for_prompt}? Why should your reader care, and what is its true impact?",
        "How does {last_meaningful_sentence_for_prompt} connect to your thesis, and what deeper understanding does it offer?"
    ]
    default_connection_prompts = [
        "How does {last_meaningful_sentence_for_prompt} connect to your main thesis or the overall goal of your assignment? Can you make the link clearer?",
        "Can you clarify the relationship between {last_meaningful_sentence_for_prompt} and the idea before it? How do they fit together?",
        "What's the significance of this connection you're making from {last_meaningful_sentence_for_prompt}? How does it build your overall argument?",
        "Ensure your ideas flow logically. How does {last_meaningful_sentence_for_prompt} relate to what comes next in your essay? How are they tied?",
        "Think about the coherence of your argument. How does {last_meaningful_sentence_for_prompt} bridge to the next, creating a smooth flow?",
        "Is the logical leap clear after {last_meaningful_sentence_for_prompt}? How can you explicitly show the connection between this point and the next?",
        "How do {last_meaningful_sentence_for_prompt} and other pieces of your argument interrelate? What's the thread that ties them all together?",
        "Help your reader follow your thought process. What's the link between {last_meaningful_sentence_for_prompt} and the broader argument?"
    ]
    default_transition_prompts = [
        "What's the next logical step in your argument after {last_meaningful_sentence_for_prompt}? How will you smoothly transition from this idea to the next?",
        "You've completed the thought with {last_meaningful_sentence_for_prompt}. What point will you make next to continue your essay? How will you introduce it?",
        "Consider how you'll move from {last_meaningful_sentence_for_prompt} to the next paragraph. What's the best way to bridge these ideas naturally?",
        "How does {last_meaningful_sentence_for_prompt} lead to your next argument or supporting detail? Think about a smooth link.",
        "Alright, you've wrapped up {last_meaningful_sentence_for_prompt}. What's the best way to introduce your next topic or supporting point?",
        "To ensure a seamless flow, what transitional words or phrases could you use after {last_meaningful_sentence_for_prompt} to move into the next part?",
        "Where do you want to take your reader next after {last_meaningful_sentence_for_prompt}? How can you guide them smoothly to your next idea?",
        "You're doing great! Now, how do you plan to transition to the next key argument or piece of evidence from {last_meaningful_sentence_for_prompt}?"
    ]
    default_introduction_prompts = [
        "Alright, you're working on the introduction. Does {last_meaningful_sentence_for_prompt} clearly state your thesis or main argument?",
        "Have you provided enough background context for your topic in the introduction, considering {last_meaningful_sentence_for_prompt}? What essential information is still missing?",
        "Is it clear what your essay will be about from this introduction, particularly after {last_meaningful_sentence_for_prompt}? What expectations are you setting for the reader?",
        "What's the hook for your introduction? How can you grab the reader's attention from the very beginning, building on {last_meaningful_sentence_for_prompt}?",
        "Your introduction sets the stage. Does it adequately introduce your topic and its relevance, including {last_meaningful_sentence_for_prompt}?",
        "Think about your audience. Does your introduction prepare them for the journey of your essay, perhaps expanding on {last_meaningful_sentence_for_prompt}?",
        "Does your thesis statement here truly represent the core argument you'll develop throughout the essay, informed by {last_meaningful_sentence_for_prompt}?",
        "How strong is your opening? Does it compel the reader to continue, and does it clearly hint at what's to come, based on {last_meaningful_sentence_for_prompt}?"
    ]
    default_conclusion_prompts = [
        "Does this section effectively summarize your main arguments, especially following {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective or final insight?",
        "Have you restated your thesis in a new way and provided a strong sense of closure? How can you leave a lasting impression after {last_meaningful_sentence_for_prompt}?",
        "What's the final takeaway message you want the reader to remember from your essay, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful and memorable?",
        "Review your conclusion. Does it bring all your ideas together concisely and offer a satisfying end, particularly after {last_meaningful_sentence_for_prompt}?",
        "How well does your conclusion bring everything full circle? Does {last_meaningful_sentence_for_prompt} help leave the reader with a strong final thought?",
        "Avoid introducing new information here. Does your conclusion purely reflect and synthesize what's already been discussed, including {last_meaningful_sentence_for_prompt}?",
        "What's the lasting impact you want your essay to have? Does your conclusion achieve that, inspired by {last_meaningful_sentence_for_prompt}?",
        "Take a final look. Does your conclusion provide a clear sense of completeness and powerfully reinforce your main message, particularly after {last_meaningful_sentence_for_prompt}?"
    ]
    default_general_engagement_prompts = [
        "Welcome! Let's get your essay started. What's the core idea you want to explore?",
        "What's the very first point you want to make for your assignment?",
        "Start by outlining your main argument. What's your core thesis statement for this essay?",
        "What's your primary goal for this writing session? How can I help you achieve it?",
        "Hey there! Ready to dive into your assignment? What's the first topic you're thinking of tackling?",
        "Let's kick things off! What's the most exciting or challenging part of this assignment for you?",
        "You've got this! Where should we begin today?",
        "What's on your mind for this writing session? Let's get to work!"
    ]

    math_elaboration_prompts = [
        "That's a good step with {last_meaningful_sentence_for_prompt}! Can you show your work or explain the reasoning behind that calculation in more detail?",
        "To make {last_meaningful_sentence_for_prompt} clearer, could you provide an example or explain more about what your variables or terms represent?",
        "Consider expanding on {last_meaningful_sentence_for_prompt}. What further insights or explanations can you offer about the mathematical concept you're discussing?",
        "Tell me more about why {last_meaningful_sentence_for_prompt} is important for solving this problem. What's its significance?",
        "Can you break down that step in {last_meaningful_sentence_for_prompt} into smaller, more digestible parts? Explain your process!",
        "What assumptions are you making with {last_meaningful_sentence_for_prompt}, and how do they impact your calculation? Can you elaborate?",
        "Help me understand your thought process for this mathematical operation, especially with {last_meaningful_sentence_for_prompt}. What were you thinking?",
        "That's a key step. Now, can you explain the underlying mathematical principle that justifies {last_meaningful_sentence_for_prompt}?"
    ]
    math_evidence_prompts = [
        "What properties or theorems support {last_meaningful_sentence_for_prompt}? Can you include a specific example, axiom, or proof step?",
        "Where did you get this formula or method for {last_meaningful_sentence_for_prompt}? Could you state the mathematical principle or source?",
        "How reliable are your calculations in {last_meaningful_sentence_for_prompt}? How can you verify your solution or prove your statement?",
        "To strengthen your argument, what specific mathematical facts or data can you include to back up {last_meaningful_sentence_for_prompt}?",
        "Which mathematical definition or postulate are you relying on for {last_meaningful_sentence_for_prompt}?",
        "Can you demonstrate {last_meaningful_sentence_for_prompt} with a specific numerical example, or a geometric proof?",
        "What mathematical rule or law makes {last_meaningful_sentence_for_prompt} true? Can you reference it?",
        "Show me the numbers! What data or calculations explicitly support your conclusion from {last_meaningful_sentence_for_prompt}?"
    ]
    math_analysis_prompts = [
        "You've stated {last_meaningful_sentence_for_prompt}. Now, what's your analysis or interpretation of it in the context of the problem? What does it imply?",
        "What are the implications of {last_meaningful_sentence_for_prompt} for your overall solution or proof? How does it move you forward?",
        "Why is {last_meaningful_sentence_for_prompt} significant to your mathematical argument? What deeper meaning does it hold for the problem?",
        "Okay, so what does {last_meaningful_sentence_for_prompt} tell us mathematically? Delve deeper into the underlying meaning or consequence this idea reveals.",
        "How does {last_meaningful_sentence_for_prompt} relate to the original problem statement? What does it mean in practical terms?",
        "What insights can you draw from {last_meaningful_sentence_for_prompt}? Is there a pattern or a bigger picture here?",
        "Beyond the numbers, what's the mathematical significance of {last_meaningful_sentence_for_prompt}?",
        "How does {last_meaningful_sentence_for_prompt} contribute to solving the overall mathematical challenge?"
    ]
    math_connection_prompts = [
        "How does {last_meaningful_sentence_for_prompt} connect to your overall solution or proof? Can you clarify the logical progression?",
        "Can you clarify the link between {last_meaningful_sentence_for_prompt} and the previous one in your mathematical argument? Are the steps clearly connected?",
        "What is the significance of this connection you're making in solving the problem after {last_meaningful_sentence_for_prompt}? Why is it mathematically important?",
        "Ensure your steps flow logically. How does {last_meaningful_sentence_for_prompt} relate to what comes next in your solution or proof? How are they tied?",
        "Are your mathematical steps building on each other in a coherent way, especially after {last_meaningful_sentence_for_prompt}? How can you make the flow more evident?",
        "What's the relationship between {last_meaningful_sentence_for_prompt} and the next mathematical concept you're introducing?",
        "How does this part of your solution lead directly into the next logical step from {last_meaningful_sentence_for_prompt}?",
        "Guide your reader through your mathematical thinking. How does {last_meaningful_sentence_for_prompt} transition to the next calculation?"
    ]
    math_transition_prompts = [
        "What's the next logical step in your mathematical argument or proof after {last_meaningful_sentence_for_prompt}? How will you transition to it?",
        "You've completed that step with {last_meaningful_sentence_for_prompt}. What point or calculation will you make next to continue your solution? How will you introduce it?",
        "Consider how you'll smoothly move from {last_meaningful_sentence_for_prompt} to the next part of the problem. What's the best way to bridge these mathematical ideas?",
        "How does {last_meaningful_sentence_for_prompt} lead to your next argument or calculation? Think about the natural mathematical flow.",
        "Alright, you've successfully completed {last_meaningful_sentence_for_prompt}. What's the next big mathematical concept or problem you'll tackle?",
        "To keep your mathematical explanation flowing, what transitional phrases or logical indicators can you use after {last_meaningful_sentence_for_prompt}?",
        "Where do you want your mathematical explanation to go next after {last_meaningful_sentence_for_prompt}? How can you guide the reader there smoothly?",
        "Great work so far! What's the next step in your mathematical solution, and how will you set it up after {last_meaningful_sentence_for_prompt}?"
    ]
    math_introduction_prompts = [
        "Welcome to your **{assignment_title}**! Let's start strong. What's the core mathematical problem you're addressing or the main concept you'll explore in your introduction, perhaps building on {last_meaningful_sentence_for_prompt}?",
        "What's the very first step or definition you want to state for your mathematical assignment?",
        "Start by outlining your main argument or the problem's objective. What's your core thesis statement for this mathematical response?",
        "What's your primary goal for this writing session? How can I help you achieve it in your mathematical writing?",
        "For your **{assignment_title}**, how will you introduce the main mathematical concepts or questions you'll be tackling, starting with {last_meaningful_sentence_for_prompt}?",
        "What background information or foundational principles are crucial to establish in your introduction?",
        "Does your introduction clearly state the problem you're solving or the mathematical theory you're exploring?",
        "How can you make your mathematical introduction engaging and clearly set the stage for your detailed work?"
    ]
    math_conclusion_prompts = [
        "Does this section effectively summarize your mathematical findings or the outcome of your proof, especially after {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective?",
        "Have you restated your main result or conclusion in a new way and provided a strong sense of closure? How can you leave a lasting impression after {last_meaningful_sentence_for_prompt}?",
        "What's the final takeaway message you want the reader to remember from your mathematical solution or proof, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful?",
        "Review your mathematical conclusion. Does it clearly reiterate your findings and bring the solution to a clear end after {last_meaningful_sentence_for_prompt}?",
        "How well does your conclusion wrap up your mathematical argument? Does it reflect on the significance of your results, perhaps referencing {last_meaningful_sentence_for_prompt}?",
        "Avoid introducing new mathematical concepts. Does your conclusion strictly summarize and re-emphasize your findings, including {last_meaningful_sentence_for_prompt}?",
        "What's the lasting impact you want your mathematical work to have? Does your conclusion achieve that?",
        "Take a final look. Does your conclusion provide a definitive answer or resolution to the mathematical problem, informed by {last_meaningful_sentence_for_prompt}?"
    ]
    math_general_engagement_prompts = [
        "Welcome! Let's get your mathematical assignment started. What's the core idea or problem you want to explore?",
        "What's the very first point or concept you want to introduce for your assignment?",
        "Start by outlining your main argument. What's your core argument for this mathematical report?",
        "What's your primary goal for this writing session? How can I help you achieve it?",
        "Hey there! Ready to dive into your math assignment? What problem are you focusing on today?",
        "Let's kick things off! What's the most challenging or interesting mathematical concept for you in this assignment?",
        "You've got this! Where should we begin with your calculations or proofs?",
        "What's on your mind for this math session? Let's crunch some numbers!"
    ]

    science_elaboration_prompts = [
        "Excellent! Can you elaborate on {last_meaningful_sentence_for_prompt}? What specific details about that observation or experimental result can you add to make it clearer?",
        "To make {last_meaningful_sentence_for_prompt} clearer, could you describe your methodology or the conditions of the experiment in more detail?",
        "Consider expanding on {last_meaningful_sentence_for_prompt}. What further insights or explanations can you offer about the scientific principle you're discussing?",
        "Tell me more about why {last_meaningful_sentence_for_prompt} is important for your scientific argument. What's its significance or impact?",
        "That's a good scientific statement with {last_meaningful_sentence_for_prompt}. Can you provide more data or context to fully develop it?",
        "What additional details about your experimental setup or findings would clarify {last_meaningful_sentence_for_prompt}?",
        "How does {last_meaningful_sentence_for_prompt} fit into broader scientific understanding? Can you elaborate on that connection?",
        "Let's dig a bit deeper into this scientific concept. What are the key elements you want to explain about {last_meaningful_sentence_for_prompt}?"
    ]
    science_evidence_prompts = [
        "What experimental data or observations support {last_meaningful_sentence_for_prompt}? Can you include a specific finding or result?",
        "Where did you get this information for {last_meaningful_sentence_for_prompt}? Could you cite a source or the experimental procedure that backs this up?",
        "How reliable is the data you've presented for {last_meaningful_sentence_for_prompt}? How can you verify your findings or ensure their accuracy?",
        "To strengthen your argument, what specific experimental results or data can you include to support {last_meaningful_sentence_for_prompt}?",
        "Can you provide quantitative or qualitative data from your experiment to illustrate {last_meaningful_sentence_for_prompt}?",
        "What scientific study or established theory provides evidence for what you're saying in {last_meaningful_sentence_for_prompt}?",
        "How does your experimental evidence directly prove or disprove your hypothesis, relating to {last_meaningful_sentence_for_prompt}?",
        "It's good to state your ideas. Now, what scientific proof or observed data makes {last_meaningful_sentence_for_prompt} undeniable?"
    ]
    science_analysis_prompts = [
        "You've presented data in {last_meaningful_sentence_for_prompt}. Now, what's your analysis or interpretation of it in the context of your hypothesis? What does it imply?",
        "What are the implications of {last_meaningful_sentence_for_prompt} for your overall scientific conclusion? How does it relate to your hypothesis?",
        "Why is {last_meaningful_sentence_for_prompt} significant to your scientific argument? What deeper meaning does it hold for the phenomenon?",
        "Okay, so what does {last_meaningful_sentence_for_prompt} tell us scientifically? Delve deeper into the underlying meaning or consequence this idea reveals.",
        "How does {last_meaningful_sentence_for_prompt} help you answer your research question? What conclusions can you draw from it?",
        "What unexpected outcomes did you observe, and what's your scientific explanation for them, in relation to {last_meaningful_sentence_for_prompt}?",
        "Don't just state the findings; explain their significance. Why is {last_meaningful_sentence_for_prompt} important?",
        "How does {last_meaningful_sentence_for_prompt} contribute to your understanding of the scientific principle?"
    ]
    science_connection_prompts = [
        "How does {last_meaningful_sentence_for_prompt} connect to your main hypothesis or the scientific question? Can you make the link clearer?",
        "Can you clarify the link between {last_meaningful_sentence_for_prompt} and the previous one in your scientific explanation? Do they flow logically?",
        "What is the significance of this connection you're making to your overall scientific argument after {last_meaningful_sentence_for_prompt}? Why is it important?",
        "Ensure your ideas flow logically. How does {last_meaningful_sentence_for_prompt} relate to what comes next in your scientific discussion? How are they tied?",
        "Are your scientific observations and conclusions building on each other consistently, especially after {last_meaningful_sentence_for_prompt}? How can you show the coherence?",
        "What's the relationship between {last_meaningful_sentence_for_prompt} and the next scientific concept you're introducing?",
        "How does this part of your experiment or observation lead directly into the next stage of your discussion from {last_meaningful_sentence_for_prompt}?",
        "Guide your reader through your scientific thinking. How does {last_meaningful_sentence_for_prompt} transition to the next piece of evidence or analysis?"
    ]
    science_transition_prompts = [
        "What's the next logical step in your scientific argument after {last_meaningful_sentence_for_prompt}? How will you smoothly transition to it?",
        "You've completed that thought with {last_meaningful_sentence_for_prompt}. What point will you make next to continue your scientific explanation? How will you introduce it?",
        "Consider how you'll move from {last_meaningful_sentence_for_prompt} to the next experiment/idea. What's the best way to bridge these scientific ideas naturally?",
        "How does {last_meaningful_sentence_for_prompt} lead to your next argument or supporting detail? Think about a smooth scientific link.",
        "Alright, you've successfully presented {last_meaningful_sentence_for_prompt}. What's the next big scientific concept or observation you'll tackle?",
        "To keep your scientific explanation flowing, what transitional phrases or logical indicators can you use after {last_meaningful_sentence_for_prompt}?",
        "Where do you want your scientific explanation to go next after {last_meaningful_sentence_for_prompt}? How can you guide the reader there smoothly?",
        "Great work so far! What's the next step in your scientific solution, and how will you set it up after {last_meaningful_sentence_for_prompt}?"
    ]
    science_introduction_prompts = [
        "Welcome to your **{assignment_title}**! Let's get your scientific report started. What's the core hypothesis or phenomenon you're exploring in your introduction, perhaps building on {last_meaningful_sentence_for_prompt}?",
        "What's the very first scientific observation or question you want to introduce for your assignment?",
        "Start by outlining your main argument or the scientific objective. What's your core thesis statement for this scientific essay?",
        "What's your primary goal for this writing session? How can I help you achieve it in your scientific writing?",
        "For your **{assignment_title}**, how will you introduce the main scientific concepts or experiments you'll be tackling, starting with {last_meaningful_sentence_for_prompt}?",
        "What background information or foundational scientific principles are crucial to establish in your introduction?",
        "Does your introduction clearly state the research question you're investigating or the scientific theory you're exploring?",
        "How can you make your scientific introduction engaging and clearly set the stage for your detailed work?"
    ]
    science_conclusion_prompts = [
        "Does this section effectively summarize your scientific findings or the outcome of your experiment, especially after {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective or final insight?",
        "Have you restated your main scientific conclusion or re-evaluated your hypothesis in a new way and provided a strong sense of closure? How can you leave a lasting impression after {last_meaningful_sentence_for_prompt}?",
        "What's the final takeaway message you want the reader to remember from your scientific work, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful and memorable?",
        "Review your scientific conclusion. Does it clearly reiterate your findings and bring your analysis to a clear end after {last_meaningful_sentence_for_prompt}?",
        "How well does your conclusion wrap up your scientific argument? Does it reflect on the significance of your results and their broader implications, perhaps referencing {last_meaningful_sentence_for_prompt}?",
        "Avoid introducing new scientific data. Does your conclusion purely reflect and synthesize what's already been discussed, including {last_meaningful_sentence_for_prompt}?",
        "What's the lasting impact you want your scientific report to have? Does your conclusion achieve that?",
        "Take a final look. Does your conclusion provide a clear sense of completeness and powerfully reinforce your main scientific message, particularly after {last_meaningful_sentence_for_prompt}?"
    ]
    science_general_engagement_prompts = [
        "Welcome! Let's get your scientific assignment started. What's the core idea or question you want to explore?",
        "What's the very first point or scientific concept you want to introduce for your assignment?",
        "Start by outlining your main argument. What's your core hypothesis for this scientific report?",
        "What's your primary goal for this writing session? How can I help you achieve it?",
        "Hey there! Ready to dive into your science assignment? What experiment or theory are you focusing on today?",
        "Let's kick things off! What's the most challenging or interesting scientific concept for you in this assignment?",
        "You've got this! Where should we begin with your observations or data?",
        "What's on your mind for this science session? Let's explore some scientific ideas!"
    ]

    # --- PROMPT_MAP for subject-specific and general prompts ---
    PROMPT_MAP = {
        "GENERAL": {
            "ELABORATION": default_elaboration_prompts,
            "EVIDENCE": default_evidence_prompts,
            "ANALYSIS": default_analysis_prompts,
            "CONNECTION": default_connection_prompts,
            "TRANSITION": default_transition_prompts,
            "INTRODUCTION": default_introduction_prompts,
            "CONCLUSION": default_conclusion_prompts,
            "GENERAL_ENGAGEMENT": default_general_engagement_prompts,
        },
        "MATH": {
            "ELABORATION": math_elaboration_prompts,
            "EVIDENCE": math_evidence_prompts,
            "ANALYSIS": math_analysis_prompts,
            "CONNECTION": math_connection_prompts,
            "TRANSITION": math_transition_prompts,
            "INTRODUCTION": math_introduction_prompts,
            "CONCLUSION": math_conclusion_prompts,
            "GENERAL_ENGAGEMENT": math_general_engagement_prompts,
        },
        "SCIENCE": {
            "ELABORATION": science_elaboration_prompts,
            "EVIDENCE": science_evidence_prompts,
            "ANALYSIS": science_analysis_prompts,
            "CONNECTION": science_connection_prompts,
            "TRANSITION": science_transition_prompts,
            "INTRODUCTION": science_introduction_prompts,
            "CONCLUSION": science_conclusion_prompts,
            "GENERAL_ENGAGEMENT": science_general_engagement_prompts,
        },
        # Expanded Subject-Specific Prompts (Placeholders - will need content filled in)
        "READING/ELA": {
            "ELABORATION": default_elaboration_prompts, 
            "EVIDENCE": default_evidence_prompts, 
            "ANALYSIS": default_analysis_prompts, 
            "CONNECTION": default_connection_prompts,
            "TRANSITION": default_transition_prompts,
            "INTRODUCTION": default_introduction_prompts,
            "CONCLUSION": default_conclusion_prompts,
            "GENERAL_ENGAGEMENT": default_general_engagement_prompts,
        },
        "HISTORY/SOCIAL STUDIES": {
            "ELABORATION": default_elaboration_prompts, 
            "EVIDENCE": default_evidence_prompts, 
            "ANALYSIS": default_analysis_prompts, 
            "CONNECTION": default_connection_prompts,
            "TRANSITION": default_transition_prompts,
            "INTRODUCTION": default_introduction_prompts,
            "CONCLUSION": default_conclusion_prompts,
            "GENERAL_ENGAGEMENT": default_general_engagement_prompts,
        },
        "CREATIVE WRITING": {
            "ELABORATION": default_elaboration_prompts, 
            "EVIDENCE": default_evidence_prompts, 
            "ANALYSIS": default_analysis_prompts, 
            "CONNECTION": default_connection_prompts,
            "TRANSITION": default_transition_prompts,
            "INTRODUCTION": default_introduction_prompts,
            "CONCLUSION": default_conclusion_prompts,
            "GENERAL_ENGAGEMENT": default_general_engagement_prompts,
        },
    }

    # Retrieve subject-specific prompts, fall back to general if not found
    # Ensure detected_subject is a string before converting to upper.
    # If classify_subject returns None, default to "GENERAL".
    subject_for_lookup = detected_subject.upper() if detected_subject is not None else "GENERAL"
    current_subject_prompts = PROMPT_MAP.get(subject_for_lookup, PROMPT_MAP["GENERAL"])

    # Placeholder for deeper analysis heuristic checks and their prioritization
    # (These will be implemented and called here in subsequent steps)
    # if is_claim_without_evidence(last_meaningful_sentence, detected_subject, sbert_model, device):
    #    response = random.choice(current_subject_prompts.get("EVIDENCE", default_evidence_prompts)).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
    #    return response
    # elif is_evidence_without_explanation(...):
    #    response = random.choice(current_subject_prompts.get("ANALYSIS", default_analysis_prompts)).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
    #    return response
    # elif needs_definition_or_clarification(...):
    #    response = random.choice(current_subject_prompts.get("ELABORATION", default_elaboration_prompts)).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
    #    return response

    # --- Handle Inactivity ---
    if inactivity_timer_fired:
        # Refined Inactivity Nudges
        display_title = get_display_assignment_title(assignment_title)
        inactivity_nudges = [
            f"Hey there! Still working on your {display_title}? If you're stuck, try focusing on the rubric point: '{format_rubric_point_for_lisa(most_relevant_rubric_point_text if most_relevant_rubric_point_text else 'the next key idea')}'. What's the biggest challenge you're facing right now?",
            f"It looks like you might have paused. No worries! To get back on track with your {display_title}, consider expanding on your last thought, or tell me what's next.",
            f"Taking a break? Whenever you're ready to continue your {display_title}, I'm here. You could try describing your next main point.",
            f"Just checking in! What are your next steps for your {display_title}? If you're feeling stuck, sometimes just outlining the next paragraph helps.",
            f"Ready to resume writing your {display_title}? If you're unsure where to go, let's look at the rubric together or brainstorm the next section."
        ]
        response = random.choice(inactivity_nudges)
        return response

    # --- Handle Assignment Completion ---
    if assignment_complete:
        return "You've marked the assignment as complete! Great work! Would you like me to review any specific sections, or are you ready to submit?"
        
    # --- Main Logic for other cases ---
    if predicted_class is not None and predicted_class.item() == 0: # Introduction state
        response = random.choice(current_subject_prompts["INTRODUCTION"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
    elif predicted_class is not None and predicted_class.item() == 1: # Inactivity (already handled by inactivity_timer_fired)
        pass # If inactivity_timer_fired is False, this 'pass' means it falls through to the general engagement below.
             # This correctly handles cases where NN might mispredict inactivity while user is typing.
    elif predicted_class is not None and predicted_class.item() == 2: # Advance/Paragraph or general writing flow
        if paragraph_finished:
            response = random.choice(current_subject_prompts["TRANSITION"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
        elif sentence_finished:
            # Default to elaboration if no other specific heuristic applies
            response = random.choice(current_subject_prompts["ELABORATION"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
        else:
            response = random.choice(current_subject_prompts["GENERAL_ENGAGEMENT"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt) # Fallback general prompt
    
    # If no specific condition was met, provide a general engagement prompt
    if not response:
        response = random.choice(current_subject_prompts["GENERAL_ENGAGEMENT"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)

    return response

@app.route('/lisa_prompt', methods=['POST', 'OPTIONS'])
def lisa_prompt():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response("", 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    # Handle the actual POST request
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request must be JSON"}), 400

        # Extract data from the request
        assignment_title = data.get('assignment_title')
        rubric = data.get('rubric')
        user_text = data.get('user_text')
        previous_user_text = data.get('previous_user_text')
        inactivity_timer_fired = data.get('inactivity_timer_fired')
        paragraph_finished = data.get('paragraph_finished')
        sentence_finished = data.get('sentence_finished')
        assignment_complete = data.get('assignment_complete')
        recent_sentence_completed = data.get('recent_sentence_completed')

        print(f"Received data: {data}")
        print(f"Assignment Title: {assignment_title}")
        
        # --- Calculate Embeddings ---
        current_text_embedding = None
        title_embedding = None
        rubric_point_embeddings = torch.empty(0).to(device) # Initialize as empty tensor
        rubric_points_list = []

        if sbert_model:
            if user_text:
                current_text_embedding = sbert_model.encode(user_text, convert_to_tensor=True).to(device)
            if assignment_title:
                title_embedding = sbert_model.encode(assignment_title, convert_to_tensor=True).to(device)
            if rubric:
                rubric_points_list = clean_and_split_rubric(rubric)
                if rubric_points_list:
                    rubric_point_embeddings = sbert_model.encode(rubric_points_list, convert_to_tensor=True).to(device)
        else:
            print("Warning: SentenceTransformer model not loaded. Skipping embedding calculations.")
            # Depending on your application's robustness needs, you might want to return an error here
            # return jsonify({"error": "AI model not loaded, cannot process request"}), 503

        # --- Subject Classification ---
        # Ensure that assignment_title and rubric are strings for the classify_subject function
        # This handles cases where they might be None from data.get() if not provided by the frontend
        text_for_classification = (assignment_title if assignment_title else "") + " " + \
                                  (rubric if rubric else "") + " " + \
                                  (user_text if user_text else "")
        
        detected_subject = classify_subject(text_for_classification, assignment_title if assignment_title else "")
        print(f"Detected Subject: {detected_subject}")

        # --- Neural Network Inference ---
        predicted_class = None
        if current_text_embedding is not None and model is not None:
            input_for_nn = current_text_embedding.unsqueeze(0) # Add batch dimension for the model
            try:
                with torch.no_grad():
                    model.eval() # Set model to evaluation mode
                    output = model(input_for_nn)
                    _, predicted_class = torch.max(output, dim=1)
                print(f"Neural Net predicted class: {predicted_class.item()}")
            except Exception as nn_e:
                print(f"Error during neural network inference: {nn_e}")
        else:
            print("Warning: Skipping neural network inference (current_text_embedding is None or model not loaded).")

        # --- Find Most Relevant Rubric Point ---
        most_relevant_rubric_point_text = None
        most_relevant_rubric_point_similarity = 0.0
        # Only attempt if user_text embedding exists and rubric embeddings are not empty
        if current_text_embedding is not None and rubric_point_embeddings.numel() > 0:
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity = \
                find_most_relevant_rubric_point(current_text_embedding, rubric_point_embeddings, rubric_points_list)
            print(f"Most relevant rubric point: {most_relevant_rubric_point_text} (Similarity: {most_relevant_rubric_point_similarity:.2f})")
        else:
            print("Warning: Cannot find most relevant rubric point (missing user text embedding or rubric embeddings).")


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
    app.run(debug=True, host='0.0.0.0', port=5001)