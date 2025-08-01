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

print("----- LISA IS LOADING VERSION 0.3.8 (Deeply Contextual Nudges) -----")

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
    def __init__(self, input_size=768, hidden_size=128):
        super(LisaNeuralNet, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 3) # Output classes: Intro, Inactivity, Advance/Paragraph

    def forward(self, x):
        x = F.relu(self.fc1(x))
        return self.fc2(x)

# ----------------------------------------
# 🧠 Prepare model (on boot) and move to detected device
# ----------------------------------------
model = LisaNeuralNet(input_size=768).to(device)


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
    text_lower = text.lower()
    assignment_title_lower = assignment_title.lower() 

    # Creative Writing (highest priority due to distinct style)
    if any(keyword in assignment_title_lower for keyword in ["poem", "story", "fiction", "creative", "narrative", "poetry"]) or \
       ("creative" in text_lower and "writing" in text_lower) or \
       ("story" in text_lower and "elements" not in text_lower and "plot" not in text_lower): 
        return "Creative Writing"

    # Math
    if any(keyword in text_lower for keyword in ["equation", "solve for x", "graph", "formula", "algebra", "calculus", "geometry", "proof", "math", "theorem", "numeric", "derive"]):
        return "Math"
    
    # Science
    if any(keyword in text_lower for keyword in ["experiment", "hypothesis", "data", "biology", "chemistry", "physics", "scientific method", "research", "lab", "science", "observation", "analysis", "conclusion"]):
        return "Science"

    # Reading/ELA
    if any(keyword in text_lower for keyword in ["theme", "character", "plot", "literary analysis", "poetry", "novel", "rhetoric", "argument", "evidence", "essay", "writing", "english", "literature", "author", "textual"]):
        return "Reading/ELA"

    # History/Social Studies
    if any(keyword in text_lower for keyword in ["history", "event", "period", "figure", "document", "source", "analysis", "social studies", "geography", "civics", "cause", "effect", "historical"]):
        return "History/Social Studies"

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
    print(f"  Raw Previous Text (len {len(previous_text)}): '{previous_text[:min(len(previous_text), 70)]}...'")

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
        "Great work so far! What's the next step in your scientific investigation, and how will you set it up after {last_meaningful_sentence_for_prompt}?"
    ]
    science_introduction_prompts = [
        "Welcome to your **{assignment_title}**! Let's get your scientific report started. What's the core phenomenon or question you want to explore in your introduction, perhaps building on {last_meaningful_sentence_for_prompt}?",
        "What's the very first observation or background information you want to provide for your scientific report?",
        "Start by outlining your main hypothesis or the objective of your experiment. What's your core thesis statement for this scientific piece?",
        "What's your primary goal for this writing session? How can I help you achieve it in your scientific writing?",
        "For your **{assignment_title}**, how will you introduce the main scientific concepts, research questions, or experimental goals, possibly relating to {last_meaningful_sentence_for_prompt}?",
        "What background scientific context or relevant prior research is crucial to establish in your introduction?",
        "Does your introduction clearly state your hypothesis and the purpose of your scientific inquiry?",
        "How can you make your scientific introduction engaging and clearly set the stage for your detailed report?"
    ]
    science_conclusion_prompts = [
        "Does this section effectively summarize your scientific findings and their implications, especially after {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective?",
        "Have you restated your hypothesis's validity or the experiment's outcome in a new way and provided a strong sense of closure? How can you leave a lasting impression after {last_meaningful_sentence_for_prompt}?",
        "What's the final takeaway message you want the reader to remember from your scientific report, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful and memorable?",
        "Review your scientific conclusion. Does it clearly reiterate your findings and bring the report to a clear end after {last_meaningful_sentence_for_prompt}?",
        "How well does your conclusion wrap up your scientific investigation? Does it discuss the broader implications of your results, perhaps including {last_meaningful_sentence_for_prompt}?",
        "Avoid introducing new scientific data or concepts. Does your conclusion strictly summarize and reflect on your findings, considering {last_meaningful_sentence_for_prompt}?",
        "What's the lasting impact you want your scientific work to have? Does your conclusion achieve that?",
        "Take a final look. Does your conclusion provide a clear resolution to your research question and summarize the evidence effectively, building on {last_meaningful_sentence_for_prompt}?"
    ]
    science_general_engagement_prompts = [
        "Welcome! Let's get your scientific report started. What's the core idea or question you want to explore?",
        "What's the very first point or observation you want to make for your assignment?",
        "Start by outlining your main hypothesis. What's your core argument for this scientific report?",
        "What's your primary goal for this writing session? How can I help you achieve it?",
        "Hey there! Ready to dive into your science assignment? What experiment or theory are you exploring today?",
        "Let's kick things off! What's the most challenging or interesting scientific concept for you in this assignment?",
        "You've got this! Where should we begin with your observations or data analysis?",
        "What's on your mind for this science session? Let's explore!"
    ]

    ela_elaboration_prompts = [
        "That's a strong statement! Can you elaborate on {last_meaningful_sentence_for_prompt}? How does it develop your argument further or add more depth?",
        "To make {last_meaningful_sentence_for_prompt} clearer, could you provide specific textual evidence or explain more about your interpretation?",
        "Consider expanding on {last_meaningful_sentence_for_prompt}. What further insights or explanations can you offer about the text or your analysis?",
        "Tell me more about why {last_meaningful_sentence_for_prompt} is important for your literary argument. What makes it stand out and why?",
        "You've introduced a good idea with {last_meaningful_sentence_for_prompt}. Now, how can you unpack it more fully? What details from the text support it?",
        "Help your reader grasp your interpretation. Can you elaborate on the nuances of {last_meaningful_sentence_for_prompt}?",
        "What's the deeper meaning you're trying to convey with {last_meaningful_sentence_for_prompt}? Can you explain it more thoroughly?",
        "Great start! How can you build on {last_meaningful_sentence_for_prompt} to make your argument even more compelling?"
    ]
    ela_evidence_prompts = [
        "What textual evidence supports {last_meaningful_sentence_for_prompt}? Can you include a direct quote or a specific paraphrase from the text?",
        "Where in the text did you find this information for {last_meaningful_sentence_for_prompt}? Could you cite the source (e.g., page number, line number, or character) to back this up?",
        "How does {last_meaningful_sentence_for_prompt} strengthen your argument or interpretation? How does it connect to your thesis?",
        "To strengthen your argument, what concrete textual support can you provide for {last_meaningful_sentence_for_prompt}? Remember to show, not just tell.",
        "Can you pinpoint a specific quote, passage, or literary device from the text that illustrates {last_meaningful_sentence_for_prompt}?",
        "What specific words, phrases, or actions from the text demonstrate your interpretation in {last_meaningful_sentence_for_prompt}?",
        "Prove it! What evidence from the reading makes {last_meaningful_sentence_for_prompt} undeniable?",
        "How are you backing up {last_meaningful_sentence_for_prompt}? What specific textual details can you use as proof?"
    ]
    ela_analysis_prompts = [
        "You've presented evidence in {last_meaningful_sentence_for_prompt}. Now, what's your analysis or interpretation of it in the context of your argument? What does it mean?",
        "What are the implications of {last_meaningful_sentence_for_prompt} for your overall literary argument? How does it contribute to your thesis?",
        "Why is {last_meaningful_sentence_for_prompt} significant to your literary analysis? What deeper meaning does it hold within the text?",
        "Okay, so what does {last_meaningful_sentence_for_prompt} tell us about the text? Delve deeper into the underlying meaning or rhetorical strategy this passage reveals.",
        "How does {last_meaningful_sentence_for_prompt} support or complicate your thesis? What insights does it reveal?",
        "Don't just summarize the quote. What's your unique interpretation of {last_meaningful_sentence_for_prompt}, and why is that important?",
        "What's the 'so what?' behind {last_meaningful_sentence_for_prompt}? How does it connect to the larger themes or arguments?",
        "How does {last_meaningful_sentence_for_prompt} help you prove your main point? What hidden meanings or subtexts can you uncover?"
    ]
    ela_connection_prompts = [
        "How does {last_meaningful_sentence_for_prompt} connect to your main thesis or the central theme of your analysis? Can you clarify the link?",
        "Can you clarify the link between {last_meaningful_sentence_for_prompt} and the previous one in your essay? Do they flow logically together?",
        "What is the significance of this connection you're making within your literary argument with {last_meaningful_sentence_for_prompt}? Why is it important for your reader?",
        "Ensure your ideas flow logically. How does {last_meaningful_sentence_for_prompt} relate to what comes next in your essay? Are the connections clear?",
        "Are your literary arguments building on each other coherently, especially after {last_meaningful_sentence_for_prompt}? How can you make the transitions more explicit?",
        "What's the relationship between {last_meaningful_sentence_for_prompt} and the next literary concept you're introducing?",
        "How does {last_meaningful_sentence_for_prompt} lead directly into the next supporting idea?",
        "Guide your reader through your literary thinking. How does {last_meaningful_sentence_for_prompt} transition to the next piece of evidence or argument?"
    ]
    ela_transition_prompts = [
        "What's the next logical step in your literary argument after {last_meaningful_sentence_for_prompt}? How will you smoothly transition from this idea to the next?",
        "You've completed that thought with {last_meaningful_sentence_for_prompt}. What point will you make next to continue your analysis? How will you introduce it?",
        "Consider how you'll move from {last_meaningful_sentence_for_prompt} to the next paragraph/idea. What's the best way to bridge these ideas naturally?",
        "How does {last_meaningful_sentence_for_prompt} lead to your next argument or supporting detail? Think about a smooth literary link.",
        "Alright, you've successfully presented {last_meaningful_sentence_for_prompt}. What's the next big literary concept or textual analysis you'll tackle?",
        "To keep your literary analysis flowing, what transitional words or phrases can you use after {last_meaningful_sentence_for_prompt}?",
        "Where do you want your literary discussion to go next after {last_meaningful_sentence_for_prompt}? How can you guide the reader there smoothly?",
        "Great work so far! What's the next argument in your literary essay, and how will you set it up after {last_meaningful_sentence_for_prompt}?"
    ]
    ela_introduction_prompts = [
        "Welcome to your **{assignment_title}**! Let's start strong. What's your main argument or **thesis statement** for this literary analysis in your introduction, perhaps building on {last_meaningful_sentence_for_prompt}?",
        "What's the very first concept or background information you want to introduce for your essay?",
        "Start by outlining your main argument. What's your core thesis statement for this literary essay?",
        "What's your primary goal for this writing session? How can I help you achieve it in your literary writing?",
        "For your **{assignment_title}**, how will you introduce the main literary work, author, or critical lens you'll be using, inspired by {last_meaningful_sentence_for_prompt}?",
        "What background literary context or relevant critical discussions are crucial to establish in your introduction?",
        "Does your introduction clearly state your thesis and hint at the main points you'll explore in your analysis?",
        "How can you make your literary introduction engaging and clearly set the stage for your insightful analysis?"
    ]
    ela_conclusion_prompts = [
        "Does this section effectively summarize your main arguments from the literary analysis, especially following {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective or final insight?",
        "Have you restated your thesis in a new way and provided a strong sense of closure? How can you leave a lasting impression after {last_meaningful_sentence_for_prompt}?",
        "What's the final takeaway message you want the reader to remember from your literary essay, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful and memorable?",
        "Review your literary conclusion. Does it bring all your analytical ideas together concisely and offer a satisfying end, particularly after {last_meaningful_sentence_for_prompt}?",
        "How well does your conclusion wrap up your literary argument? Does it revisit your thesis without simply repeating it, perhaps referencing {last_meaningful_sentence_for_prompt}?",
        "Avoid introducing new literary analysis or textual evidence. Does your conclusion strictly synthesize what's been discussed, including {last_meaningful_sentence_for_prompt}?",
        "What's the lasting impact you want your literary essay to have? Does your conclusion achieve that?",
        "Take a final look. Does your conclusion provide a powerful and concise summary of your literary insights and arguments, informed by {last_meaningful_sentence_for_prompt}?"
    ]
    ela_general_engagement_prompts = [
        "Welcome! Let's get your essay started. What's the core idea you want to explore?",
        "What's the very first point you want to make for your assignment?",
        "Start by outlining your main argument. What's your core thesis statement for this essay?",
        "What's your primary goal for this writing session? How can I help you achieve it?",
        "Hey there! Ready to dive into your ELA assignment? What literary work or theme are you focusing on today?",
        "Let's kick things off! What's the most challenging or interesting aspect of this assignment for you?",
        "You've got this! Where should we begin with your analysis or interpretation?",
        "What's on your mind for this ELA session? Let's get reading and writing!"
    ]

    creative_elaboration_prompts = [
        "That's an intriguing start with {last_meaningful_sentence_for_prompt}! Can you elaborate on that description or idea? What vivid details can you add to bring it to life?",
        "To make {last_meaningful_sentence_for_prompt} clearer, could you show, rather than tell, what you mean? How can you use sensory details to immerse the reader?",
        "Consider expanding on {last_meaningful_sentence_for_prompt}. What further insights or descriptions can you offer about the character, setting, or plot?",
        "Tell me more about why {last_meaningful_sentence_for_prompt} is important for developing your story or poem. What makes it stand out creatively?",
        "You've got a great concept with {last_meaningful_sentence_for_prompt}. Now, how can you flesh it out with more specific imagery or character actions?",
        "Help your reader visualize or feel what you're describing. Can you add more sensory details to {last_meaningful_sentence_for_prompt}?",
        "What's the mood or atmosphere you're trying to create? How can you deepen that with more evocative language, starting with {last_meaningful_sentence_for_prompt}?",
        "That's a solid creative spark. How can you expand on {last_meaningful_sentence_for_prompt} to build your world or develop your character further?"
    ]
    creative_evidence_prompts = [
        "What descriptive details or character actions can you include to bring {last_meaningful_sentence_for_prompt} to life? Show us, don't just tell.",
        "Can you use more evocative language or imagery to strengthen {last_meaningful_sentence_for_prompt}? How can you paint a clearer picture?",
        "How can you make the reader *feel* what you're trying to convey with {last_meaningful_sentence_for_prompt}? What specific words or phrases can you use to create that emotion?",
        "Show, don't just tell. What specific observations or internal thoughts can you reveal to deepen the reader's understanding related to {last_meaningful_sentence_for_prompt}?",
        "What specific dialogue or internal monologue could you add to reveal more about your character, building on {last_meaningful_sentence_for_prompt}?",
        "Can you describe the setting with more sensory input – what can be seen, heard, smelled, or felt, specifically for {last_meaningful_sentence_for_prompt}?",
        "How can you use strong verbs and precise nouns to make your descriptions more impactful after {last_meaningful_sentence_for_prompt}?",
        "Paint a picture for me! What specific details will make {last_meaningful_sentence_for_prompt} truly vivid!"
    ]
    creative_analysis_prompts = [
        "You've written a passage with {last_meaningful_sentence_for_prompt}. What emotional or thematic impact are you hoping to achieve with it? What's the underlying message?",
        "What underlying message or feeling does this section convey to the reader from {last_meaningful_sentence_for_prompt}? Is it coming across as intended?",
        "Why is {last_meaningful_sentence_for_prompt} significant for your character's development or the plot's progression? What's its deeper meaning?",
        "Okay, so what does {last_meaningful_sentence_for_prompt} tell us about your world? Delve deeper into the unspoken truths or nuances this idea reveals about your fictional world or characters.",
        "What literary devices (metaphor, symbolism, foreshadowing) are at play in {last_meaningful_sentence_for_prompt}, and how do they enhance your meaning?",
        "How does {last_meaningful_sentence_for_prompt} contribute to the overall tone or theme of your creative piece?",
        "What effect do you want this particular moment (including {last_meaningful_sentence_for_prompt}) to have on your reader, and how are you achieving it?",
        "Beyond the surface, what deeper insights or emotions are you aiming to evoke with {last_meaningful_sentence_for_prompt}?"
    ]
    creative_connection_prompts = [
        "How does {last_meaningful_sentence_for_prompt} connect to the overall arc of your story or the central theme of your poem? Is the link clear?",
        "Can you clarify the link between {last_meaningful_sentence_for_prompt} and the previous one in your narrative? Do they flow smoothly together?",
        "What is the significance of this connection you're making for the reader's understanding of your world or characters from {last_meaningful_sentence_for_prompt}? Why is it important?",
        "Ensure your narrative flows smoothly. How does {last_meaningful_sentence_for_prompt} relate to what comes next in your story? Are the connections strong?",
        "Are your plot points or poetic stanzas building on each other in a cohesive way, especially after {last_meaningful_sentence_for_prompt}? How can you make the progression more evident?",
        "What's the relationship between {last_meaningful_sentence_for_prompt} and the next creative moment you're introducing?",
        "How does {last_meaningful_sentence_for_prompt} lead directly into the next logical or emotional beat?",
        "Guide your reader through your narrative. How does {last_meaningful_sentence_for_prompt} transition to the next part of your world or character's journey?"
    ]
    creative_transition_prompts = [
        "What's the next logical or surprising step in your narrative after {last_meaningful_sentence_for_prompt}? How will you smoothly transition to the next scene or idea?",
        "You've completed that thought with {last_meaningful_sentence_for_prompt}. What dramatic event or character revelation will you introduce next? How will you set it up?",
        "Consider how you'll smoothly move from {last_meaningful_sentence_for_prompt} to the next paragraph/idea. What's the best way to bridge these ideas or change perspective naturally?",
        "How does {last_meaningful_sentence_for_prompt} lead to your next plot twist or character interaction? Think about a creative and engaging link.",
        "Alright, you've successfully presented {last_meaningful_sentence_for_prompt}. What's the next big moment or turning point you'll tackle?",
        "To keep your narrative flowing, what transitional phrases or descriptive elements can you use after {last_meaningful_sentence_for_prompt}?",
        "Where do you want your story or poem to go next after {last_meaningful_sentence_for_prompt}? How can you guide the reader there smoothly?",
        "Great work so far! What's the next beat in your creative piece, and how will you introduce it after {last_meaningful_sentence_for_prompt}?"
    ]
    creative_introduction_prompts = [
        "Welcome to your creative writing! What's the core idea, character, or setting you want to introduce in your opening, perhaps inspired by {last_meaningful_sentence_for_prompt}?",
        "How do you want to hook your reader from the very first sentence? What will grab their attention?",
        "Start by painting a vivid picture or introducing a compelling character. What's your opening scene or concept?",
        "What's your primary goal for this writing session? How can I help you unleash your creativity?",
        "For your creative piece, what's the most compelling way to begin? How will you draw your reader in immediately, considering {last_meaningful_sentence_for_prompt}?",
        "What kind of atmosphere or tone do you want to establish from the very beginning?",
        "Does your opening clearly hint at the genre, style, or central conflict of your creative work?",
        "How can you craft an opening that makes your reader desperate to know what happens next?"
    ]
    creative_conclusion_prompts = [
        "Does this ending effectively resolve your plot or provide a satisfying conclusion to your poem, especially after {last_meaningful_sentence_for_prompt}? Does it offer a fresh perspective?",
        "Have you brought your narrative to a strong close and provided a sense of completeness? How can you leave a lasting impression on the reader after {last_meaningful_sentence_for_prompt}?",
        "What's the final feeling or idea you want the reader to take away from your creative piece, building on {last_meaningful_sentence_for_prompt}? How can you make it impactful and memorable?",
        "Review your creative conclusion. Does it provide a fulfilling resolution or a thought-provoking final image after {last_meaningful_sentence_for_prompt}?",
        "How well does your ending tie up loose ends or provide closure for your characters, relating to {last_meaningful_sentence_for_prompt}?",
        "Avoid introducing new major plot points. Does your conclusion purely reflect and summarize the journey, considering {last_meaningful_sentence_for_prompt}?",
        "What's the lasting echo you want your creative work to leave in your reader's mind?",
        "Take a final look. Does your conclusion provide a powerful and artistic end to your story or poem, informed by {last_meaningful_sentence_for_prompt}?"
    ]
    creative_general_engagement_prompts = [
        "Welcome to your creative writing journey! What story or poem are you eager to tell today?",
        "What vivid scene or compelling character is forming in your mind? Let's bring it to life!",
        "Start by setting the mood or introducing a mystery. What's your creative spark?",
        "What's your primary goal for this writing session? How can I help you explore your imagination?",
        "Hey there! Ready to conjure up some amazing words? What's inspiring you today?",
        "Let's kick things off! What's the most exciting creative idea you're playing with?",
        "You've got this! Where should we begin with your world-building or character development?",
        "What's on your mind for this creative writing session? Let's get inventing!"
    ]


    prompts_by_subject = {
        "Math": {
            "elaboration": math_elaboration_prompts, "evidence": math_evidence_prompts, "analysis": math_analysis_prompts, 
            "connection": math_connection_prompts, "transition": math_transition_prompts, 
            "introduction": math_introduction_prompts, "conclusion": math_conclusion_prompts,
            "general_engagement": math_general_engagement_prompts,
        },
        "Science": {
            "elaboration": science_elaboration_prompts, "evidence": science_evidence_prompts, "analysis": science_analysis_prompts, 
            "connection": science_connection_prompts, "transition": science_transition_prompts, 
            "introduction": science_introduction_prompts, "conclusion": science_conclusion_prompts,
            "general_engagement": science_general_engagement_prompts,
        },
        "Reading/ELA": {
            "elaboration": ela_elaboration_prompts, "evidence": ela_evidence_prompts, "analysis": ela_analysis_prompts, 
            "connection": ela_connection_prompts, "transition": ela_transition_prompts, 
            "introduction": ela_introduction_prompts, "conclusion": ela_conclusion_prompts,
            "general_engagement": ela_general_engagement_prompts,
        },
        "Creative Writing": {
            "elaboration": creative_elaboration_prompts, "evidence": creative_evidence_prompts, "analysis": creative_analysis_prompts, 
            "connection": creative_connection_prompts, "transition": creative_transition_prompts, 
            "introduction": creative_introduction_prompts, "conclusion": creative_conclusion_prompts,
            "general_engagement": creative_general_engagement_prompts,
        },
        "History/Social Studies": { 
            "elaboration": default_elaboration_prompts, "evidence": default_evidence_prompts, "analysis": default_analysis_prompts, 
            "connection": default_connection_prompts, "transition": default_transition_prompts, 
            "introduction": default_introduction_prompts, "conclusion": default_conclusion_prompts,
            "general_engagement": default_general_engagement_prompts,
        },
        "General": { 
            "elaboration": default_elaboration_prompts, "evidence": default_evidence_prompts, "analysis": default_analysis_prompts, 
            "connection": default_connection_prompts, "transition": default_transition_prompts, 
            "introduction": default_introduction_prompts, "conclusion": default_conclusion_prompts,
            "general_engagement": default_general_engagement_prompts,
        },
    }

    current_prompts = prompts_by_subject.get(detected_subject, prompts_by_subject["General"])

    # --- NEW HIGH PRIORITY: Initial Greeting (if user_text is empty) ---
    if not clean_user_text:
        print("LISA Trigger: Empty User Text - Initial Greeting.")
        
        display_assignment_title = get_display_assignment_title(assignment_title)

        # If there's a rubric, try to suggest something based on its first point
        if rubric_points_list and len(rubric_points_list) > 0:
            raw_first_rubric_point = rubric_points_list[0]
            # Use the helper function to clean it for display and add "the"
            display_first_rubric_point = format_rubric_point_for_lisa(raw_first_rubric_point)
            
            response = random.choice([
                f"Let's get started! Your teacher has assigned you **{display_assignment_title}**. For starters, what's the first thing we can do to begin this assignment, perhaps focusing on **the {display_first_rubric_point}**?",
                f"Welcome to your **{display_assignment_title}**! A great way to begin is to think about the first point on your rubric: **the {display_first_rubric_point}**. How would you approach that?",
                f"Hey there! Ready for your **{display_assignment_title}**? Let's kick off by focusing on **the {display_first_rubric_point}**. What are your initial thoughts on addressing this?",
                f"Alright, let's dive into your **{display_assignment_title}**. To get rolling, maybe we can start with **the {display_first_rubric_point}**? What comes to mind first?",
                f"Hi! Time to tackle your **{display_assignment_title}**. How about we brainstorm ideas for **the {display_first_rubric_point}** to set a strong foundation?",
                f"Feeling ready for your **{display_assignment_title}**? A good starting point is often **the {display_first_rubric_point}**. What's your plan for that?",
                f"Great to see you! For your **{display_assignment_title}**, let's consider how to approach **the {display_first_rubric_point}** right from the start. What are some initial ideas?"
            ])
        else:
            # Fallback to general initial engagement if no rubric points
            response = random.choice(current_prompts["general_engagement"]).format(assignment_title=display_assignment_title)
        return jsonify({"suggested_next_step": response})


    # --- Assignment Complete Logic (Highest Priority - after initial greeting) ---
    if assignment_complete:
        if not user_text.strip() or not rubric_points_list:
            return jsonify({"suggested_next_step": "Hm, it looks like your assignment is empty or missing a rubric. There's not much for me to review yet!"})

        final_feedback = []
        overall_user_text_embedding = sbert_model.encode(user_text, convert_to_tensor=True).to(device)

        if overall_user_text_embedding is not None and rubric_point_embeddings.numel() > 0:
            user_text_embedding_np = overall_user_text_embedding.cpu().numpy().reshape(1, -1)
            rubric_point_embeddings_np = rubric_point_embeddings.cpu().numpy()
            
            similarities = cosine_similarity(user_text_embedding_np, rubric_point_embeddings_np)[0]

            addressed_points = []
            needs_work_points = []

            for i, point in enumerate(rubric_points_list):
                similarity = similarities[i]
                if similarity > 0.7: 
                    addressed_points.append(f"- \"{point}\" (Similarity: {similarity:.2f})")
                elif similarity > 0.4: 
                    needs_work_points.append(f"- \"{point}\" (Similarity: {similarity:.2f})")
                else: 
                    needs_work_points.append(f"- \"{point}\" (Similarity: {similarity:.2f})")
            
            feedback_message = f"**Great job on your {get_display_assignment_title(assignment_title)}!**\n\n"

            if addressed_points:
                feedback_message += "Here are some areas where your writing strongly aligned with the rubric:\n" + "\n".join(addressed_points) + "\n\n"
            
            if needs_work_points:
                feedback_message += "To make your assignment even stronger, consider reviewing these areas:\n" + "\n".join(needs_work_points) + "\n\n"
                feedback_message += "Remember to elaborate on your points, provide specific examples, and ensure clear connections to the rubric criteria. You've got this!"
            else:
                 feedback_message += "It looks like you've addressed all key areas of the rubric very well. Fantastic work! You're ready to submit."

            return jsonify({"suggested_next_step": feedback_message})
        else:
            return jsonify({"suggested_next_step": "Hm, I couldn't analyze the full assignment for completion. Please ensure your text is substantial and a rubric is provided."})


    # --- Priority 2: Inactivity ---
    if inactivity_timer_fired:
        print("LISA Trigger: Inactivity Timer Fired.")
        inactivity_prompts = [
            "It looks like you've paused for a moment. Are you stuck or just thinking? What's the next step you're planning?",
            "Need a nudge? What part of the assignment are you working on now, or what's your next idea?",
            "LISA's here to help! If you're unsure, try rereading the rubric or your last sentence. What comes next?",
            "Thinking time is good! But if you're stuck, remember to break down the task. What's the next small step you can take?",
            "Hm, a moment of quiet. Do you want to review something or move to a new idea?",
            "Just checking in! Are you taking a breather, or is there something I can help you with?",
            "Don't worry about getting stuck, it happens to everyone! What's challenging you right now?",
            "If you're unsure how to proceed, sometimes revisiting the assignment prompt helps. Or, tell me what you're thinking!",
            "Hey! What's the next move? I'm here to support you when you're ready.",
            "Feeling a bit stuck? How about we brainstorm some ideas together for your next section?"
        ]
        return jsonify({"suggested_next_step": random.choice(inactivity_prompts)})


    # --- Priority 3: Specific action-based triggers ---
    if recent_sentence_completed:
        print(f"LISA Trigger: Recent Sentence Completed Flag active. Last meaningful sentence (processed): '{last_meaningful_sentence}'.")

        last_suggested_rubric = session_cache.get('last_suggested_rubric_point')
        print(f"  Last suggested rubric from cache: '{last_suggested_rubric}'")

        # NEW LOGIC: Check if user is in very early stages of writing
        # This prevents "brief" critique on the first few sentences
        if len(clean_previous_text) < 50 and len(clean_user_text) < 150: # Arbitrary thresholds for "early writing"
            print("  LISA: Early writing phase detected. Prioritizing encouragement.")
            response = random.choice([
                f"Great start with {last_meaningful_sentence_for_prompt}! What's the next idea you want to introduce or expand upon?",
                f"You've laid down {last_meaningful_sentence_for_prompt}. How will you build on that to develop your argument?",
                f"Excellent beginning! What comes next to further develop {last_meaningful_sentence_for_prompt}?",
                f"Keep going! {last_meaningful_sentence_for_prompt} is a strong first step. What's the next detail or argument you want to add?",
                f"Nice! Now, how will you continue to develop {last_meaningful_sentence_for_prompt} or connect it to your main argument?",
                f"You've got a good idea there with {last_meaningful_sentence_for_prompt}. What's the next piece of your argument you want to introduce?"
            ])
            if 'last_suggested_rubric_point' in session_cache:
                del session_cache['last_suggested_rubric_point']
            return jsonify({"suggested_next_step": response})


        if last_meaningful_sentence: # Ensure there's a meaningful sentence to refer to
            if len(last_meaningful_sentence.split()) < 8 and len(clean_user_text) > 150: # Only critique "brief" if overall text is substantial
                response = random.choice([
                    f"That's a bit brief. Can you expand on {last_meaningful_sentence_for_prompt} with more detail or an example?",
                    f"You've started with {last_meaningful_sentence_for_prompt}. How can you deepen that thought or provide more context?",
                    f"Good start on that sentence. Now, what further information can you add to develop {last_meaningful_sentence_for_prompt}?"
                ]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt) # Ensure format is called here
            elif most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < 0.7:
                if most_relevant_rubric_point_text == last_suggested_rubric:
                    print("  Skipping repetitive rubric prompt due to same rubric point.")
                    response = random.choice([
                        f"You've written {last_meaningful_sentence_for_prompt}. How else can you elaborate on this idea?",
                        f"That's a good start. Think about what specific evidence or details you can add to {last_meaningful_sentence_for_prompt}.",
                        f"What's the next logical step in developing your argument after {last_meaningful_sentence_for_prompt}?",
                        f"Nice sentence! Now, how can you build on {last_meaningful_sentence_for_prompt} to make your point even stronger?",
                        f"That's a clear statement. What else comes to mind after writing {last_meaningful_sentence_for_prompt}?",
                        f"You've expressed that well. What's the next piece of your argument you want to introduce following {last_meaningful_sentence_for_prompt}?"
                    ]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
                else:
                    weak_connection_prompts = [
                        "You've written {last_meaningful_sentence_for_prompt}. This seems to touch on **the {most_relevant_rubric_point_text}**. Can you make the connection more direct?",
                        "How does {last_meaningful_sentence_for_prompt} specifically address **the {most_relevant_rubric_point_text}** from the rubric?",
                        "That's interesting. To align more closely with **the {most_relevant_rubric_point_text}**, consider adding details that bridge the gap with {last_meaningful_sentence_for_prompt}.",
                        "Your statement: {last_meaningful_sentence_for_prompt} is good. Now, how does it fit into the requirements for **the {most_relevant_rubric_point_text}**?",
                        "To fully meet the criteria for **the {most_relevant_rubric_point_text}**, how can you refine {last_meaningful_sentence_for_prompt} to explicitly contribute?",
                        "You're on the right track! For **the {most_relevant_rubric_point_text}**, think about elaborating on {last_meaningful_sentence_for_prompt} to make it more clearly relevant.",
                        "Consider this rubric point: **the {most_relevant_rubric_point_text}**. How can you rephrase or add to {last_meaningful_sentence_for_prompt} to strengthen its connection?",
                        "You've got a good idea in {last_meaningful_sentence_for_prompt}. To really nail **the {most_relevant_rubric_point_text}**, what specific details or examples can you add?",
                        "This sentence, {last_meaningful_sentence_for_prompt}, is a step forward. Now, how can you ensure it deeply connects to **the {most_relevant_rubric_point_text}** on the rubric?",
                        "Great work on {last_meaningful_sentence_for_prompt}. Let's push further! How can you use this to fulfill **the {most_relevant_rubric_point_text}** requirement?",
                        "Think about **the {most_relevant_rubric_point_text}**. How can you build upon {last_meaningful_sentence_for_prompt} to more clearly address that criterion?",
                        "You're making progress with {last_meaningful_sentence_for_prompt}! To make it more relevant to **the {most_relevant_rubric_point_text}**, consider focusing on specific aspects."
                    ]
                    # Apply the formatting to the rubric point here as well for the message
                    formatted_relevant_rubric_point = format_rubric_point_for_lisa(most_relevant_rubric_point_text)
                    response = random.choice(weak_connection_prompts).format(
                        last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt,
                        most_relevant_rubric_point_text=formatted_relevant_rubric_point # Use formatted version
                    )
                    session_cache['last_suggested_rubric_point'] = most_relevant_rubric_point_text
                    print(f"  Updated session cache with new rubric point: '{most_relevant_rubric_point_text}'")
            else: # Strong connection or general positive feedback
                response = random.choice([
                    f"Excellent point! How will you elaborate on {last_meaningful_sentence_for_prompt} to develop your argument further?",
                    f"Well-written! What's the next key detail or argument you want to introduce after {last_meaningful_sentence_for_prompt}?",
                    f"You've established {last_meaningful_sentence_for_prompt}. What's the logical next step or piece of evidence to build upon it?",
                    f"That's a strong statement, {last_meaningful_sentence_for_prompt}! What are your next thoughts on building out this idea?",
                    f"You're flowing well! After {last_meaningful_sentence_for_prompt}, where does your argument take you next?",
                    f"Perfect! Now that you've completed {last_meaningful_sentence_for_prompt}, what comes to mind as the next crucial piece?",
                    f"Clear and concise! What supporting details or further analysis can you add to {last_meaningful_sentence_for_prompt}?",
                    f"Outstanding work on that sentence! How will you expand on {last_meaningful_sentence_for_prompt} to develop your ideas even more?"
                ]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
                if 'last_suggested_rubric_point' in session_cache:
                    del session_cache['last_suggested_rubric_point'] 
                    print("  Cleared last suggested rubric point from cache (positive prompt).")
        else: # No meaningful sentence detected, but recent_sentence_completed is true (e.g., just punctuation or very short input)
             response = random.choice([
                "You've completed your recent thought. What's the next critical detail or argument you want to add?",
                "How will you build upon that idea or introduce your next point?",
                "Alright, you've wrapped up that idea. What's the next crucial piece of information or argument?",
                "You're making progress! What's the next logical step in your writing?"
            ])
        if 'last_suggested_rubric_point' in session_cache:
                del session_cache['last_suggested_rubric_point']
                print("  Cleared last suggested rubric point from cache (general prompt).")

    # --- Priority 4: Neural Net Prediction based Guidance ---
    elif predicted_class is not None:
        predicted_label = predicted_class.item()
        print(f"LISA Trigger: Neural Net prediction: {predicted_label}")

        if predicted_label == 0: # Intro Stage
            display_assignment_title = get_display_assignment_title(assignment_title)
            if len(user_text.strip()) < 100: # If it's short, still guide on intro structure
                response = random.choice(current_prompts["introduction"]).format(assignment_title=display_assignment_title, last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
            else: # If intro is already substantial, move to generic continue
                response = random.choice([
                    f"Your introduction is shaping up nicely! Now, what's the next big section you're planning to write, perhaps building on {last_meaningful_sentence_for_prompt}?",
                    "Great work on setting the stage. What comes after the introduction for your assignment?",
                    f"You've clearly introduced your topic. What's the first main body paragraph you want to develop after {last_meaningful_sentence_for_prompt}?"
                ])
            
        elif predicted_label == 2: # Advance / Paragraph Stage
            if most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < 0.5:
                prompt_list = None
                rubric_lower = most_relevant_rubric_point_text.lower()

                if "analyze" in rubric_lower or "interpret" in rubric_lower or "meaning" in rubric_lower:
                    prompt_list = current_prompts["analysis"]
                elif "evidence" in rubric_lower or "data" in rubric_lower or "proof" in rubric_lower or "support" in rubric_lower or "details" in rubric_lower:
                    prompt_list = current_prompts["evidence"]
                elif "connect" in rubric_lower or "transition" in rubric_lower or "relate" in rubric_lower or "flow" in rubric_lower:
                    prompt_list = current_prompts["connection"]
                elif "elaborate" in rubric_lower or "explain" in rubric_lower or "develop" in rubric_lower:
                    prompt_list = current_prompts["elaboration"]
                
                if prompt_list:
                    # Apply the formatting to the rubric point here as well
                    formatted_relevant_rubric_point = format_rubric_point_for_lisa(most_relevant_rubric_point_text)
                    chosen_prompt = random.choice(prompt_list)
                    response = f"You're making progress! Remember to connect your writing to **the {formatted_relevant_rubric_point}** from the rubric. {chosen_prompt.format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)}" 
                else: 
                    # Apply the formatting to the rubric point here as well
                    formatted_relevant_rubric_point = format_rubric_point_for_lisa(most_relevant_rubric_point_text)
                    response = (
                        f"You're making progress! Remember to connect your writing to **the {formatted_relevant_rubric_point}** from the rubric. "
                        f"How can you develop {last_meaningful_sentence_for_prompt} further?"
                    )
            else:
                response = random.choice([
                    f"Keep going! Your writing is developing well. What's the next key argument or detail you're focusing on after {last_meaningful_sentence_for_prompt}?",
                    f"Fantastic progress! What's the next step in building out your paragraphs from {last_meaningful_sentence_for_prompt}?",
                    f"You're doing great! What's the next idea you want to introduce or expand upon, perhaps related to {last_meaningful_sentence_for_prompt}?",
                    f"Alright, what's the next compelling point you want to make in your essay after {last_meaningful_sentence_for_prompt}?",
                    f"Moving forward nicely! How will you continue to elaborate on your main arguments, stemming from {last_meaningful_sentence_for_prompt}?",
                    f"You're building a strong case. What's the next piece of evidence or analysis you'll add to support {last_meaningful_sentence_for_prompt}?"
                ]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
    
    # --- Priority 5: Fallback / General Guidance ---
    if not response and user_text.strip(): # Should ideally not be reached if previous logic is robust
        if most_relevant_rubric_point_text:
            # Apply the formatting to the rubric point here as well
            formatted_relevant_rubric_point = format_rubric_point_for_lisa(most_relevant_rubric_point_text)
            response = random.choice([
                f"Keep writing! Your current work seems to be relating to **the {formatted_relevant_rubric_point}**. How can you further develop {last_meaningful_sentence_for_prompt}?",
                f"You're on track with **the {formatted_relevant_rubric_point}**! What else can you add to solidify {last_meaningful_sentence_for_prompt}?",
                f"How about diving deeper into **the {formatted_relevant_rubric_point}**? What details are missing from {last_meaningful_sentence_for_prompt}?",
                f"Remember **the {formatted_relevant_rubric_point}** as you write. How can {last_meaningful_sentence_for_prompt} align even more with it?"
            ]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt)
        else:
            display_assignment_title = get_display_assignment_title(assignment_title)
            response = random.choice([
                f"Keep going strong on your **{display_assignment_title}**! Think about what part of the rubric you haven't tackled yet, or how you can add more depth to your current ideas after {last_meaningful_sentence_for_prompt}.",
                random.choice(current_prompts["elaboration"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt), 
                random.choice(current_prompts["connection"]).format(last_meaningful_sentence_for_prompt=last_meaningful_sentence_for_prompt),
                f"You're doing a great job! What's the next compelling point you want to make for your **{display_assignment_title}** after {last_meaningful_sentence_for_prompt}?"
            ])
    elif not response: # Very initial state, no specific trigger, no text (should now be caught by initial_greeting)
        # This fallback is unlikely to be hit now due to the new initial greeting logic
        display_assignment_title = get_display_assignment_title(assignment_title)
        response = random.choice(current_prompts["general_engagement"]).format(assignment_title=display_assignment_title)

    print(f"LISA's Final Suggested Next Step: '{response}'")
    return jsonify({"suggested_next_step": response})


@app.route('/lisa_prompt', methods=['POST', 'OPTIONS'])
def lisa_prompt():
    global model, sbert_model 

    if sbert_model is None:
        print("ERROR: SentenceTransformer model not loaded. LISA is resting.")
        return jsonify({"suggested_next_step": "LISA is resting. Model not loaded. Check server logs. (Hint: Restart server)"}), 500

    if request.method == 'OPTIONS':
        return make_response('', 200)

    data = request.get_json()
    assignment_title = data.get('assignment_title', '')
    rubric = data.get('rubric', '') 
    user_text = data.get('user_text', '')
    inactivity_timer_fired = data.get('inactivity_timer_fired', False)
    paragraph_finished = data.get('paragraph_finished', False)
    sentence_finished = data.get('sentence_finished', False) 
    previous_user_text = data.get('previous_user_text', '')
    recent_sentence_completed = data.get('recent_sentence_completed', False)
    assignment_complete = data.get('assignment_complete', False) 

    # --- DEBUGGING: Print all received parameters ---
    print("\n--- LISA Prompt Received ---")
    print(f"Assignment Title: '{assignment_title}'")
    print(f"Rubric: '{rubric[:50]}...'") 
    print(f"User Text (len {len(user_text)}): '{user_text[:100]}...'")
    print(f"Previous User Text (len {len(previous_user_text)}): '{previous_user_text[:100]}...'")
    print(f"Inactivity Fired: {inactivity_timer_fired}")
    print(f"Paragraph Finished: {paragraph_finished}")
    print(f"Sentence Finished: {sentence_finished}")
    print(f"Recent Sentence Completed: {recent_sentence_completed}")
    print(f"Assignment Complete: {assignment_complete}") 
    print("---------------------------\n")

    # --- Copy-Paste Detection First ---
    if detect_copy_paste(user_text, previous_user_text):
        print(f"🚨 LISA detected potential copy-paste for assignment: {assignment_title}")
        return jsonify({
            "suggested_next_step": "🚨 **LISA Alert:** It looks like this section might have been copied or pasted. I've sent an alert to your teacher. Please ensure all your work is original."
        })

    # --- Step 1: Process and Embed Inputs (and move to device) ---
    # Only embed if there's actual text, otherwise pass None for efficiency
    if user_text and user_text.strip():
        current_text_embedding = sbert_model.encode(user_text, convert_to_tensor=True).to(device)
    else:
        current_text_embedding = None 

    title_embedding = sbert_model.encode(assignment_title, convert_to_tensor=True).to(device)

    rubric_points_list = clean_and_split_rubric(rubric)
    rubric_point_embeddings = torch.empty(0, sbert_model.get_sentence_embedding_dimension(), device=device) 
    if rubric_points_list:
        rubric_point_embeddings = sbert_model.encode(rubric_points_list, convert_to_tensor=True).to(device)
    

    input_size_sbert = sbert_model.get_sentence_embedding_dimension()

    # The neural net needs an input, even if user_text is empty, so we pass zeros for user_text embedding
    if current_text_embedding is not None:
        input_for_nn = torch.cat((current_text_embedding, title_embedding), dim=0).unsqueeze(0) 
    else:
        input_for_nn = torch.cat((torch.zeros(input_size_sbert, device=device), title_embedding), dim=0).unsqueeze(0)


    model.eval() 
    with torch.no_grad(): 
        output = model(input_for_nn)
        _, predicted_class = torch.max(output, dim=1) 
    
    print(f"Neural Net predicted class: {predicted_class.item()}")

    most_relevant_rubric_point_text = None
    most_relevant_rubric_point_similarity = 0.0

    if current_text_embedding is not None and rubric_point_embeddings.numel() > 0:
        most_relevant_rubric_point_text, most_relevant_rubric_point_similarity = \
            find_most_relevant_rubric_point(current_text_embedding,
                                            rubric_point_embeddings,
                                            rubric_points_list)
        print(f"Most relevant rubric point: '{most_relevant_rubric_point_text}' (Similarity: {most_relevant_rubric_point_similarity:.2f})")
        
    detected_subject = classify_subject(assignment_title + " " + rubric + " " + user_text, assignment_title)
    print(f"Detected Subject: {detected_subject}")


    suggested_next_step = generate_lisa_response(
        assignment_title, rubric, user_text, previous_user_text,
        inactivity_timer_fired, paragraph_finished, sentence_finished,
        current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
        predicted_class, most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
        detected_subject, recent_sentence_completed,
        assignment_complete 
    )
    
    return suggested_next_step


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)