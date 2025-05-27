# Postpartum Care Chatbot with Google Gemini API

This chatbot provides supportive information about postpartum depression, anxiety, and other mental health concerns for new mothers.

## Setup Instructions

### 1. Get a Google Gemini API Key

To use the actual Google Gemini API (instead of the mock responses):

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an account if you don't have one
3. Create a new API key
4. Copy the API key for use in the next step

### 2. Configure the API Key

Create a `.env` file in the chatbot directory with the following content:

```
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the actual API key you received.

### 3. Install Dependencies

Make sure you have the required Python packages:

```
pip install requests python-dotenv
```

### 4. Update the Code for API Integration

To use the real API instead of mock responses, you would need to modify the `get_gemini_response` function in `chatbot.py`. The current implementation includes comments explaining where you would make these changes.

## Usage

The chatbot is designed to provide evidence-based information about postpartum mental health, with a focus on:

- Postpartum depression symptoms and treatment
- Anxiety and intrusive thoughts
- Emotional wellbeing after childbirth
- Self-care strategies
- When to seek professional help

## Important Note

This chatbot is for informational purposes only and is not a substitute for professional medical advice. Always consult with healthcare providers for medical concerns. 