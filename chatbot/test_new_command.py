"""
Test script for the "new" command functionality.
"""
from chatbot import GeminiChatbot, ConversationState

def main():
    print("===== TESTING NEW COMMAND =====")
    
    # Create chatbot instance
    chatbot = GeminiChatbot()
    
    # Test user ID
    test_user = "test_new_command"
    
    # Simulate a conversation flow
    print("\nStep 1: Initial greeting")
    response = chatbot.get_response(test_user, "")
    print(f"Response: {response}")
    print(f"State: {chatbot.user_states.get(test_user)}")
    
    # Manually set state to simulate progression
    print("\nStep 2: Set state to EMOTIONAL_QUESTION")
    chatbot.user_states[test_user] = ConversationState.EMOTIONAL_QUESTION
    chatbot.save_state(test_user)
    print(f"State: {chatbot.user_states.get(test_user)}")
    
    # Get response for emotional question
    response = chatbot.get_response_for_state(ConversationState.EMOTIONAL_QUESTION)
    print(f"Response: {response[:50]}...")  # Show just the beginning
    
    print("\nStep 3: Send 'new' command")
    response = chatbot.get_response(test_user, "new")
    print(f"Response: {response}")
    print(f"State: {chatbot.user_states.get(test_user)}")
    
    print("\nStep 4: Verify state was reset to GREETING")
    print(f"Current state: {chatbot.user_states.get(test_user)}")
    
    print("\n===== TEST COMPLETE =====")

if __name__ == "__main__":
    main() 