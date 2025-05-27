# Install Google Generative AI SDK (uncomment if needed)
# !pip install -q -U google-generativeai

import os
import google.generativeai as genai
import re
import argparse
import json
import time
import sys
import random
import uuid
import traceback

# Debug logging function that uses stderr
def log_debug(message):
    print(message, file=sys.stderr)

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    log_debug("Loaded environment variables from .env file")
except Exception as e:
    log_debug(f"Error loading .env file: {e}")
    log_debug("Continuing with default configuration")

# Configure your API key securely
api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
if not api_key:
    log_debug("Warning: GOOGLE_GEMINI_API_KEY not found in environment variables")
    api_key = 'AIzaSyARBMUYTSXizEtyK1QjJ5sR_GGxChi5EIY'  # Fallback to hardcoded key
os.environ['GOOGLE_API_KEY'] = api_key
genai.configure(api_key=api_key)

try:
    # Initialize Gemini model
    log_debug("Attempting to initialize Gemini model...")
    postpartum_model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Test the model with a simple query to verify it's working
    test_response = postpartum_model.generate_content("Hello")
    log_debug("Successfully initialized and tested Gemini model")
except Exception as e:
    log_debug(f"Error initializing Gemini model: {e}")
    log_debug(traceback.format_exc())
    log_debug("API Key used (first 4 chars): " + api_key[:4] + "..." if api_key else "No API key found")
    # Fallback to a default function in case the model initialization fails
    def fallback_generate_content(prompt_list):
        class FallbackResponse:
            def __init__(self, text):
                self.text = text
        
        return FallbackResponse("I'm sorry, I'm currently experiencing technical difficulties connecting to my knowledge base. Please try again in a few moments.")
    
    # Create a mock model with a generate_content method
    class FallbackModel:
        def generate_content(self, prompt_list):
            return fallback_generate_content(prompt_list)
    
    postpartum_model = FallbackModel()

# System instruction for the model
system_instruction = """
You are an AI assistant specializing in postpartum care. Your primary goal is to provide helpful, accurate information to mothers in the postpartum period.

RESPONSE STYLE GUIDELINES:
1. For definition questions (e.g., "What is X?"):
   - Provide 2-3 concise but informative sentences
   - Focus on core information without additional facts unless requested

2. For list-based questions (e.g., "What are symptoms/treatments of X?"):
   - Provide 4-6 bullet points with brief explanations for each point
   - Include a 1-sentence explanation with each bullet point to provide context
   - Example: "• Persistent sadness: Feeling down or depressed most of the day, nearly every day"

3. For "how to" questions:
   - Provide step-by-step guidance with brief explanations
   - 4-6 numbered steps with 1-2 sentences each

GENERAL RULES:
- Start responses directly without introductory phrases like "Here are..."
- Avoid phrases like "It's important to note" or "Remember that"
- Never say "If you have more questions" or "I hope this helps"
- Format lists with bullet points (•) and provide a brief explanation for each point
- Use simple, direct language accessible to non-medical audiences
- For serious medical concerns, include a brief reminder to consult healthcare providers
"""

# Make conversation states persist
_GLOBAL_CONVERSATION_STATES = {}

# Conversation steps in order
STEPS = [
    'greeting',
    'name',
    'age',
    'problem',
    'symptoms',
    'details',
    'report'
]

# Questions for each step
QUESTIONS = {
    'greeting': "Hello! I'm your postpartum care assistant. What's your name?",
    'name': "Thank you. What's your name?",
    'age': "Thank you. How old are you?",
    'problem': "Now, could you briefly describe what postpartum concerns you're experiencing?",
    'symptoms': "Thank you for sharing that. Could you describe your symptoms in more detail?",
    'details': "Thank you for sharing that. Could you provide more details about how these symptoms are affecting your daily life or any specific questions you have?",
    'report': "I'll now provide you with a comprehensive report about your situation, including possible causes and a treatment plan."
}

def get_conversation_states():
    global _GLOBAL_CONVERSATION_STATES
    return _GLOBAL_CONVERSATION_STATES

def set_conversation_state(user_id, state):
    global _GLOBAL_CONVERSATION_STATES
    _GLOBAL_CONVERSATION_STATES[user_id] = state
    
    # Also save to file for persistence between runs
    try:
        state_file = os.path.join('temp', f'state_{user_id}.json')
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, default=str)
        log_debug(f"Saved state to file for user_id={user_id}")
    except Exception as e:
        log_debug(f"Error saving state to file: {e}")
    
def get_user_state(user_id):
    """Get or create user state for conversation tracking."""
    conversation_states = get_conversation_states()
    
    # First check if we have a state file
    try:
        state_file = os.path.join('temp', f'state_{user_id}.json')
        if os.path.exists(state_file):
            with open(state_file, 'r', encoding='utf-8') as f:
                state = json.load(f)
                log_debug(f"Loaded state from file for user_id={user_id}")
                
                # Ensure all required fields are present
                default_state = {
                    'step': 'greeting',
                    'name': None,
                    'age': None,
                    'problem': None,
                    'symptoms': None,
                    'details': None,
                    'responses': {}
                }
                
                # Update with defaults for any missing fields
                for key, value in default_state.items():
                    if key not in state:
                        state[key] = value
                        log_debug(f"Added missing field '{key}' to state")
                
                conversation_states[user_id] = state
                return state
    except Exception as e:
        log_debug(f"Error loading state from file: {e}")
    
    if user_id not in conversation_states:
        # Initialize new user state
        print(f"DEBUG: Creating NEW state for user_id={user_id}", file=sys.stderr)
        new_state = {
            'step': 'greeting',
            'name': None,
            'age': None,
            'problem': None,
            'symptoms': None,
            'details': None,
            'responses': {}
        }
        set_conversation_state(user_id, new_state)
    else:
        print(f"DEBUG: Using EXISTING state for user_id={user_id}, current_step='{conversation_states[user_id]['step']}'", file=sys.stderr)
    
    return conversation_states[user_id]

def update_user_state(user_id, response):
    """Update user state based on current step and response."""
    state = get_user_state(user_id)
    current_step = state['step']
    
    # DEBUG: Show exactly what's happening
    print(f"DEBUG: update_user_state for user_id={user_id}, current_step='{current_step}', response='{response}'", file=sys.stderr)
    
    # Store response for current step
    state['responses'][current_step] = response
    
    # Update specific fields based on step
    if current_step == 'greeting':
        state['step'] = 'name'
        print(f"DEBUG: Moving from 'greeting' → 'name'", file=sys.stderr)
        set_conversation_state(user_id, state)
        return QUESTIONS['name']
        
    elif current_step == 'name':
        state['name'] = response
        state['step'] = 'age'
        print(f"DEBUG: Moving from 'name' → 'age', saved name='{response}'", file=sys.stderr)
        set_conversation_state(user_id, state)
        return QUESTIONS['age']
        
    elif current_step == 'age':
        state['age'] = response
        state['step'] = 'problem'
        print(f"DEBUG: Moving from 'age' → 'problem', saved age='{response}'", file=sys.stderr)
        set_conversation_state(user_id, state)
        return QUESTIONS['problem']
        
    elif current_step == 'problem':
        state['problem'] = response
        state['step'] = 'symptoms'
        print(f"DEBUG: Moving from 'problem' → 'symptoms', saved problem='{response}'", file=sys.stderr)
        set_conversation_state(user_id, state)
        return QUESTIONS['symptoms']
        
    elif current_step == 'symptoms':
        state['symptoms'] = response
        state['step'] = 'details'
        print(f"DEBUG: Moving from 'symptoms' → 'details', saved symptoms='{response}'", file=sys.stderr)
        set_conversation_state(user_id, state)
        return QUESTIONS['details']
        
    elif current_step == 'details':
        state['details'] = response
        state['step'] = 'report'
        print(f"DEBUG: Moving from 'details' → 'report', generating report", file=sys.stderr)
        set_conversation_state(user_id, state)
        # Generate the final report
        return generate_report(state)
    
    # If already at report stage, generate a new response based on follow-up question
    elif current_step == 'report':
        print(f"DEBUG: Already at 'report' step, handling as follow-up", file=sys.stderr)
        # We don't change state here
        set_conversation_state(user_id, state)
        # Handle follow-up questions after report
        return generate_follow_up_response(state, response)
    
    # Fallback
    print(f"DEBUG: Unknown step '{current_step}', returning fallback message", file=sys.stderr)
    set_conversation_state(user_id, state)
    return "I'm not sure I understand. Could you please respond to my previous question?"

def generate_report(state):
    """Generate a comprehensive report with diagnosis, causes, and treatment plan."""
    try:
        name = state.get('name', 'there')
        age = state.get('age', 'Unknown')
        problem = state.get('problem', 'Not specified')
        symptoms = state.get('symptoms', 'Not specified')
        details = state.get('details', 'Not specified')
        
        # Create prompt for the AI model
        prompt = f"""
Based on the following information about a postpartum patient:
- Name: {name}
- Age: {age}
- Main concerns: {problem}
- Specific symptoms: {symptoms}
- Additional details: {details}

Please provide a comprehensive postpartum health report with the following sections:

## Summary of Symptoms and Possible Diagnosis
[Provide a brief summary here]

## Likely Causes of These Symptoms
• [Cause 1 with brief explanation]
• [Cause 2 with brief explanation]
• [Cause 3 with brief explanation]
• [Cause 4 with brief explanation]

## Detailed Treatment Plan with Specific Recommendations
**Category 1:**
• [Recommendation with brief explanation]
• [Recommendation with brief explanation]
• [Recommendation with brief explanation]

**Category 2:**
• [Recommendation with brief explanation]
• [Recommendation with brief explanation]
• [Recommendation with brief explanation]

## When to Seek Professional Medical Help
• [Situation 1]
• [Situation 2]
• [Situation 3]
• [Situation 4]

Use proper bullet points (•) for all lists and make sure the formatting is clear and consistent.
"""
        
        # Generate response
        log_debug("Generating comprehensive report...")
        response = postpartum_model.generate_content([system_instruction, prompt])
        
        # Format the response
        result = response.text
        
        # Check if we have the pattern of characters between each letter
        if re.search(r'\w[•]\w[•]\w', result) or '' in result:
            log_debug("Detected character encoding issue with bullets between letters")
            # Keep only alphanumeric characters, spaces, and basic punctuation
            result = ''.join(c for c in result if c.isalnum() or c.isspace() or c in '.,;:!?-()[]{}"\'/\\')
        
        # Add personalized greeting
        report = f"## Postpartum Health Report for {name}\n\n{result}"
        
        # Format output
        formatted_report = format_output(report)
        return formatted_report
        
    except Exception as e:
        log_debug(f"Error generating report: {e}")
        return f"I apologize, but I encountered an error while generating your report. Based on what you've shared about your postpartum symptoms, I recommend speaking with a healthcare provider who can provide a proper evaluation and personalized guidance."

def generate_follow_up_response(state, question):
    """Generate response to follow-up questions after the report."""
    try:
        name = state.get('name', 'there')
        age = state.get('age', 'Unknown')
        problem = state.get('problem', 'Not specified')
        symptoms = state.get('symptoms', 'Not specified')
        details = state.get('details', 'Not specified')
        
        # Create context with user information
        context = f"""
User information:
- Name: {name}
- Age: {age}
- Main concerns: {problem}
- Reported symptoms: {symptoms}
- Additional details: {details}

The user has already received a comprehensive report about their postpartum health issues, 
and is now asking a follow-up question: "{question}"

Please answer their specific question directly, drawing on the context of their reported symptoms.
"""
        
        # Generate response
        log_debug("Generating follow-up response...")
        response = postpartum_model.generate_content([system_instruction, context])
        
        # Get the text and clean it
        result = response.text
        
        # Check if we have the pattern of characters between each letter
        if re.search(r'\w[•]\w[•]\w', result) or '' in result:
            log_debug("Detected character encoding issue with bullets between letters")
            # Keep only alphanumeric characters, spaces, and basic punctuation
            result = ''.join(c for c in result if c.isalnum() or c.isspace() or c in '.,;:!?-()[]{}"\'/\\')
        else:
            # Just remove bullet points
            result = re.sub(r'[•]', '', result)
        
        return format_output(result)
        
    except Exception as e:
        log_debug(f"Error generating follow-up response: {e}")
        return f"I'm sorry, I couldn't process that question properly. Could you rephrase your question about postpartum care?"

def format_output(text):
    """Format the output for better readability."""
    # First, check if we have the pattern of characters between each letter
    if re.search(r'\w[•]\w[•]\w', text) or '' in text:
        log_debug("Detected character encoding issue with bullets between letters")
        # Keep only alphanumeric characters, spaces, and basic punctuation
        formatted_text = ''.join(c for c in text if c.isalnum() or c.isspace() or c in '.,;:!?-()[]{}"\'/\\')
    else:
        # Normal handling for regular text
        # Remove all bullet characters that might be causing encoding issues
        formatted_text = re.sub(r'[•]', '', text)
        
        # Fix the pattern where bullets appear between each character
        formatted_text = re.sub(r'(\w)[•](\w)', r'\1\2', formatted_text)
        
        # Also handle cases where there are spaces between characters with bullets
        formatted_text = re.sub(r'(\w)[•]\s+[•](\w)', r'\1 \2', formatted_text)
    
    # Now proceed with normal formatting
    # Ensure markdown headings display properly
    formatted_text = re.sub(r'##\s+([^\n]+)', r'\n## \1\n', formatted_text)
    
    # Remove duplicate headings (like duplicate "Postpartum Health Report for...")
    formatted_text = re.sub(r'(## Postpartum Health Report for [^\n]+)\s*\n\s*##\s+([a-zA-Z]+ [a-zA-Z]+)', r'\1\n\n', formatted_text)
    
    # Remove any '#' characters that are not part of headings
    formatted_text = re.sub(r'\n#\s*\n', '\n\n', formatted_text)
    
    # Fix asterisks used as bullet points
    formatted_text = re.sub(r'\*\*([^*]+):\*', r'**\1:**', formatted_text)
    
    # Add proper bullet points for lists
    formatted_text = re.sub(r'\n\s*[-*]\s+', '\n• ', formatted_text)
    
    # Ensure nested bullet points are properly displayed
    formatted_text = re.sub(r'\n\s+•\s+', '\n    • ', formatted_text)
    formatted_text = re.sub(r'\n\s+\*\s+', '\n    • ', formatted_text)
    
    # Ensure numbered lists display properly
    formatted_text = re.sub(r'(\d+\.\s+)', r'\n\1', formatted_text)
    
    # Clean up multiple consecutive newlines
    formatted_text = re.sub(r'\n{3,}', '\n\n', formatted_text)
    
    # Fix spacing after headings
    formatted_text = re.sub(r'(## [^\n]+)\n([^#\n])', r'\1\n\n\2', formatted_text)
    
    return formatted_text

def check_restart(message):
    """Check if user wants to restart the conversation."""
    restart_patterns = [
        r'\b(restart|start\s*over|reset|begin\s*again|new\s*conversation)\b',
        r'\b(let\'?s\s*start\s*over|let\'?s\s*begin\s*again)\b',
        r'\b(start\s*new|new\s*chat|clear|fresh\s*start)\b'
    ]
    
    # Also check for exact matches
    exact_matches = ['restart', 'reset', 'clear', 'new', 'start over']
    
    if any(message.lower() == match for match in exact_matches):
        return True
    
    for pattern in restart_patterns:
        if re.search(pattern, message.lower()):
            return True
    
    return False

def process_message(message, user_id=None):
    """Main function to process incoming messages and advance the conversation."""
    if not user_id:
        user_id = str(uuid.uuid4())
    
    print(f"DEBUG: process_message start: user_id={user_id}, message='{message}'", file=sys.stderr)
    
    if not message:
        return "Please enter a message."
    
    # Check if user wants to restart
    if check_restart(message) or message.lower() == 'new case':
        print(f"DEBUG: Detected restart request, clearing state for user_id={user_id}", file=sys.stderr)
        reset_user_state(user_id)
        return QUESTIONS['greeting']
    
    # Get current user state
    state = get_user_state(user_id)
    
    # Check if this is a greeting message (should reset conversation regardless of current step)
    greeting_patterns = ['hello', 'hi', 'hey', 'start', 'greetings', 'good morning', 'good afternoon', 'good evening']
    if any(message.lower() == greeting for greeting in greeting_patterns):
        print(f"DEBUG: Detected simple greeting message, resetting conversation", file=sys.stderr)
        reset_user_state(user_id)
        return QUESTIONS['greeting']
    
    print(f"DEBUG: Current state details: step='{state['step']}', name='{state['name']}', age='{state['age']}'", file=sys.stderr)
    
    # Check if this is the first message in a new conversation
    if state['step'] == 'greeting':
        # For the very first message, we're expecting the user's name
        state['name'] = message
        state['step'] = 'age'  # Skip directly to age question
        set_conversation_state(user_id, state)
        print(f"DEBUG: First message handled as name: '{message}'", file=sys.stderr)
        return QUESTIONS['age']
    
    # Update state and get next question/response
    response = update_user_state(user_id, message)
    
    print(f"DEBUG: Final response: '{response[:50]}...'", file=sys.stderr)
    return response

def reset_user_state(user_id):
    """Reset the user state to start a new conversation."""
    global _GLOBAL_CONVERSATION_STATES
    
    # Remove from memory
    if user_id in _GLOBAL_CONVERSATION_STATES:
        del _GLOBAL_CONVERSATION_STATES[user_id]
    
    # Delete state file if it exists
    try:
        state_file = os.path.join('temp', f'state_{user_id}.json')
        if os.path.exists(state_file):
            os.remove(state_file)
            log_debug(f"Deleted state file for user_id={user_id}")
    except Exception as e:
        log_debug(f"Error deleting state file: {e}")
    
    # Create a fresh state
    new_state = {
        'step': 'greeting',
        'name': None,
        'age': None,
        'problem': None,
        'symptoms': None,
        'details': None,
        'responses': {}
    }
    
    # Save the fresh state
    set_conversation_state(user_id, new_state)
    log_debug(f"Created fresh state for user_id={user_id}")

def handle_cli_args():
    """Handle command line arguments for integration with Node.js."""
    parser = argparse.ArgumentParser(description='Postpartum Care Chatbot')
    parser.add_argument('--input', type=str, help='Path to input file')
    parser.add_argument('--output', type=str, help='Path to output file')
    parser.add_argument('--interactive', action='store_true', help='Run in interactive mode')
    parser.add_argument('--user', type=str, help='User ID for the conversation', default='anonymous')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    return parser.parse_args()

def main():
    args = handle_cli_args()
    
    # Check if API key is properly configured
    if not api_key:
        print("ERROR: No API key configured. Please set the GOOGLE_GEMINI_API_KEY environment variable.")
        print("See README.md for setup instructions.")
        return
    
    # If input and output files are provided, process in API mode
    if args.input and args.output:
        try:
            log_debug(f"Reading input from {args.input}")
            with open(args.input, 'r', encoding='utf-8') as f:
                message = f.read().strip()
            
            log_debug(f"Processing message: '{message}'")
            response = process_message(message, args.user)
            log_debug(f"Generated response: '{response}'")
            
            log_debug(f"Writing output to {args.output}")
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(response)
                
            log_debug("Finished processing request")
            return
        except Exception as e:
            log_debug(f"Error in file processing: {e}")
            log_debug(traceback.format_exc())
            print(f"Error processing files: {e}")
            return
    
    # Otherwise, run in interactive mode
    print("🧠 Postpartum Care Assistant")
    print("Type your question or type 'q' to quit.\n")

    user_id = str(uuid.uuid4())
    print(QUESTIONS['greeting'])

    while True:
        try:
            query = input("You: ").strip()
            if query.lower() == 'q':
                print("Session ended.")
                break

            if not query:
                print("Please enter a message.\n")
                continue

            response = process_message(query, user_id)
            print("\nAssistant:")
            print(response, "\n")

        except KeyboardInterrupt:
            print("\nSession ended.")
            break
        except Exception as e:
            print(f"Error: {e}")
            print(f"Debug info: {traceback.format_exc()}")
            print("Please try again or restart the chatbot.\n")

if __name__ == "__main__":
    main()
