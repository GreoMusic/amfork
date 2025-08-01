import torch
import torch.nn as nn
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np
import random
import os

# --- Constants for Configuration ---
LISA_VERSION = "0.6.6 (Feature: Arts & Presentation Nudges)" # Updated version for clarity
SBERT_MODEL_NAME = 'all-MiniLM-L6-v2'
SIMILARITY_THRESHOLD_NUDGE = 0.45
SIMILARITY_THRESHOLD_HIGH_COVERAGE = 0.78

print(f"----- LISA IS LOADING VERSION {LISA_VERSION} -----")

app = Flask(__name__)

# --- Flask-CORS Configuration ---
CORS(app, resources={r"/lisa_prompt": {"origins": "*", "methods": ["POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# ----------------------------------------------------
# ⚙️ Detect Device (MPS or CPU)
# ----------------------------------------------------
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

# ----------------------------------------------------
# 🧠 Load Sentence Transformer Model (and move to detected device)
# --------------------------------0--------------------
try:
    sbert_model = SentenceTransformer(SBERT_MODEL_NAME).to(device)
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}. LISA will not be able to embed text.")
    sbert_model = None # Set to None if loading fails

# Define categories with significantly expanded keywords for breadth and depth
categories = {
    "Reading/ELA": ["reading", "english", "literature", "grammar", "essay", "writing", "analysis", "poetry", "fiction", "non-fiction", "summary", "paragraph", "sentence", "novel", "play", "author", "theme", "character", "plot", "structure", "rhetoric", "composition", "journalism", "narrative", "persuasive", "expository", "argumentative", "literary device", "vocabulary", "punctuation", "spelling", "thesis"],
    "Math": ["math", "mathematics", "algebra", "geometry", "calculus", "equation", "formula", "solve", "number", "calculation", "statistic", "probability", "graph", "function", "theorem", "proof", "trigonometry", "arithmetic", "data analysis", "problem solving", "variable", "exponent", "derivative", "integral", "geometry", "fractions", "decimals", "percentages", "sum", "product", "quotient", "difference", "equation", "inequality", "expression"],
    "Science": ["science", "biology", "chemistry", "physics", "ecology", "environment", "research", "experiment", "hypothesis", "lab", "data", "climate", "geology", "astronomy", "scientific method", "anatomy", "physiology", "chemical", "physical", "biological", "ecosystem", "cell", "molecule", "atom", "reaction", "force", "energy", "matter", "observation", "conclusion", "theory", "evolution", "genetics", "earth science", "quantum", "mechanics", "acid", "base", "compound", "element", "velocity", "acceleration", "gravity"],
    "History/Social Studies": ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war", "revolution", "society", "civilization", "constitution", "democracy", "map", "country", "region", "world", "american", "primary source", "secondary source", "economy", "trade", "law", "citizen", "global"],
    "Creative Writing": ["story", "poem", "creative", "narrative", "fiction", "character", "plot", "setting", "dialogue", "imagery", "metaphor", "verse", "stanza", "prose", "screenplay", "playwriting", "short story", "novel excerpt", "world-building", "voice", "show don't tell", "figurative language", "rhyme", "meter"],
    "Art/Music": ["art", "music", "painting", "drawing", "sculpture", "song", "composition", "harmony", "rhythm", "instrument", "melody", "choir", "orchestra", "theory", "sketch", "canvas", "brushstroke", "color", "design", "medium", "critique", "art history", "movement", "artist", "performance", "audition", "technique", "form", "texture", "scale"],
    "Foreign Language": ["spanish", "french", "german", "mandarin", "language", "translate", "vocabulary", "conjugation", "dialogue", "grammar", "phrase", "sentence structure", "culture", "pronunciation", "verb", "noun", "adjective", "tense", "gender", "plural", "idiom", "accent", "listening", "speaking", "reading comprehension", "writing practice"],
    "Finance": ["finance", "economics", "investment", "stock", "bond", "market", "currency", "debt", "credit", "loan", "interest", "profit", "loss", "revenue", "expense", "budget", "accounting", "asset", "liability", "equity", "tax", "inflation", "GDP", "ROI", "P/E ratio", "balance sheet", "income statement", "cash flow"],
    "General": ["report", "project", "presentation", "topic", "information", "study", "notes", "concept", "theory", "analysis", "review", "summary", "outline", "proposal", "research paper", "argument", "evidence", "introduction", "conclusion", "body paragraph", "structure", "clarity", "organization", "convention"]
}

# Invert categories for reverse lookup
category_map = {idx: name for idx, name in enumerate(categories.keys())}
# Create a flat list of keywords for direct string matching
all_keywords = {keyword: category for category, keywords in categories.items() for keyword in keywords}

# Specific high-value keywords for prioritization in subject classification
PRIORITY_SCIENCE_KEYWORDS = ["climate", "environment", "biology", "chemistry", "physics", "ecology", "research", "experiment", "hypothesis", "lab", "data", "climate", "geology", "astronomy", "scientific method", "anatomy", "physiology", "chemical", "physical", "biological", "ecosystem", "cell", "molecule", "atom", "reaction", "force", "energy", "matter", "observation", "conclusion", "theory", "evolution", "genetics", "earth science", "quantum", "mechanics"]
PRIORITY_HISTORY_KEYWORDS = ["history", "social studies", "government", "civics", "geography", "economics", "politics", "culture", "event", "period", "war", "revolution", "society", "civilization", "constitution", "democracy", "map", "country", "region", "historical", "sociology", "psychology", "anthropology", "ancient", "modern", "world", "american", "primary source", "secondary source", "economy", "trade", "law", "citizen", "global"]
PRIORITY_MATH_KEYWORDS = ["math", "mathematics", "algebra", "geometry", "calculus", "equation", "formula", "solve", "number", "calculation", "statistic", "probability", "graph", "function", "theorem", "proof", "trigonometry", "arithmetic", "data analysis", "problem solving", "variable", "exponent", "derivative", "integral", "fractions", "decimals", "percentages", "sum", "product", "quotient", "difference"]
PRIORITY_FINANCE_KEYWORDS = ["finance", "economics", "investment", "stock", "bond", "market", "currency", "debt", "credit", "loan", "interest", "profit", "loss", "revenue", "expense", "budget", "accounting", "asset", "liability", "equity", "tax", "inflation", "GDP", "ROI", "P/E ratio", "balance sheet", "income statement", "cash flow"]

# Keywords to detect if the assignment is a presentation
PRESENTATION_KEYWORDS = ["presentation", "slides", "speech", "talk", "oral report", "powerpoint", "keynote"]


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
    # The order here defines priority if a text matches multiple high-priority categories
    for keyword in PRIORITY_MATH_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched Math keyword (priority): {keyword}")
            return "Math"

    for keyword in PRIORITY_SCIENCE_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched Science keyword (priority): {keyword}")
            return "Science"

    for keyword in PRIORITY_FINANCE_KEYWORDS:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            print(f"DEBUG: classify_subject - Matched Finance keyword (priority): {keyword}")
            return "Finance"

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

# Function to calculate completion status based on subject
def _calculate_completion_status(user_text, previous_user_text, detected_subject):
    """
    Determines if a "completion trigger" has occurred in the new text,
    considering the subject and making formula detection robust.
    Returns (completion_status: bool, is_formula_completion: bool)
    """
    is_formula_completion = False

    # If there's no new text, no completion
    if not user_text.strip() or user_text.strip() == previous_user_text.strip():
        return False, False

    # Get the segment of text that is truly new or the last significant part
    # Prioritize the new segment, but if it's too short or not distinct, consider the end of the full text
    new_text_segment = user_text[len(previous_user_text):] if len(user_text) > len(previous_user_text) else user_text
    new_text_segment_stripped = new_text_segment.strip()

    # If new_text_segment is empty after stripping, take the last significant part of the overall user text
    if not new_text_segment_stripped:
        lines = user_text.splitlines()
        if lines:
            new_text_segment_stripped = lines[-1].strip()
        else:
            new_text_segment_stripped = user_text.strip() # Fallback to entire text if no lines

    print(f"DEBUG: _calculate_completion_status - new_text_segment_stripped: '{new_text_segment_stripped}'")

    # --- Robust Formula/Numerical/Scientific/Financial Expression Patterns ---
    # These patterns are designed to be more flexible and detect formulas even within sentences.
    # We prioritize specific patterns, then more general ones.

    # General Equation/Assignment/Expression Patterns (most common across domains)
    # Allows for spaces around operators and variables, handles various characters
    general_expression_patterns = [
        # Basic equations: var = expr, expr = expr. Catches 'y = mx + b', 'F = ma', 'E = mc^2', 'x = 5'
        # More flexible: allows letters, numbers, common math symbols, and spaces on both sides of '='
        r'\b(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*=\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?|[+\-*/\^%\(\)\[\]\{\}\s.])+\b',
        # Basic calculations/expressions: '2 + 3 * (5 - 1)', 'sqrt(16)', 'log(x)'
        # Includes common functions and operators.
        r'\b(?:[a-zA-Z_]\w*\s*\([^)]*\)|(?:[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?))\s*(?:[+\-*/%^]|\*\*|\b(?:mod|sqrt|log|sin|cos|tan)\b)\s*(?:[a-zA-Z_]\w*\s*\([^)]*\)|[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\b',
        # Function definitions: f(x) = x^2 + 2x + 1
        r'\b[a-zA-Z_]\w*\s*\([a-zA-Z_,\s]*\)\s*=\s*.*\b',
        # Simple numbers with common units (can indicate a numerical result/data point)
        r'\b[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*(?:%|€|\$|£|yen|usd|eur|gbp|m/s|m|s|kg|N|J|W|V|A|Hz|mol|K|°C|g|cm|km|mL|L|psi|mph|km/h|ppm|atm|Pa|years|months|days|hours|minutes|seconds|units)\b',
        # Ratios/Fractions: '1/2', '3:4', 'P/E'
        r'\b\d+\s*/\s*\d+\b', # e.g., 1/2
        r'\b\w+\s*:\s*\w+\b', # e.g., 3:4
        r'\b[A-Z]{2,5}\s*/\s*[A-Z]{2,5}\b', # e.g., P/E, EPS/Revenue
        # Inequalities
        r'\b(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*(?:[<>=!]=|[<>])\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?|[+\-*/\^%\(\)\[\]\{\}\s.])+\b',
        # Unicode math symbols (more comprehensive list)
        r'[\u221A\u222B\u2211\u03C0\u03B1-\u03C9\u2202\u2207\u2208\u2209\u220A\u220B\u220C\u220F\u2210\u221D-\u2221\u2223-\u2225\u2229-\u222D\u2234-\u2237\u223D-\u224B\u2260-\u226F\u227A-\u227D\u2282-\u228B\u228F-\u2292\u2296-\u229C\u22A2-\u22A5\u22AE\u22AF\u22C4-\u22C5\u22CF\u22D0\u22D6-\u22DA\u22E0-\u22E1\u22EF-\u22F1\u22F9\u22FA\u22FB\u22FE\u22FF\u00B2\u00B3\u2074\u207F\u2080-\u2089\u207A-\u207D]+', # Superscripts/subscripts
        # Common constants/variables in isolation or within sentences
        r'\b(?:pi|e|phi|g|c|k_B)\b', # physical constants
        r'\b(?:x|y|z|a|b|c|n|m|p|q|r|s|t|u|v|w)\b\s*=\s*\d+(?:\.\d+)?', # x = 5
    ]

    # Science-specific patterns (chemical formulas, common scientific terms that look like formulas)
    science_patterns_specific = [
        r'\b(?:H2O|CO2|O2|N2|CH4|C6H12O6|NaCl|H2SO4|HCl|NH3|NaOH|Fe2O3|C2H5OH|CaCO3|SiO2|FeS2)\b', # Chemical formulas
        r'\b(?:pH\s*=\s*\d+(?:\.\d+)?)\b', # pH values
        r'\b(?:(?:[A-Z][a-z]?\d*){2,}|[A-Z]{1,2}\d+)\b', # More general chemical formula pattern (e.g., Fe2O3, SO4^2-)
    ]

    # Finance-specific patterns (percentages, currency, ratios, common acronyms)
    finance_patterns_specific = [
        r'\b\d+(?:\.\d+)?%\b', # Percentages: 10.5%
        r'(?:\$|€|£|¥)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b', # Currency: $1,234.56
        r'\b(?:ROI|NPV|IRR|CAGR|EBITDA|EPS|PPO|APY|APR)\b', # Common finance acronyms
        r'\b(?:debt-to-equity|price-to-earnings|P/E|D/E)\s*(?:ratio)?\b', # Financial ratios
        r'\b(?:market\s+cap|revenue|profit|loss)\s*\d+(?:\.\d+)?(?:B|M|K)?\b', # Market cap, revenue figures
    ]

    # Combine all formula patterns
    all_formula_patterns = general_expression_patterns + science_patterns_specific + finance_patterns_specific

    # Check for formula/numerical completion first
    # This loop tries to find ANY formula pattern in the new text segment.
    # It attempts to be as broad as possible.
    for pattern in all_formula_patterns:
        if re.search(pattern, new_text_segment_stripped, re.IGNORECASE):
            print(f"DEBUG: Formula/numerical completion detected by pattern: '{pattern}' on '{new_text_segment_stripped}'")
            is_formula_completion = True
            return True, is_formula_completion # Trigger completion and mark as formula

    # General completion (e.g., for essays): sentence-ending punctuation
    # This acts as a fallback if no specific formula pattern is met.
    if bool(re.search(r'[.?!]\s*$', new_text_segment_stripped)):
        print(f"DEBUG: General sentence completion detected by punctuation on '{new_text_segment_stripped}'")
        return True, is_formula_completion # is_formula_completion will be False here unless already set

    # Additional check: new line after non-empty content for block completion
    # This helps catch scenarios where formulas or code blocks are entered,
    # and the user presses enter to move to the next line without punctuation.
    # Ensures the previous line wasn't empty.
    if new_text_segment_stripped == "" and user_text.endswith('\n') and \
       (previous_user_text.strip() != "" and not previous_user_text.strip().endswith(('.', '?', '!'))):
        print("DEBUG: New line detected after non-punctuated content (block completion).")
        return True, is_formula_completion # Not necessarily a formula, but still a completion cue

    return False, is_formula_completion


# --- Initial Guidance Generation (rest of the functions are assumed to be identical to LISA2.py for brevity in this response, but would be included in the full file) ---
def get_initial_guidance(detected_subject, rubric_points_list, assignment_title):
    """Generates an initial prompt for a blank page based on subject, rubric, and assignment title.
    Now iterates through rubric points to find the most relevant introductory cue.
    If no specific intro is found in rubric, falls back to using the assignment title.
    Includes example introductory sentences.
    """
    guidance_map = {
        "Creative Writing": "Perhaps you can start with a compelling opening hook or introduce your main character, setting the scene for your story.",
        "Math": "How about outlining the first step to solving the problem, clearly showing your approach to the equation or concept?",
        "Science": "Consider introducing the scientific principle or hypothesis you will explore. What's the main idea you're investigating?",
        "Finance": "To begin, how will you introduce the financial concept or scenario? What are the key terms or initial data points?",
        "Art/Music": "Consider writing about your initial concept, sketch, or the main theme of your composition. What is the core idea you want to convey?",
        "Foreign Language": "Try writing your first sentence in the target language, or explaining how you'd begin to approach the conversation/topic in that language.",
    }

    # Templates for example sentences based on subject
    # These are general and can be improved with more specific logic or varied templates
    example_intro_templates = {
        "Science": [
            "For instance, you could start with: 'The field of {subject_core} explores the intricate processes that govern the natural world...'",
            "An opening thought might be: 'Understanding {subject_core} requires an investigation into the fundamental principles of...'"
        ],
        "History/Social Studies": [
            "You could begin by stating: 'The historical context of {subject_core} reveals a complex interplay of forces that shaped...'",
            "Consider an opening like: 'To truly grasp {subject_core}, one must delve into the societal and political landscapes of...'"
        ],
        "Reading/ELA": [
            "In this analysis of {subject_core}, we will examine how the author uses literary devices to convey...'",
            "You might start with: 'The compelling narrative of {subject_core} offers profound insights into the human condition, as demonstrated by...'"
        ],
        "Math": [
            "You could begin with: 'To solve the problem of {subject_core}, the first step involves setting up the equation...'",
            "An opening approach could be: 'My strategy for deriving {subject_core} will start by defining the variables as...'"
        ],
        "Finance": [
            "For instance, you might write: 'This analysis of {subject_core} will begin by outlining the current market conditions and their potential impact on...'",
            "Consider an opening like: 'To understand the dynamics of {subject_core}, it is crucial to first define the key financial metrics and their relationships...'"
        ],
        "General": [ # For general reports/essays where a specific subject isn't well-defined by keywords
            "You might start with: 'This report will delve into the critical aspects of {subject_core}, aiming to provide a comprehensive understanding of...'",
            "Consider an opening like: 'To fully understand {subject_core}, it is essential to first establish a foundational overview of...'"
        ]
    }


    # First, check direct subject-specific guidance
    if detected_subject in guidance_map:
        print(f"DEBUG: Initial Prompt - {detected_subject} subject detected. Guidance: {guidance_map[detected_subject]}")
        return guidance_map[detected_subject]

    # For academic subjects, iterate through rubric points to find introductory cues
    if detected_subject in ["Science", "History/Social Studies", "Reading/ELA", "General", "Math", "Finance", "Creative Writing", "Art/Music", "Foreign Language"]: # Added Creative Writing, Art/Music, Foreign Language
        print(f"DEBUG: Initial Prompt - Academic subject detected. Iterating rubric points for intro phrases.")

        # Prioritized list of regex patterns for introductory concepts
        intro_patterns = [
            (r"(?:clearly\s+)?introduce(?: the topic of)?\s*(.+?)(?:\.|\s*and\s*its\s*impact|\s*that\s*is\s*relevant\s+to\s+the\s+assignment|$|\s*and\s*briefly\s+outline\s+your\s+main\s+points|or\s+provide\s+an\s+overview)",
             lambda m: f"How about starting with a clear introduction to the topic of **{m.group(1).strip().strip('.')}** to set the stage for your discussion?"),
            (r"(?:write|include|develop)\s+(?:a\s+)?(?:concise\s+)?thesis\s+statement(?: outlining the main arguments)?",
             lambda m: "Consider starting with a concise thesis statement outlining your main arguments for the essay."),
            (r"(?:provide|begin with|start with)\s+(?:a\s+)?(?:clear\s+)?(?:general\s+)?(?:brief\s+)?(?:introduction|overview|context)(?:\s*to|\s*of)?(?:\s*(.+?))?(?:\.|$|\s*as\s+it\s+relates\s+to\s+the\s+assignment)",
             lambda m: f"How about providing a clear overview or introduction{f' to **{m.group(1).strip().strip(".")}**' if m.group(1) else ''}?", "group1_optional"),
            (r"outline\s+the\s+main\s+points(?: of\s+your\s+(?:report|assignment|essay))?",
             lambda m: "Consider outlining the main points of your work as part of your introduction."),
            (r"^(?:an?\s+)?intro(?:ductory)?\s+paragraph",
             lambda m: "How about writing a strong introductory paragraph to get your ideas flowing?"),
            (r"^(?:the\s+)?opening\s+(?:section|paragraph)",
             lambda m: "Consider how you want to start the opening section of your work."),
            (r"begin(?: with)?",
             lambda m: "What's the first thing you want to write to begin your work?"),
        ]

        for point in rubric_points_list:
            point_lower = point.lower()
            for pattern_regex, response_func, *flags in intro_patterns:
                match = re.search(pattern_regex, point_lower)
                if match:
                    print(f"DEBUG: Initial Prompt - Matched pattern: '{pattern_regex}'. Rubric point: '{point_lower}'")
                    if "group1_optional" in flags and match.group(1) is None:
                        return "How about providing a clear overview or introduction?"
                    return response_func(match)

    # Fallback to assignment title-based prompt, now with examples
    print(f"DEBUG: Initial Prompt - No explicit intro instruction found in rubric. Attempting to generate from assignment title with example.")
    if assignment_title:
        clean_title = assignment_title.replace("Report", "").replace("report", "").replace("Essay", "").replace("essay", "").strip()

        # Determine the core subject for the example
        subject_for_example = clean_title if clean_title else assignment_title

        # Get an example template if available for the detected subject
        example_phrase = ""
        if detected_subject in example_intro_templates:
            chosen_template = random.choice(example_intro_templates[detected_subject])
            example_phrase = f" {chosen_template.format(subject_core=subject_for_example)}"

        # Combine the prompt and example
        if clean_title:
            return f"For your **{assignment_title}**, consider starting with an introduction. What key concepts related to {clean_title} should you introduce to set the stage?{example_phrase}"
        else: # If title only contains "report" or "essay"
            return f"For your **{assignment_title}**, consider starting with an introduction. What key concepts do you want to introduce?{example_phrase}"
    else:
        # Final generic fallback if no rubric intro and no assignment title
        print(f"DEBUG: Initial Prompt - No rubric intro and no assignment title. Defaulting to generic.")
        return "What's the first thing you want to write? A strong introductory paragraph is often a good start."


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

# --- Action Verb Extraction for more specific nudges ---
def extract_action_verb(rubric_point_text):
    """
    Extracts a key action verb from the rubric point to guide the nudge.
    Prioritizes verbs relevant to academic tasks. Expanded for creative and presentation tasks.
    """
    point_lower = rubric_point_text.lower()
    action_verbs = {
        "define": ["define", "explain", "describe", "identify", "illustrate"],
        "analyze": ["analyze", "evaluate", "interpret", "examine", "assess", "compare", "contrast"],
        "discuss": ["discuss", "explore", "consider", "review", "outline"],
        "argue": ["argue", "support", "justify", "prove", "demonstrate"],
        "solve": ["solve", "calculate", "find", "determine", "derive", "compute"],
        "apply": ["apply", "utilize", "use"],
        "create": ["create", "develop", "design", "compose", "craft", "imagine", "visualize", "express"], # Creative Arts
        "synthesize": ["synthesize", "integrate", "combine"],
        "summarize": ["summarize", "recount", "condense"],
        "structure": ["structure", "organize", "format", "plan", "outline"], # Presentations
        "articulate": ["articulate", "present", "convey", "communicate"], # Presentations
        "engage": ["engage", "captivate", "connect with"], # Presentations
        "translate": ["translate", "interpret", "render"], # Foreign Language
        "perform": ["perform", "execute", "render"] # Art/Music (performance)
    }

    for verb_type, verbs in action_verbs.items():
        for verb in verbs:
            if re.search(r'\b' + re.escape(verb) + r'\b', point_lower):
                return verb_type # Return the general type of action required
    return "elaborate on" # Default action if no specific verb found


def is_presentation_assignment(assignment_title, rubric_points_list):
    """
    Determines if the assignment is likely a presentation based on keywords in title or rubric.
    """
    title_lower = assignment_title.lower()
    if any(keyword in title_lower for keyword in PRESENTATION_KEYWORDS):
        return True
    for point in rubric_points_list:
        if any(keyword in point.lower() for keyword in PRESENTATION_KEYWORDS):
            return True
    return False

# ----------------------------------------------------
# 💡 CORE LISA LOGIC
# ----------------------------------------------------
def generate_lisa_response(
    assignment_title, rubric, user_text, previous_user_text,
    inactivity_timer_fired, paragraph_finished, sentence_finished,
    current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
    predicted_class, most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
    detected_subject, is_formula_completion, assignment_complete
):
    # --- 1. Initial Blank Page / Introductory Prompt ---
    if not user_text.strip() and not assignment_complete:
        initial_guidance = get_initial_guidance(detected_subject, rubric_points_list, assignment_title)

        print(f"DEBUG: Initial Prompt - Detected subject: {detected_subject}")
        print(f"DEBUG: Initial Prompt - Final initial_guidance: {initial_guidance}")

        lisa_response = (
            f"Let's get started! Your teacher has given you \"{assignment_title}\". "
            f"{initial_guidance}"
        )
        return lisa_response

    # --- Prepare user_text_brief (for all cases) ---
    user_text_brief = user_text.strip()
    print(f"DEBUG: User text before brief processing: '{user_text_brief}')")

    if is_formula_completion:
        # For formulas, try to get the last distinct line or recognizable formula part
        lines = user_text_brief.splitlines()
        if lines:
            user_text_brief = lines[-1].strip() # Take the last line as the "brief"
        if len(user_text_brief) > 100: # Truncate if too long, even for formulas
            user_text_brief = user_text_brief[:97] + "..."
        print(f"DEBUG: user_text_brief set for formula completion: '{user_text_brief}'")
    else:
        # For other subjects, get the last actual sentence
        sentences = re.split(r'(?<=[.?!])\s+', user_text_brief)
        user_text_brief = sentences[-1] if sentences else user_text_brief
        if len(user_text_brief) > 70:
            user_text_brief = user_text_brief[:67] + "..."
        print(f"DEBUG: user_text_brief set by truncation/sentence for non-formula: '{user_text_brief}'")

    # --- 2. Natural Output Nudge (when user has typed and relevant rubric point found or formula detected) ---
    if sentence_finished: # This is the main trigger, now inclusive of formula detection

        # Determine if it's a presentation assignment
        is_current_presentation = is_presentation_assignment(assignment_title, rubric_points_list)

        # Nudges for Formula Completion (Math, Science, Finance) - same as before
        if is_formula_completion and detected_subject in ["Math", "Science", "Finance"]: # Added Finance
            rephrased_rubric_concept = get_rephrased_rubric_concept(most_relevant_rubric_point_text) if most_relevant_rubric_point_text else "this concept"

            math_science_finance_follow_up_questions_solve_calc = [
                f"You've laid out '{user_text_brief}'. What's the next step to **solve** this problem or equation?",
                f"How do you proceed from '{user_text_brief}' to find the **solution**?",
                f"What **calculations** or **transformations** come next after '{user_text_brief}' to reach your answer?",
                f"Have you considered all the variables in '{user_text_brief}'? What values need to be **substituted**?",
                f"Now that you've got '{user_text_brief}', can you **show your work** leading to the final result?",
                f"Based on '{user_text_brief}', what's the **final answer** or derivation you're aiming for?",
                f"What does '{user_text_brief}' tell us about the quantitative aspect of this problem?",
                f"How does '{user_text_brief}' contribute to the overall calculation or proof?",
                f"What are the **units** for the values in '{user_text_brief}'? And what does the calculated result represent?"
            ]

            math_science_finance_follow_up_questions_explain = [
                f"You've entered '{user_text_brief}'. Can you **explain what each variable or symbol represents** in this context?",
                f"What is the **significance** of '{user_text_brief}' in relation to {rephrased_rubric_concept}?",
                f"Could you **define the terms** or principles embedded within '{user_text_brief}'?",
                f"How does '{user_text_brief}' **demonstrate** or **support** the concept of {rephrased_rubric_concept}?",
                f"What are the **implications** of this formula/expression, '{user_text_brief}', for the broader topic?",
                f"To fully cover {rephrased_rubric_concept}, how would you **elaborate** on '{user_text_brief}'?",
                f"Can you provide a **real-world example** where '{user_text_brief}' would be applied?",
                f"What are the **assumptions** behind '{user_text_brief}'?",
                f"How would you **interpret** the results of '{user_text_brief}' in practical terms?"
            ]

            # Choose questions based on typical rubric intent (solve/calculate vs. explain/interpret)
            if most_relevant_rubric_point_text and any(keyword in most_relevant_rubric_point_text.lower() for keyword in ["solve", "calculate", "find", "determine", "derive", "compute", "quantify", "analyze numbers"]):
                chosen_question = random.choice(math_science_finance_follow_up_questions_solve_calc)
            else:
                chosen_question = random.choice(math_science_finance_follow_up_questions_explain)

            lisa_response = f"Excellent! {chosen_question}"
            return lisa_response

        # Nudges for Presentation Assignments
        elif is_current_presentation:
            print("DEBUG: Nudging for Presentation Assignment.")
            presentation_nudges_low_medium = [
                f"You've shared '{user_text_brief}'. How does this help **structure** your presentation for clarity and impact?",
                f"Consider how '{user_text_brief}' will **engage your audience**. What's the main takeaway for them?",
                f"To **articulate** your ideas effectively, how can you expand on '{user_text_brief}' to make it easily digestible for a presentation format?",
                f"For a strong presentation, how would you **illustrate** the point made in '{user_text_brief}' visually or with an example?",
                f"Think about the **flow** of your presentation. How does '{user_text_brief}' transition to the next key idea?",
                f"What's the core message of your presentation, and how does '{user_text_brief}' contribute to **conveying** that message?",
                f"If you were speaking this aloud, how would you **emphasize** the most important part of '{user_text_brief}'?",
                f"You've made a good point with '{user_text_brief}'. How can you ensure your verbal delivery and body language will support this point?"
            ]
            presentation_nudges_high = [
                f"That's a well-articulated point for your presentation in '{user_text_brief}'! How will you **transition** from this idea to the next part of your presentation?",
                f"Excellent! Your point '{user_text_brief}' is clear. What visuals or examples will you use to make this part of your presentation truly **memorable**?",
                f"You've covered that aspect well with '{user_text_brief}'. Now, how will you **engage your audience** further or address potential questions they might have about this point?",
                f"Strong work on '{user_text_brief}'. What's the best way to **summarize** or reinforce this idea before moving on to maintain a clear narrative?",
                f"Considering '{user_text_brief}', how will you **allocate time** during your presentation to ensure this important point gets sufficient focus without overwhelming your audience?",
                f"With '{user_text_brief}' clearly stated, how will you ensure your **call to action** or main conclusion is compelling and directly relates to this information?",
            ]

            if most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(presentation_nudges_low_medium)
                lisa_response = f"Looking good for your presentation! {chosen_question.lower()}"
            elif most_relevant_rubric_point_text and most_relevant_rubric_point_similarity >= SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                 chosen_question = random.choice(presentation_nudges_high)
                 lisa_response = f"Excellent for your presentation! {chosen_question}"
            else: # Fallback for presentation if no specific rubric match
                chosen_question = random.choice(presentation_nudges_low_medium) # Use low/medium as general
                lisa_response = f"Great input for your presentation! {chosen_question.lower()}"
            return lisa_response

        # Nudges for Creative Writing Assignments
        elif detected_subject == "Creative Writing":
            print("DEBUG: Nudging for Creative Writing Assignment.")
            creative_writing_nudges_low_medium = [
                f"You've written '{user_text_brief}'. How does this piece help to **develop** your characters or advance the plot?",
                f"Consider the **sensory details** in '{user_text_brief}'. How can you enrich them to make the scene more immersive?",
                f"To truly **express** your narrative voice, what emotions or internal thoughts could you add around '{user_text_brief}'?",
                f"You've set a scene with '{user_text_brief}'. How can you **build tension** or surprise for your reader?",
                f"Think about your **word choice** in '{user_text_brief}'. Are there stronger verbs or more evocative adjectives you could use?",
                f"How does '{user_text_brief}' contribute to the **overall theme** or message you're trying to convey?",
                f"What kind of **figurative language** (metaphor, simile, personification) could you use to enhance '{user_text_brief}'?",
                f"To show, not just tell, how would you rewrite '{user_text_brief}' to **demonstrate** the feeling or action?"
            ]
            creative_writing_nudges_high = [
                f"That's a compelling part with '{user_text_brief}'! How will you **transition** from this scene or idea to the next key moment in your story/poem?",
                f"Excellent! Your prose/poetry is strong in '{user_text_brief}'. How can you ensure the **pacing** of your narrative remains effective?",
                f"You've clearly conveyed that idea with '{user_text_brief}'. Now, consider **foreshadowing** or adding a subtle hint for future plot points?",
                f"With '{user_text_brief}' beautifully crafted, how can you deepen the **emotional impact** or ensure consistency in your character's reactions?",
                f"Fantastic! Your writing in '{user_text_brief}' is very evocative. What **sound devices** (alliteration, assonance) or rhythmic patterns could you introduce next?",
                f"You've completed that thought with '{user_text_brief}'. What's the **climax** or turning point you're building towards?",
            ]

            if most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(creative_writing_nudges_low_medium)
                lisa_response = f"Your creative writing is coming along! {chosen_question.lower()}"
            elif most_relevant_rubric_point_text and most_relevant_rubric_point_similarity >= SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(creative_writing_nudges_high)
                lisa_response = f"Excellent! {chosen_question}"
            else: # Fallback for creative writing if no specific rubric match
                chosen_question = random.choice(creative_writing_nudges_low_medium)
                lisa_response = f"Your creative writing is coming along! {chosen_question.lower()}"
            return lisa_response

        # Nudges for Art/Music Assignments
        elif detected_subject == "Art/Music":
            print("DEBUG: Nudging for Art/Music Assignment.")
            art_music_nudges_low_medium = [
                f"You've described '{user_text_brief}'. How does this relate to the **composition** or **form** of your artwork/music?",
                f"Consider the **elements of design** (line, shape, color, texture) or **musical elements** (melody, harmony, rhythm). How does '{user_text_brief}' contribute?",
                f"To truly **express** your artistic intent, what emotions or ideas do you want to convey through '{user_text_brief}'?",
                f"You've made a point about '{user_text_brief}'. How can you elaborate on the **technique** or **medium** you're using?",
                f"Think about the **audience's perception** of '{user_text_brief}'. What experience do you want to create for them?",
                f"How does '{user_text_brief}' contribute to the **overall theme** or concept of your piece?",
                f"What **art historical context** or **musical genre** does '{user_text_brief}' draw inspiration from or relate to?",
                f"Can you provide more detail on the **process** behind '{user_text_brief}' – your choices, challenges, or discoveries?"
            ]
            art_music_nudges_high = [
                f"That's a strong reflection on '{user_text_brief}'! How will you **showcase** this aspect in your final piece or performance?",
                f"Excellent! Your analysis of '{user_text_brief}' is clear. How can you ensure the **cohesion** and **unity** of your artwork/music?",
                f"You've clearly conveyed that idea with '{user_text_brief}'. Now, consider how you might **refine** or **polish** this element?",
                f"With '{user_text_brief}' well articulated, how will you ensure your piece has a compelling **climax** or a satisfying **resolution**?",
                f"Fantastic! Your insight on '{user_text_brief}' is valuable. How will you **present** or **perform** this aspect to maximize its impact?",
                f"You've completed that thought with '{user_text_brief}'. What's the **message** you hope your audience takes away from your artwork/music?",
            ]

            if most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(art_music_nudges_low_medium)
                lisa_response = f"Your work on this art/music piece is progressing! {chosen_question.lower()}"
            elif most_relevant_rubric_point_text and most_relevant_rubric_point_similarity >= SIMILARity_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(art_music_nudges_high)
                lisa_response = f"Excellent! {chosen_question}"
            else: # Fallback for art/music if no specific rubric match
                chosen_question = random.choice(art_music_nudges_low_medium)
                lisa_response = f"Your work on this art/music piece is progressing! {chosen_question.lower()}"
            return lisa_response

        # Nudges for Foreign Language Assignments
        elif detected_subject == "Foreign Language":
            print("DEBUG: Nudging for Foreign Language Assignment.")
            foreign_language_nudges_low_medium = [
                f"You've written '{user_text_brief}'. How does this demonstrate your understanding of **grammar** or **syntax** in the target language?",
                f"Consider your **vocabulary** in '{user_text_brief}'. Are there more precise or varied words you could use?",
                f"To truly **translate** your ideas, how can you ensure '{user_text_brief}' accurately reflects the nuance of the original intent?",
                f"You've made a point with '{user_text_brief}'. How does this reflect **cultural understanding** in the target language?",
                f"Think about **idiomatic expressions** or **common phrases** related to '{user_text_brief}'. Could you incorporate any?",
                f"How does '{user_text_brief}' help you **communicate** effectively in the target language?",
                f"What **verb tense** or **conjugation** is most appropriate for the action in '{user_text_brief}'?",
                f"Can you provide a different way to **express** the idea in '{user_text_brief}' using alternative phrasing?"
            ]
            foreign_language_nudges_high = [
                f"That's a well-formed sentence in '{user_text_brief}'! How will you **expand** on this idea to build a more complex narrative or argument?",
                f"Excellent! Your usage in '{user_text_brief}' is accurate. How can you ensure the **flow** and **cohesion** of your writing/speaking in the target language?",
                f"You've clearly conveyed that idea with '{user_text_brief}'. Now, consider incorporating more advanced **grammatical structures** or **vocabulary**.",
                f"With '{user_text_brief}' effectively communicated, how will you ensure your message is **culturally appropriate** and nuanced?",
                f"Fantastic! Your writing in '{user_text_brief}' is very natural. How will you practice **pronunciation** or **intonation** if this were spoken?",
                f"You've completed that thought with '{user_text_brief}'. What's the next **logical step** in developing your response in the target language?",
            ]

            if most_relevant_rubric_point_text and most_relevant_rubric_point_similarity < SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(foreign_language_nudges_low_medium)
                lisa_response = f"Great progress in your foreign language! {chosen_question.lower()}"
            elif most_relevant_rubric_point_text and most_relevant_rubric_point_similarity >= SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                chosen_question = random.choice(foreign_language_nudges_high)
                lisa_response = f"Excellent! {chosen_question}"
            else: # Fallback for foreign language if no specific rubric match
                chosen_question = random.choice(foreign_language_nudges_low_medium)
                lisa_response = f"Great progress in your foreign language! {chosen_question.lower()}"
            return lisa_response

        # General Academic Nudges (if not covered by specific categories above) - same as before
        elif most_relevant_rubric_point_text and user_text.strip():
            rephrased_rubric_concept = get_rephrased_rubric_concept(most_relevant_rubric_point_text)
            action_verb = extract_action_verb(most_relevant_rubric_point_text)

            # Nudges for LOW-MEDIUM SIMILARITY (Needs more development on the current point)
            if most_relevant_rubric_point_similarity < SIMILARITY_THRESHOLD_HIGH_COVERAGE:
                specific_nudges = [
                    f"You're on the right track! To fully **{action_verb}** **{rephrased_rubric_concept}**, what specific details or arguments can you add to your points on '{user_text_brief}'?",
                    f"Great start on '{user_text_brief}'. Now, how can you deepen your explanation or **{action_verb}** **{rephrased_rubric_concept}** more thoroughly?",
                    f"To strengthen your coverage of **{rephrased_rubric_concept}**, how can you build upon '{user_text_brief}' by providing more examples or evidence?",
                    f"Consider expanding on '{user_text_brief}' to ensure you comprehensively **{action_verb}** **{rephrased_rubric_concept}**.",
                    f"What else is crucial to **{action_verb}** regarding **{rephrased_rubric_concept}** that isn't yet covered by '{user_text_brief}'?",
                    f"Think about the requirements for **{rephrased_rubric_concept}**. How does '{user_text_brief}' align, and what more is needed to meet the rubric fully?",
                    f"You've introduced '{user_text_brief}'. Now, how can you **{action_verb}** the core idea of **{rephrased_rubric_concept}** in more detail?",
                    f"To make your argument for **{rephrased_rubric_concept}** stronger, what specific points related to '{user_text_brief}' could you **{action_verb}** next?",
                    f"What are the next logical steps to **{action_verb}** and fully address **{rephrased_rubric_concept}** based on your current input of '{user_text_brief}'?"
                ]
                chosen_question = random.choice(specific_nudges)
                lisa_response = f"Keep up the great work! Your input on '{user_text_brief}' is a good start, but {chosen_question.lower()}"
                return lisa_response

            # Nudges for HIGH SIMILARITY (Transition or move to next point)
            else: # most_relevant_rubric_point_similarity >= SIMILARITY_THRESHOLD_HIGH_COVERAGE
                high_sim_nudges = [
                    f"That's a strong contribution to **{rephrased_rubric_concept}** with '{user_text_brief}'! What's the next key detail or argument you want to add to *complete* this point?",
                    f"Excellent! You're really covering **{rephrased_rubric_concept}** well with '{user_text_brief}'. How can you build on this to add more depth or nuance, or transition to the next rubric item?",
                    f"Perfect! Now that you've clearly addressed **{rephrased_rubric_concept}** with '{user_text_brief}', what's the next logical step or transition to the next part of your assignment?",
                    f"You've clearly grasped **{rephrased_rubric_concept}** as shown by '{user_text_brief}'. Is there anything else you'd like to reinforce or clarify about this part before moving on?",
                    f"Fantastic progress on **{rephrased_rubric_concept}** with '{user_text_brief}'. What's the most impactful next piece of information you can provide to elevate your discussion, or are you ready to move to another rubric point?",
                    f"You're doing great with **{rephrased_rubric_concept}**! How can you ensure this point is as robust and complete as possible, building on '{user_text_brief}'? Or perhaps you're ready to tackle another aspect of the assignment?",
                    f"Wonderful! Your work on **{rephrased_rubric_concept}** is solid. What's the next big idea you want to introduce after '{user_text_brief}' to continue making progress on the assignment?",
                    f"You've significantly advanced on **{rephrased_rubric_concept}**. Would you like to refine this further, or should we look at other rubric points you could address next?",
                    f"Considering your strong coverage of **{rephrased_rubric_concept}**, what other key concepts from the rubric are you planning to address?"
                ]
                chosen_question = random.choice(high_sim_nudges)
                lisa_response = f"Excellent! {chosen_question}"
                return lisa_response

        else: # Generic nudge if sentence finished but no strong rubric relevance (similarity below threshold) AND not specific subject
            print("DEBUG: Generic nudge - sentence finished but no strong rubric relevance.")
            return "That's a solid input. What's the next point you want to make or how does this connect to the rubric?"

    # --- 3. Default/Fallback Responses (if no specific nudge above is returned) ---
    if inactivity_timer_fired:
        return "It looks like you've been inactive for a bit. Do you need some help continuing with this section?"
    elif paragraph_finished:
        return "Great work on that paragraph! What's the next section you plan to tackle, or how can you deepen the current ideas?"
    else:
        # Generic prompt if no specific rubric match or other trigger
        print("DEBUG: Generic prompt - no specific rubric match or other trigger.")
        return "Keep writing! I's here to help you develop your ideas and ensure you cover all aspects of your assignment."


# ----------------------------------------------------
# 🌐 Flask Routes (Assumed identical to LISA2.py for brevity, but would be included in the full file)
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
        previous_user_text = data.get('previous_user_text', '')
        inactivity_timer_fired = data.get('inactivity_timer_fired', False)
        paragraph_finished = data.get('paragraph_finished', False)
        assignment_complete = data.get('assignment_complete', False)
        # recent_sentence_completed is now mostly handled by internal logic, but keep if frontend still sends it
        # and we want to allow frontend to *also* trigger a sentence finished, e.g. for a user-explicit 'done typing' signal.
        recent_sentence_completed_from_frontend = data.get('recent_sentence_completed', False)


        # Process Rubric (split into points)
        # Using a more robust regex to handle various bullet types and bolding
        rubric_points = [point.strip() for point in re.split(r'\n[*-]?\s*|\*\*(.*?)\*\*', rubric) if point and point.strip() and not point.strip().startswith('**')]
        rubric_points_list = []
        for point in rubric_points:
            # Further clean the point to remove leading bullets/hyphens and extra spaces
            cleaned_point = re.sub(r'^\s*[-*•\d\.]?\s*', '', point).strip()
            if cleaned_point:
                rubric_points_list.append(cleaned_point)
        print(f"DEBUG: Processed Rubric Points: {rubric_points_list}")


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

        # --- Calculate `sentence_finished` and `is_formula_completion` internally ---
        internal_completion_status, is_formula_completion = _calculate_completion_status(user_text, previous_user_text, detected_subject)
        # Use internal detection OR the frontend's signal (if it still sends it, for flexibility)
        sentence_finished = internal_completion_status or recent_sentence_completed_from_frontend
        print(f"DEBUG: Internal completion status: {internal_completion_status}, Is formula completion: {is_formula_completion}, Frontend signal: {recent_sentence_completed_from_frontend}, Final sentence_finished: {sentence_finished}")


        # Call generate_lisa_response with all necessary (and computed) arguments
        lisa_response = generate_lisa_response(
            assignment_title, rubric, user_text, previous_user_text,
            inactivity_timer_fired, paragraph_finished, sentence_finished,
            current_text_embedding, title_embedding, rubric_point_embeddings, rubric_points_list,
            predicted_class,
            most_relevant_rubric_point_text, most_relevant_rubric_point_similarity,
            detected_subject, is_formula_completion, assignment_complete
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