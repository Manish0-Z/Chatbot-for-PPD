# AI-powered chatbot with Gemini AI integration
import argparse
import json
import os
import sys
import random
import uuid
import requests
import time
import traceback
from enum import Enum

# Add the directory containing this file to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def log_debug(message):
    """Log debug messages to stderr"""
    print(f"DEBUG: {message}", file=sys.stderr)

# Set up Gemini API (will be imported only if needed)
GEMINI_API_KEY = "AIzaSyCgoj28sqDug2XugD6NWNx0z0Zm75rpmM8"

# Directory to store state files
STATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
if not os.path.exists(STATE_DIR):
    os.makedirs(STATE_DIR)

class ConversationState(Enum):
    GREETING = "GREETING"
    AWAITING_AGE = "AWAITING_AGE"
    AGE_VERIFICATION_FAILED = "AGE_VERIFICATION_FAILED"
    AWAITING_BIRTH_TIMING = "AWAITING_BIRTH_TIMING"
    IN_PREGNANCY_INFO = "IN_PREGNANCY_INFO"
    SYMPTOMS_QUESTION = "SYMPTOMS_QUESTION"
    EMOTIONAL_QUESTION = "EMOTIONAL_QUESTION"
    MENTAL_QUESTION = "MENTAL_QUESTION"
    SLEEP_QUESTION = "SLEEP_QUESTION"
    PHYSICAL_QUESTION = "PHYSICAL_QUESTION"
    USER_LED = "USER_LED"
    SYMPTOMS_QUESTIONNAIRE = "SYMPTOMS_QUESTIONNAIRE"

class GeminiChatbot:
    """Class to handle interactions with Gemini API"""
    
    def __init__(self):
        # We'll keep the API integration but make it more robust
        self.initialized = True
        self.user_states = {}
        self.last_responses = {}
            
    def reset_state(self, user_id=None):
        """Reset the conversation state to GREETING"""
        if user_id:
            self.user_states[user_id] = ConversationState.GREETING
            log_debug(f"Reset state for user {user_id} to GREETING")
        else:
            # Reset state for all users (generally not used)
            for uid in self.user_states:
                self.user_states[uid] = ConversationState.GREETING
                log_debug(f"Reset state for user {uid} to GREETING")
        
        # Save the updated state
        if user_id:
            self.save_state(user_id)
            
    def load_state(self, user_id):
        """Load state from file"""
        log_debug(f"Loading state for user {user_id}")
        state_file = os.path.join(STATE_DIR, f'state_{user_id}.json')
        if os.path.exists(state_file):
            try:
                with open(state_file, 'r') as f:
                    state_data = json.load(f)
                    self.user_states[user_id] = ConversationState(state_data.get('state', 'GREETING'))
                    log_debug(f"Loaded state: {self.user_states[user_id]}")
                    return True
            except Exception as e:
                log_debug(f"Error loading state: {e}")
                log_debug(traceback.format_exc())
        log_debug(f"No existing state found, initializing new state for {user_id}")
        return False

    def save_state(self, user_id):
        """Save state to file"""
        log_debug(f"Saving state for user {user_id}: {self.user_states.get(user_id)}")
        state_file = os.path.join(STATE_DIR, f'state_{user_id}.json')
        try:
            state_to_save = {
                'state': self.user_states.get(user_id, ConversationState.GREETING).value
            }
            with open(state_file, 'w') as f:
                json.dump(state_to_save, f)
            log_debug(f"State saved successfully")
        except Exception as e:
            log_debug(f"Error saving state: {e}")
            log_debug(traceback.format_exc())
    
    def _update_state(self, user_id, message):
        """Update the conversation state based on user input."""
        log_debug(f"Updating state for user {user_id}")
        log_debug(f"Current state: {self.user_states.get(user_id)}")
        log_debug(f"Message: '{message}'")
        
        current_state = self.user_states.get(user_id)
        
        if current_state == ConversationState.GREETING:
            log_debug("State transition: GREETING -> AWAITING_AGE")
            self.user_states[user_id] = ConversationState.AWAITING_AGE

        elif current_state == ConversationState.AWAITING_AGE or current_state == ConversationState.AGE_VERIFICATION_FAILED:
            try:
                age = None
                if message.isdigit():
                    age = int(message)
                    log_debug(f"Parsed age: {age}")
                elif 'year' in message:
                    numbers = [int(s) for s in message.split() if s.isdigit()]
                    if numbers:
                        age = numbers[0]
                        log_debug(f"Parsed age from text: {age}")
                
                if age is not None:
                    if age < 18:
                        log_debug("Age under 18, transitioning to AGE_VERIFICATION_FAILED")
                        self.user_states[user_id] = ConversationState.AGE_VERIFICATION_FAILED
                    else:
                        log_debug("Adult age, transitioning to AWAITING_BIRTH_TIMING")
                        self.user_states[user_id] = ConversationState.AWAITING_BIRTH_TIMING
                else:
                    log_debug("Could not parse age from message")
            except Exception as e:
                log_debug(f"Error processing age: {e}")
                log_debug(traceback.format_exc())
        
        elif current_state == ConversationState.AWAITING_BIRTH_TIMING:
            not_given_birth_phrases = ['not yet', 'haven\'t given birth', 'no birth', 'still pregnant', 'expecting']
            if any(phrase in message.lower() for phrase in not_given_birth_phrases):
                log_debug("User has not given birth, transitioning to IN_PREGNANCY_INFO")
                self.user_states[user_id] = ConversationState.IN_PREGNANCY_INFO
            else:
                log_debug("User has given birth, transitioning to EMOTIONAL_QUESTION")
                self.user_states[user_id] = ConversationState.EMOTIONAL_QUESTION
        
        elif current_state == ConversationState.IN_PREGNANCY_INFO:
            log_debug("Staying in IN_PREGNANCY_INFO state")
            # The state doesn't change here unless the user wants to exit
            pass

        elif current_state == ConversationState.EMOTIONAL_QUESTION:
            log_debug("User provided emotional state, transitioning to MENTAL_QUESTION state")
            self.user_states[user_id] = ConversationState.MENTAL_QUESTION
            
        elif current_state == ConversationState.MENTAL_QUESTION:
            log_debug("User provided mental state, transitioning to SLEEP_QUESTION state")
            self.user_states[user_id] = ConversationState.SLEEP_QUESTION
            
        elif current_state == ConversationState.SLEEP_QUESTION:
            log_debug("User provided sleep info, transitioning to PHYSICAL_QUESTION state")
            self.user_states[user_id] = ConversationState.PHYSICAL_QUESTION
            
        elif current_state == ConversationState.PHYSICAL_QUESTION:
            log_debug("User provided physical state, transitioning to SYMPTOMS_QUESTION state")
            self.user_states[user_id] = ConversationState.SYMPTOMS_QUESTION
            
        elif current_state == ConversationState.SYMPTOMS_QUESTION:
            log_debug("User provided symptoms, transitioning to USER_LED state")
            self.user_states[user_id] = ConversationState.USER_LED

        elif current_state == ConversationState.SYMPTOMS_QUESTIONNAIRE:
            if 'exit' in message.lower() or 'back' in message.lower():
                log_debug("Exiting symptoms questionnaire, transitioning to USER_LED")
                self.user_states[user_id] = ConversationState.USER_LED
            else:
                log_debug("Staying in SYMPTOMS_QUESTIONNAIRE state")
                # Stay in symptoms questionnaire state to continue the assessment
                pass
        
        # Check for symptoms keywords in any state to transition to symptoms questionnaire
        if current_state == ConversationState.USER_LED:
            symptoms_keywords = ['symptoms', 'symptom', 'check symptoms', 'assessment']
            if any(keyword in message.lower() for keyword in symptoms_keywords):
                log_debug("Symptoms keyword detected, transitioning to SYMPTOMS_QUESTIONNAIRE")
                self.user_states[user_id] = ConversationState.SYMPTOMS_QUESTIONNAIRE
        
        log_debug(f"New state: {self.user_states.get(user_id)}")

    def get_response(self, user_id, message):
        """Get response to user message"""
        log_debug(f"Getting response for user {user_id}")
        log_debug(f"Incoming message: '{message}'")
        
        # Check if user wants to start a new conversation
        if message and message.strip().lower() == 'new':
            log_debug("User requested a new conversation - resetting state")
            self.reset_state(user_id)
            # Return only the greeting message
            return "Hi, I'm MOM, your postpartum support companion"
        
        # If this is a new user, initialize the state
        if user_id not in self.user_states:
            log_debug("New user, initializing with GREETING state")
            self.user_states[user_id] = ConversationState.GREETING
            self.save_state(user_id)
            return "Hi, I'm MOM, your postpartum support companion"
        
        # Get current state before updating
        current_state = self.user_states[user_id]
        
        # Update state based on user message
        self._update_state(user_id, message.strip().lower())
        
        # Get new state after update
        new_state = self.user_states[user_id]
        
        log_debug(f"State transition: {current_state} -> {new_state}")
        
        # Generate response based on the new state
        response = self.get_response_for_state(new_state, message)
        
        # Save the updated state after generating response
        self.save_state(user_id)
        
        log_debug(f"Response generated: '{response}'")
        return response

    def handle_symptoms_questionnaire(self, option):
        """Handle symptoms questionnaire based on user input"""
        log_debug(f"Handling symptoms questionnaire with input: '{option}'")
        
        option = option.strip().lower()
        
        # Initial symptoms questionnaire menu
        if not option or 'symptoms' in option or 'check' in option or 'assess' in option:
            return """I can help you assess common postpartum symptoms. Which area would you like to check?

1. 😔 Emotional symptoms (mood, anxiety, etc.)
2. 💭 Mental symptoms (concentration, memory, etc.)
3. 💤 Sleep issues
4. 💪 Physical recovery concerns
5. 👥 Social or relationship changes

Please choose a number (1-5), or type 'exit' to talk about something else."""
        
        # Validate if user entered a number outside the valid range
        if option.isdigit() and (int(option) < 1 or int(option) > 5):
            return """Please select a valid number between 1 and 5:

1. 😔 Emotional symptoms (mood, anxiety, etc.)
2. 💭 Mental symptoms (concentration, memory, etc.)
3. 💤 Sleep issues
4. 💪 Physical recovery concerns
5. 👥 Social or relationship changes

Please choose a number (1-5), or type 'exit' to talk about something else."""
        
        # Process specific symptom options
        if option == '1' or 'emotion' in option or 'mood' in option or 'anxiety' in option:
            return """Here's a quick assessment of common emotional symptoms after birth. Have you experienced any of these in the past 2 weeks?

• Persistent sadness or crying
• Feeling overwhelmed, worthless, or excessively guilty
• Loss of interest in activities you used to enjoy
• Withdrawing from family and friends
• Excessive worry or anxiety
• Anger or irritability that seems out of proportion
• Thoughts of harming yourself or your baby

If you're experiencing several of these symptoms, especially if they're intense or persistent, it's important to speak with your healthcare provider. Postpartum mood disorders are common and treatable.

Would you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation."""
            
        elif option == '2' or 'mental' in option or 'concentration' in option or 'memory' in option:
            return """Here's a quick assessment of common mental symptoms after birth. Have you experienced any of these consistently?

• Difficulty concentrating or making decisions
• Forgetfulness or feeling mentally foggy
• Racing thoughts that are difficult to control
• Obsessive worries or intrusive thoughts
• Difficulty focusing on tasks
• Feeling detached or like you're "going through the motions"

Some mental changes are normal due to hormones, sleep disruption, and adjustment to new responsibilities. However, if these symptoms significantly interfere with your daily functioning, consider discussing them with your healthcare provider.

Would you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation."""
            
        elif option == '3' or 'sleep' in option or 'insomnia' in option or 'rest' in option:
            return """Here's a quick assessment of common sleep issues after birth. Are you experiencing any of these?

• Difficulty falling asleep even when baby is sleeping
• Waking up with anxiety even when baby hasn't woken you
• Intense dreams or nightmares
• Feeling unrested even after getting some sleep
• Complete inability to nap or sleep when given the opportunity
• Racing thoughts that prevent sleep

While interrupted sleep is expected with a new baby, the issues above may indicate a sleep disorder that could benefit from professional guidance. Sleep disruption can significantly impact your recovery and mental health.

Would you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation."""
            
        elif option == '4' or 'physical' in option or 'pain' in option or 'recovery' in option:
            return """Here's a quick assessment of physical recovery concerns. Are you experiencing any of these beyond what your provider indicated as normal?

• Pain or discomfort that isn't improving or is getting worse
• Excessive or changing pattern of bleeding
• Fever over 100.4°F (38°C)
• Severe headache, especially with vision changes
• Swelling, redness, or discharge from incisions
• Difficulty urinating or painful urination
• Chest pain or difficulty breathing

Any concerning physical symptoms should be reported to your healthcare provider promptly. Physical recovery is individual, but certain symptoms need immediate medical attention.

Would you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation."""
            
        elif option == '5' or 'social' in option or 'relationship' in option:
            return """Here's a quick assessment of social and relationship changes. Have you noticed any of these since birth?

• Feelings of isolation or disconnection from others
• Significant strain in your relationship with your partner
• Difficulty bonding with your baby
• Feeling misunderstood by friends or family
• Avoiding social situations you would normally enjoy
• Feeling judged about your parenting choices

Changes in relationships are normal after having a baby, but persistent difficulties may benefit from additional support. Parent groups, counseling, or even honest conversations with loved ones can help address these challenges.

Would you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation."""
            
        elif 'exit' in option or 'back' in option:
            return "We've finished the symptom assessment. Is there anything specific from the assessment you'd like to discuss further?"
            
        else:
            return """I'm not sure which symptom area you'd like to check. Could you please select a number (1-5)?

1. 😔 Emotional symptoms (mood, anxiety, etc.)
2. 💭 Mental symptoms (concentration, memory, etc.)
3. 💤 Sleep issues
4. 💪 Physical recovery concerns
5. 👥 Social or relationship changes

Or type 'exit' to return to our conversation."""


    def handle_pregnancy_info(self, option):
        """Handle pregnancy and postpartum depression information requests"""
        log_debug(f"Handling pregnancy info for option: '{option}'")
        
        option = option.strip().lower()
        if option.isdigit():
            option_num = option
            log_debug(f"Numeric option selected: {option_num}")
            
            # Validate if user entered a number outside the valid range
            if int(option_num) < 1 or int(option_num) > 5:
                return """Please select a valid number between 1 and 5:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:"""
        else:
            log_debug("Non-numeric option, returning initial question")
            return """What would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:"""
            
        # Just return a simple response based on the number for now
        responses = {
            '1': "What is Postpartum Depression?\n\nPostpartum depression is a serious mental health condition that can develop after childbirth.",
            '2': "Causes of Postpartum Depression\n\nPostpartum depression can be caused by hormonal changes, lack of sleep, and many other factors.",
            '3': "Symptoms of Postpartum Depression\n\nSymptoms include persistent sadness, anxiety, fatigue, and difficulty bonding with your baby.",
            '4': "Prevention Measures\n\nPrevention includes getting support, rest, and talking openly about your feelings.",
            '5': "Self-care Tips\n\nSelf-care includes getting enough rest, eating well, and asking for help when needed."
        }
        
        return responses.get(option, "I didn't understand that option. Please choose a number from 1-5.")

    def assess_risk_level(self, message):
        """Assess the risk level based on symptoms"""
        if not message:
            return "low", "Thank you for sharing. These feelings are valid and you're not alone."
            
        message = message.lower()
        
        # High risk symptoms - immediate medical attention needed
        high_risk_symptoms = [
            'suicidal', 'kill myself', 'end my life', 'don\'t want to live',
            'harm myself', 'harm my baby', 'hurt my baby', 'hurt myself',
            'severe bleeding', 'hemorrhage', 'can\'t breathe', 'chest pain',
            'seizure', 'convulsion', 'unconscious', 'passed out',
            'fever above 100.4', 'high fever', 'severe headache',
            'vision changes', 'blurry vision', 'spots in vision',
            'severe pain', 'unbearable pain', 'extreme pain',
            'thoughts of death', 'hallucination', 'seeing things', 'hearing voices',
            'can\'t move', 'paralysis', 'stroke', 'blood clot'
        ]
        
        # Medium risk symptoms - medical attention recommended soon
        medium_risk_symptoms = [
            'depression', 'depressed', 'hopeless', 'worthless', 'empty inside',
            'anxiety', 'anxious', 'panic attack', 'constant worry',
            'can\'t sleep', 'insomnia', 'no sleep for days',
            'no appetite', 'not eating', 'weight loss',
            'infection', 'pus', 'foul smell', 'bad odor',
            'incision pain', 'wound not healing', 'stitches opened',
            'breast pain', 'mastitis', 'breast infection',
            'crying all day', 'crying constantly', 'can\'t stop crying',
            'disconnected from baby', 'don\'t feel bonded', 'don\'t care about baby',
            'angry all the time', 'rage', 'uncontrollable anger',
            'paranoid', 'suspicious', 'everyone is against me'
        ]
        
        # Check for high risk symptoms first (most urgent)
        for symptom in high_risk_symptoms:
            if symptom in message:
                return "high", "I'm really concerned about how you're feeling. These symptoms are serious. You're not alone, and help is available. Please contact your healthcare provider immediately or go to the nearest emergency room. Your wellbeing is important, and these symptoms require prompt medical attention."
        
        # Check for medium risk symptoms
        for symptom in medium_risk_symptoms:
            if symptom in message:
                return "medium", "It sounds like you're going through some challenging adjustments. These symptoms are common but should be monitored closely. I recommend discussing them with your healthcare provider at your next appointment or sooner if they worsen. Taking care of your health is an important part of caring for your baby too."
        
        # Default to low risk if no high or medium risk symptoms detected
        return "low", "Thank you for sharing. These feelings are valid and you're not alone. Many new parents experience similar symptoms, and they often improve with time, rest, and support. Continue practicing self-care and reach out to friends, family, or support groups when you need help."

    def identify_symptoms(self, message):
        """Identify symptoms from user message"""
        if not message:
            return ["• General postpartum concerns"]
            
        message = message.lower()
        symptoms = []
        
        # Emotional symptoms
        if any(word in message for word in ["sad", "tear", "cry", "depress", "down", "blue", "unhappy", "upset"]):
            symptoms.append("• Feelings of sadness or tearfulness")
        if any(word in message for word in ["anx", "worry", "nervous", "stress", "tense", "on edge", "restless"]):
            symptoms.append("• Anxiety or excessive worry")
        if any(word in message for word in ["irritable", "angry", "frustrat", "annoy", "short temper", "rage"]):
            symptoms.append("• Irritability or anger")
        if any(word in message for word in ["overwhelm", "too much", "can't cope", "burden", "pressure"]):
            symptoms.append("• Feeling overwhelmed")
        if any(word in message for word in ["mood swing", "up and down", "emotional", "unstable mood"]):
            symptoms.append("• Mood swings")
        if any(word in message for word in ["guilt", "blame", "bad mother", "failure", "not good enough"]):
            symptoms.append("• Feelings of guilt or inadequacy")
        if any(word in message for word in ["disconnect", "detach", "bond", "love", "feel nothing", "numb"]):
            symptoms.append("• Difficulty bonding with baby")
        
        # Mental symptoms
        if any(word in message for word in ["fog", "distract", "forget", "focus", "concentrate", "memory", "think clearly"]):
            symptoms.append("• Mental fog or difficulty concentrating")
        if any(word in message for word in ["decision", "choose", "can't decide", "confused"]):
            symptoms.append("• Difficulty making decisions")
        if any(word in message for word in ["thought", "racing", "mind won't stop", "overthink"]):
            symptoms.append("• Racing thoughts")
        
        # Sleep issues
        if any(word in message for word in ["sleep", "insomnia", "awake", "can't rest", "tired", "exhausted", "fatigue"]):
            symptoms.append("• Sleep disturbances or fatigue")
        
        # Physical symptoms
        if any(word in message for word in ["pain", "discomfort", "hurt", "sore", "ache"]):
            symptoms.append("• Physical pain or discomfort")
        if any(word in message for word in ["bleed", "discharge", "infection", "fever", "incision", "tear", "swelling"]):
            symptoms.append("• Physical recovery complications")
        if any(word in message for word in ["appetite", "eat", "food", "weight", "hungry"]):
            symptoms.append("• Changes in appetite")
        if any(word in message for word in ["headache", "migraine", "head pain"]):
            symptoms.append("• Headaches")
        
        # Severe symptoms
        if any(word in message for word in ["suicidal", "harm", "death", "kill", "end life", "don't want to live"]):
            symptoms.append("• Thoughts of self-harm or suicide")
        if any(word in message for word in ["hallucination", "seeing things", "hearing voices", "delusion"]):
            symptoms.append("• Hallucinations or delusions")
        
        # If no specific symptoms identified
        if len(symptoms) == 0:
            symptoms.append("• General postpartum concerns")
        
        return symptoms

    def identify_causes(self, symptoms):
        """Identify potential causes based on symptoms"""
        causes = []
        
        # Check for emotional symptoms
        if any("sad" in s or "tear" in s or "cry" in s or "depress" in s or "mood swing" in s or "overwhelm" in s or "irritable" in s or "angry" in s for s in symptoms):
            causes.append("• Hormonal changes - Dramatic drops in estrogen and progesterone after childbirth")
            causes.append("• Sleep deprivation - Fragmented sleep affecting mood regulation")
        
        # Check for anxiety symptoms
        if any("anx" in s or "worry" in s or "stress" in s or "tense" in s or "racing thought" in s for s in symptoms):
            causes.append("• Adjustment to new responsibilities and identity as a parent")
            causes.append("• Heightened protective instincts toward the baby")
        
        # Check for bonding issues
        if any("disconnect" in s or "bond" in s or "love" in s or "feel nothing" in s or "numb" in s for s in symptoms):
            causes.append("• Hormonal factors affecting emotional attachment")
            causes.append("• Exhaustion interfering with emotional capacity")
            causes.append("• Possible postpartum depression or anxiety")
        
        # Check for cognitive symptoms
        if any("fog" in s or "distract" in s or "forget" in s or "focus" in s or "concentrate" in s or "memory" in s or "decision" in s for s in symptoms):
            causes.append("• Sleep deprivation affecting cognitive function")
            causes.append("• Stress hormones impacting memory and concentration")
            causes.append("• Information overload from new parenting responsibilities")
        
        # Check for sleep issues
        if any("sleep" in s or "insomnia" in s or "awake" in s or "tired" in s or "exhausted" in s or "fatigue" in s for s in symptoms):
            causes.append("• Infant feeding schedule interrupting sleep cycles")
            causes.append("• Heightened alertness to baby's needs")
            causes.append("• Hormonal influences on sleep quality")
        
        # Check for physical symptoms
        if any("pain" in s or "discomfort" in s or "bleed" in s or "discharge" in s or "infection" in s or "fever" in s or "headache" in s for s in symptoms):
            causes.append("• Physical recovery from childbirth")
            causes.append("• Possible complications requiring medical attention")
            causes.append("• Muscle tension from new physical demands (holding baby, breastfeeding positions)")
        
        # Check for severe symptoms
        if any("suicidal" in s or "harm" in s or "hallucination" in s or "seeing things" in s or "hearing voices" in s for s in symptoms):
            causes.append("• Possible postpartum depression, anxiety, or psychosis requiring immediate medical attention")
            causes.append("• Severe hormonal imbalances affecting brain function")
            causes.append("• Extreme sleep deprivation affecting mental state")
        
        # If no specific causes identified
        if len(causes) == 0:
            causes.append("• Normal postpartum adjustment period")
            causes.append("• Hormonal changes following childbirth")
            causes.append("• Sleep disruption and physical recovery demands")
        
        return causes

    def identify_treatment(self, symptoms, risk_level):
        """Identify treatment recommendations based on symptoms and risk level"""
        treatment = []
        
        # High risk recommendations
        if risk_level == "high":
            treatment.append("• URGENT: Contact your healthcare provider immediately or go to the nearest emergency room")
            treatment.append("• Do not remain alone if experiencing thoughts of self-harm")
            treatment.append("• Call a crisis helpline: National Maternal Mental Health Hotline (1-833-943-5746)")
        # Medium risk recommendations
        elif risk_level == "medium":
            treatment.append("• Schedule an appointment with your healthcare provider within the next few days")
            treatment.append("• Discuss medication options with your doctor if symptoms persist")
            treatment.append("• Consider therapy or counseling specialized in postpartum adjustment")
            treatment.append("• Join a postpartum support group (online or in-person)")
        # Low risk recommendations
        else:
            treatment.append("• Monitor symptoms and discuss at your next routine check-up")
            treatment.append("• Reach out to family and friends for additional support")
            treatment.append("• Consider joining a new parents' group for community support")
        
        # Specific treatment recommendations based on symptoms
        if any("sad" in s or "tear" in s or "cry" in s or "depress" in s or "mood" in s for s in symptoms):
            treatment.append("• Talk therapy approaches like CBT (Cognitive Behavioral Therapy) have shown effectiveness for postpartum mood issues")
        
        if any("anx" in s or "worry" in s or "stress" in s or "tense" in s for s in symptoms):
            treatment.append("• Mindfulness and breathing exercises can help manage anxiety symptoms")
        
        if any("sleep" in s or "insomnia" in s or "awake" in s or "tired" in s or "exhausted" in s or "fatigue" in s for s in symptoms):
            treatment.append("• Discuss sleep strategies with your healthcare provider")
            treatment.append("• Consider sleep shifts with a partner or support person if possible")
        
        if any("pain" in s or "discomfort" in s or "bleed" in s or "discharge" in s or "infection" in s or "fever" in s for s in symptoms):
            treatment.append("• Follow up with your healthcare provider about physical symptoms")
            treatment.append("• Take prescribed medications as directed for pain or infection")
        
        return treatment

    def identify_self_care(self, symptoms):
        """Identify self-care tips based on symptoms"""
        self_care = []
        
        # General self-care tips for all postpartum individuals
        self_care.append("• Prioritize sleep when possible - rest when your baby rests")
        self_care.append("• Accept help from others with household tasks and baby care")
        self_care.append("• Stay hydrated and eat nutritious, easy-to-prepare foods")
        
        # Specific self-care tips based on symptoms
        if any("sad" in s or "tear" in s or "cry" in s or "depress" in s or "mood" in s or "overwhelm" in s for s in symptoms):
            self_care.append("• Spend brief periods outdoors daily - natural light can help mood")
            self_care.append("• Express feelings through journaling or talking with a trusted person")
            self_care.append("• Remember that having difficult feelings doesn't make you a bad parent")
        
        if any("anx" in s or "worry" in s or "stress" in s or "tense" in s for s in symptoms):
            self_care.append("• Practice 5-minute breathing exercises several times daily")
            self_care.append("• Limit exposure to stressful media and information overload")
            self_care.append("• Focus on one moment at a time rather than worrying about the future")
        
        if any("fog" in s or "distract" in s or "forget" in s or "focus" in s or "concentrate" in s or "memory" in s for s in symptoms):
            self_care.append("• Use reminder apps or notes for important information")
            self_care.append("• Break tasks into smaller, manageable steps")
            self_care.append("• Be patient with yourself - 'mom brain' is a normal experience")
        
        if any("sleep" in s or "insomnia" in s or "awake" in s or "tired" in s or "exhausted" in s or "fatigue" in s for s in symptoms):
            self_care.append("• Create a calming bedtime routine for yourself")
            self_care.append("• Limit screen time before bed to improve sleep quality")
            self_care.append("• Consider a white noise machine to help maintain sleep")
        
        if any("pain" in s or "discomfort" in s or "physical" in s for s in symptoms):
            self_care.append("• Apply warm compresses for muscle soreness (if approved by your provider)")
            self_care.append("• Practice gentle stretching for tension relief")
            self_care.append("• Use proper body mechanics when lifting and carrying your baby")
        
        return self_care

    def generate_symptom_report(self, message):
        """Generate a structured symptom report"""
        # Identify reported symptoms
        symptoms = self.identify_symptoms(message)
        
        # Assess risk level
        risk_level, risk_response = self.assess_risk_level(message)
        log_debug(f"Risk assessment: {risk_level} risk")
        
        # Get causes based on identified symptoms
        causes = self.identify_causes(symptoms)
        
        # Get treatment recommendations based on symptoms and risk level
        treatment = self.identify_treatment(symptoms, risk_level)
        
        # Get self-care tips based on symptoms
        self_care = self.identify_self_care(symptoms)
        
        # Format the report
        report = f"""
📋 POSTPARTUM ASSESSMENT REPORT 📋

🔍 REPORTED SYMPTOMS:
{chr(10).join(symptoms)}

⚠️ RISK LEVEL: {risk_level.upper()}
{risk_response}

🔎 POSSIBLE CAUSES:
{chr(10).join(causes)}

💊 RECOMMENDED ACTIONS:
{chr(10).join(treatment)}

💗 SELF-CARE TIPS:
{chr(10).join(self_care)}

You're taking an important step by seeking support. Remember that healing takes time, and you're doing a great job navigating this challenging period.

DISCLAIMER: This chatbot provides informational support only and is not a substitute for professional medical advice. Always consult with your healthcare provider for medical concerns.

Type "new" to start a new conversation.
"""
        return report

    def get_response_for_state(self, new_state, message=None):
        """Generate appropriate response based on the state"""
        log_debug(f"Getting response for state: {new_state}")
        
        if new_state == ConversationState.GREETING:
            return "Hi, I'm MOM, your postpartum support companion"
        
        elif new_state == ConversationState.AWAITING_AGE:
            return "To give you the best support, may I ask your age?"
        
        elif new_state == ConversationState.AGE_VERIFICATION_FAILED:
            return "I understand you're looking for help. Because you're under 18, it's a good idea to speak with a parent or healthcare provider. Could you please tell me your age?"
        
        elif new_state == ConversationState.AWAITING_BIRTH_TIMING:
            return "How many weeks or days have passed since you gave birth? (If you haven't given birth yet, please let me know)"
        
        elif new_state == ConversationState.IN_PREGNANCY_INFO:
            return """What would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:"""

        elif new_state == ConversationState.EMOTIONAL_QUESTION:
            # Check if user entered an invalid number
            if message and message.isdigit() and (int(message) < 1 or int(message) > 5):
                return "Please select a number between 1 and 5, or describe how you're feeling emotionally:\n\n1. 😊 Generally positive\n\n2. 😢 Sad or tearful\n\n3. 😰 Anxious or worried\n\n4. 😡 Irritable or angry\n\n5. 😔 Overwhelmed\n\nPlease select a number or describe how you're feeling."
                
            return "How have you been feeling emotionally since the birth?\n\n1. 😊 Generally positive\n\n2. 😢 Sad or tearful\n\n3. 😰 Anxious or worried\n\n4. 😡 Irritable or angry\n\n5. 😔 Overwhelmed\n\nPlease select a number or describe how you're feeling."

        elif new_state == ConversationState.MENTAL_QUESTION:
            # Provide personalized response based on emotional state
            emotional_response = ""
            if message:
                message = message.lower()
                
                # Check if user entered an invalid number
                if message.isdigit() and (int(message) < 1 or int(message) > 5):
                    return "Please select a number between 1 and 5, or describe your mental state:\n\n1. 🧠 Mentally exhausted\n\n2. 🌫️ Foggy or distracted\n\n3. 🧘 Clear and okay\n\n4. 😫 Stressed or overwhelmed\n\n5. 😌 Calm and focused\n\nPlease select a number or describe your mental state."
                    
                if message == "2" or any(word in message for word in ["sad", "tear", "cry", "down"]):
                    emotional_response = "I understand you're feeling sad or tearful, which is common in the postpartum period. These feelings can be part of 'baby blues' or could indicate postpartum depression. Remember that it's okay to ask for help, and these feelings don't make you a bad parent. Getting support from loved ones, joining a parent group, or talking to your healthcare provider can make a big difference. "
                elif message == "3" or any(word in message for word in ["anx", "worry", "nervous", "stress", "tense"]):
                    emotional_response = "Feeling anxious or worried is a normal response to the big changes that come with parenthood. Try simple breathing exercises when anxious moments arise, and consider sharing your specific worries with a healthcare provider who can offer tailored support. "
                elif message == "4" or any(word in message for word in ["irritable", "angry", "frustrat", "annoy"]):
                    emotional_response = "Feeling irritable or angry is common with sleep deprivation and the demands of caring for a newborn. When these feelings arise, take a brief moment for yourself if possible, practice deep breathing, and remember to be patient with yourself as you adapt to this new role. "
                elif message == "5" or any(word in message for word in ["overwhelm", "too much", "can't cope", "burden"]):
                    emotional_response = "It's completely understandable to feel overwhelmed with a new baby. This is a significant life change that comes with many new responsibilities. Breaking tasks into smaller steps, accepting help when offered, and focusing on just one moment at a time can make things feel more manageable. "
                elif message == "1" or any(word in message for word in ["positive", "good", "okay", "fine", "happy"]):
                    emotional_response = "I'm glad to hear you're feeling generally positive! It's important to continue nurturing your emotional wellbeing as you navigate this journey. "
            
            return emotional_response + "How have you been feeling mentally since the birth?\n\n1. 🧠 Mentally exhausted\n\n2. 🌫️ Foggy or distracted\n\n3. 🧘 Clear and okay\n\n4. 😫 Stressed or overwhelmed\n\n5. 😌 Calm and focused\n\nPlease select a number or describe your mental state."

        elif new_state == ConversationState.SLEEP_QUESTION:
            # Provide personalized response based on mental state
            mental_response = ""
            if message:
                message = message.lower()
                
                # Check if user entered an invalid number
                if message.isdigit() and (int(message) < 1 or int(message) > 5):
                    return "Please select a number between 1 and 5, or describe your sleep patterns:\n\n1. 😴 Very poorly\n\n2. 😪 Interrupted frequently\n\n3. 😌 Somewhat okay\n\n4. 🛌 Getting enough rest\n\n5. 💤 Surprisingly well\n\nPlease select a number or describe your sleep patterns."
                    
                if message == "1" or any(word in message for word in ["exhaust", "drain", "tired"]):
                    mental_response = "Mental exhaustion is very common for new parents. Your brain is working overtime adjusting to new responsibilities and often with less sleep. Try to take short mental breaks when possible, even just 5 minutes of mindfulness can help. Consider asking someone you trust to watch your baby so you can have a brief mental rest. "
                elif message == "2" or any(word in message for word in ["fog", "distract", "forget", "focus", "concentrate"]):
                    mental_response = "Many parents experience 'mom brain' or 'dad brain' - the mental fog that comes with caring for a newborn. This is normal and temporary. Writing important things down, using reminder apps, and giving yourself grace when you forget things can help during this time. "
                elif message == "3" or any(word in message for word in ["clear", "okay", "fine", "alright"]):
                    mental_response = "It's great that you're feeling mentally clear. Continue to protect your mental well-being by taking breaks when needed and staying connected with supportive people in your life. "
                elif message == "4" or any(word in message for word in ["stress", "overwhelm", "too much", "burden"]):
                    mental_response = "Feeling mentally stressed or overwhelmed is common with all the decisions and adjustments of new parenthood. Remember that perfectionism isn't required - doing your reasonable best is enough. Consider talking with a healthcare provider if the stress feels unmanageable. "
                elif message == "5" or any(word in message for word in ["calm", "focus", "peace", "relax"]):
                    mental_response = "I'm glad you're feeling calm and focused mentally. This is a wonderful foundation that will help you navigate the challenges of the postpartum period. "
                
            return mental_response + "How have you been sleeping since the birth?\n\n1. 😴 Very poorly\n\n2. 😪 Interrupted frequently\n\n3. 😌 Somewhat okay\n\n4. 🛌 Getting enough rest\n\n5. 💤 Surprisingly well\n\nPlease select a number or describe your sleep patterns."

        elif new_state == ConversationState.PHYSICAL_QUESTION:
            # Provide personalized response based on sleep patterns
            sleep_response = ""
            if message:
                message = message.lower()
                
                # Check if user entered an invalid number
                if message.isdigit() and (int(message) < 1 or int(message) > 5):
                    return "Please select a number between 1 and 5, or describe your physical recovery:\n\n1. 🤕 In pain or discomfort\n\n2. 😴 Tired or exhausted\n\n3. 💪 Recovering well\n\n4. 🙁 Having complications\n\n5. 😌 Back to normal\n\nPlease select a number or describe your physical recovery."
                    
                if message == "1" or any(word in message for word in ["poor", "bad", "terrible", "awful", "no sleep"]):
                    sleep_response = "I'm sorry to hear you're sleeping very poorly. Severe sleep deprivation can affect your mood and ability to function. Try to sleep when your baby sleeps, even during the day, and consider asking a partner, family member, or friend to take a night feeding so you can get a longer stretch of sleep. If sleep problems persist, please mention it to your healthcare provider as it can affect your recovery. "
                elif message == "2" or any(word in message for word in ["interrupt", "broken", "wake up", "disturb"]):
                    sleep_response = "Interrupted sleep is challenging but normal with a newborn. Try to create a restful bedroom environment, limit screen time before bed, and develop a consistent bedtime routine when possible. Taking shifts with a partner or support person for night feedings can help each of you get some uninterrupted rest. "
                elif message == "3" or any(word in message for word in ["okay", "moderate", "average", "alright"]):
                    sleep_response = "Getting somewhat okay sleep is actually an accomplishment with a new baby! Continue to prioritize sleep when you can, and remember that your sleep needs may be higher during recovery. "
                elif message == "4" or any(word in message for word in ["enough", "sufficient", "decent", "good"]):
                    sleep_response = "It's wonderful that you're getting enough rest. Quality sleep is so important for your physical and emotional recovery, as well as for having the energy to care for your baby. "
                elif message == "5" or any(word in message for word in ["great", "well", "excellent", "amazing"]):
                    sleep_response = "That's fantastic that you're sleeping surprisingly well! This will significantly help your postpartum recovery and your ability to cope with new challenges. "
                
            return sleep_response + "How have you been feeling physically since the birth?\n\n1. 🤕 In pain or discomfort\n\n2. 😴 Tired or exhausted\n\n3. 💪 Recovering well\n\n4. 🙁 Having complications\n\n5. 😌 Back to normal\n\nPlease select a number or describe your physical recovery."

        elif new_state == ConversationState.SYMPTOMS_QUESTION:
            # Provide personalized response based on physical condition
            physical_response = ""
            if message:
                message = message.lower()
                
                # Check if user entered an invalid number
                if message.isdigit() and (int(message) < 1 or int(message) > 5):
                    return "Please select a number between 1 and 5, or describe your specific symptoms or concerns in detail so I can provide better support."
                    
                if message == "1" or any(word in message for word in ["pain", "discomfort", "hurt", "sore", "ache"]):
                    physical_response = "I'm sorry you're experiencing pain or discomfort. Some discomfort is normal during recovery, but persistent or severe pain should be discussed with your healthcare provider. Make sure you're not overexerting yourself, and consider using approved pain management techniques recommended by your doctor. Warm baths (if approved by your provider), gentle stretching, and proper rest can sometimes help with minor discomforts. "
                elif message == "2" or any(word in message for word in ["tired", "exhausted", "fatigue", "no energy"]):
                    physical_response = "Physical exhaustion is very common after giving birth and during early parenthood. Your body is recovering from pregnancy and birth while adapting to new demands. Try to prioritize nutrition with easy, healthy foods, stay hydrated, and rest whenever possible. Consider accepting help with household tasks to conserve your energy for recovery and baby care. "
                elif message == "3" or any(word in message for word in ["recover", "healing", "getting better", "improving"]):
                    physical_response = "It's good to hear you're recovering well physically. Continue to be patient with your body - complete recovery can take time. Remember to still follow your provider's guidelines about physical activity restrictions and gradually increase your activity level. "
                elif message == "4" or any(word in message for word in ["complication", "problem", "issue", "concern", "worry"]):
                    physical_response = "I'm sorry to hear you're experiencing complications. Please make sure your healthcare provider knows about these issues, as they need proper medical attention. Don't hesitate to call your provider if you notice worsening symptoms or have concerns about your recovery. "
                elif message == "5" or any(word in message for word in ["normal", "great", "excellent", "good", "fine"]):
                    physical_response = "It's wonderful that you're feeling back to normal physically! This is a significant achievement in your postpartum journey. Continue to maintain your physical well-being with appropriate nutrition, hydration, and gradually increasing activity as approved by your provider. "
                
            return physical_response + "Could you please tell me what specific symptoms or concerns you're experiencing? This will help me provide better support for your specific needs."

        elif new_state == ConversationState.USER_LED:
            # Generate a structured symptom report
            if message:
                # Assess risk level
                risk_level, risk_response = self.assess_risk_level(message)
                log_debug(f"Risk assessment: {risk_level} risk")
                
                # Generate structured report using the internal method
                return self.generate_symptom_report(message)
            else:
                return "You're taking an important step by seeking support. I'm here to help with your postpartum journey.\n\nDISCLAIMER: This chatbot provides informational support only and is not a substitute for professional medical advice.\n\nWhat specific aspect of your experience would you like to discuss? Type 'new' to start a new conversation."

        elif new_state == ConversationState.SYMPTOMS_QUESTIONNAIRE:
            return """I can help you assess common postpartum symptoms. Which area would you like to check?

1. 😔 Emotional symptoms (mood, anxiety, etc.)
2. 💭 Mental symptoms (concentration, memory, etc.)
3. 💤 Sleep issues
4. 💪 Physical recovery concerns
5. 👥 Social or relationship changes"""
        
        else:
            # Default response for unknown states
            return "I'm here to support you. How can I help you today?"

def main():
    print("===== CHATBOT STARTED =====", file=sys.stderr)
    try:
        parser = argparse.ArgumentParser(description="Chatbot command-line tool")
        parser.add_argument('--user', required=True, help="User ID for the session")
        parser.add_argument('--message', default="", help="Direct message from the user")
        parser.add_argument('--message-file', help="File containing the message from the user")
        parser.add_argument('--first-run', action='store_true', help="Flag for initial greeting")
        args = parser.parse_args()
        
        log_debug(f"Command-line args: {args}")
        
        # Initialize chatbot
        log_debug("Initializing chatbot")
        chatbot = GeminiChatbot()
        if not chatbot.initialized:
            log_debug("Chatbot failed to initialize")
            print("Failed to initialize chatbot. Exiting.", file=sys.stderr)
            print("I'm sorry, I'm having trouble connecting. Please try again.")
            return
            
        log_debug("Chatbot initialized successfully")
        
        try:
            # Load state for the user
            chatbot.load_state(args.user)
            
            # Get message either from args or file
            message = args.message
            if args.message_file and os.path.exists(args.message_file):
                try:
                    with open(args.message_file, 'r', encoding='utf-8') as f:
                        message = f.read().strip()
                    log_debug(f"Read message from file: '{message}'")
                except Exception as e:
                    log_debug(f"Error reading message file: {e}")
                    log_debug(traceback.format_exc())
                    # Continue with empty message
            
            # Generate response
            log_debug(f"Generating response for user {args.user} with message: '{message}'")
            response = chatbot.get_response(args.user, message)
                
            # Print response directly to stdout
            log_debug(f"Response generated: '{response}'")
            print(response)
            
            # Save the final state
            chatbot.save_state(args.user)
        
        except Exception as e:
            log_debug(f"Critical error in main function: {e}")
            log_debug(traceback.format_exc())
            print("I'm sorry, I couldn't process your message. Please try again.")
            return
            
    except Exception as e:
        log_debug(f"Unexpected error: {e}")
        log_debug(traceback.format_exc())
        print("An unexpected error occurred. Please try again.")

if __name__ == "__main__":
    main()
    log_debug("===== CHATBOT FINISHED =====")