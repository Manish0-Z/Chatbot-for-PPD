// Chatbot client-side implementation
document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.querySelector('#chat-container, .chat-container') || document.querySelector('#chat-messages');
    const messageInput = document.getElementById('message-input');
    const chatForm = document.getElementById('chat-form');
    const sendButton = document.getElementById('send-button');
    
    let sessionId = localStorage.getItem('chatSessionId') || null;
    let isProcessing = false;
    
    // Simulated conversation state
    let conversationState = 'GREETING'; // GREETING, AWAITING_AGE, AGE_VERIFICATION_FAILED, AWAITING_BIRTH_TIMING, etc.
    
    // Make conversation state available globally for debugging
    window.conversationState = conversationState;
    
    // Make processUserMessage and other functions global for debugging
    window.debugChatbot = {
        processUserMessage: null, // Will be set later
        setSymptomCheck: function() {
            conversationState = 'SYMPTOMS_QUESTIONNAIRE';
            window.conversationState = conversationState;
            console.log("✅ Manually set state to SYMPTOMS_QUESTIONNAIRE");
            addMessage("I can help you assess common postpartum symptoms. Which area would you like to check?\n\n1. 😔 Emotional symptoms (mood, anxiety, etc.)\n\n2. 💭 Mental symptoms (concentration, memory, etc.)\n\n3. 💤 Sleep issues\n\n4. 💪 Physical recovery concerns\n\n5. 👥 Social or relationship changes", false);
        },
        testSymptomResponse: function(number) {
            if (number < 1 || number > 5) {
                console.error("❌ Invalid symptom number. Must be 1-5.");
                return;
            }
            
            console.log("🧪 Testing symptom response for option:", number);
            
            // Set state and process the message
            conversationState = 'SYMPTOMS_QUESTIONNAIRE';
            window.conversationState = conversationState;
            
            // Process the user message with the number
            if (this.processUserMessage) {
                this.processUserMessage(number.toString());
            } else {
                console.error("❌ processUserMessage function not available");
            }
        }
    };
    
    // Function to add a message to the chat
    function addMessage(content, isUser = false, isLoading = false) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message' : 'bot-message';
        messageDiv.classList.add('message'); // Always add the message class
        if (isLoading) messageDiv.classList.add('loading');
        
        // Create avatar for bot message
        if (!isUser) {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            
            // Add heart icon - always static
            const heartIcon = document.createElement('i');
            heartIcon.className = 'fas fa-heart';
            
            avatarDiv.appendChild(heartIcon);
            messageDiv.appendChild(avatarDiv);
        }
        
        // Create message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isLoading) {
            // Create a separate loading indicator div
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            contentDiv.appendChild(loadingDiv);
        } else {
            // Handle multi-line content with proper formatting
            if (content.includes('\n')) {
                content.split('\n').forEach((line, index, array) => {
                    if (line.trim()) {
                        const paragraph = document.createElement('p');
                        paragraph.textContent = line;
                        contentDiv.appendChild(paragraph);
                    }
                    
                    // Add a line break if not the last line and not empty
                    if (index < array.length - 1 && line.trim()) {
                        contentDiv.appendChild(document.createElement('br'));
                    }
                });
            } else {
                contentDiv.textContent = content;
            }
        }
        
        messageDiv.appendChild(contentDiv);
        
        // For user messages, add avatar at the end
        if (isUser) {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            const avatarText = document.createElement('i');
            avatarText.className = 'fas fa-user';
            avatarDiv.appendChild(avatarText);
            messageDiv.appendChild(avatarDiv);
        }
        
        // Append the message to the chat container
        const footerSpace = document.querySelector('.footer-space');
        if (footerSpace) {
            chatContainer.insertBefore(messageDiv, footerSpace);
        } else {
            chatContainer.appendChild(messageDiv);
        }
        
        // Scroll to bottom immediately
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageDiv;
    }
    
    // Initialize chat
    function initializeChat() {
        // Generate a session ID client-side
        if (!sessionId) {
            sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chatSessionId', sessionId);
        }
        
        // Display greeting only
        addMessage("Hi, I'm MOM, your postpartum support companion", false);
        
        // Start in GREETING state - wait for user to respond to greeting
        conversationState = 'GREETING';
    }
    
    // Process user message
    async function processUserMessage(userMessage) {
        console.log("🔄 processUserMessage called with:", userMessage);
        
        // Make sure the input is valid
        if (!userMessage && conversationState !== 'POSTPARTUM_EMOTIONAL_STATE') {
            console.log("⚠️ Empty message, ignoring");
            return;
        }
        
        if (isProcessing) {
            console.log("⚠️ Already processing a message, ignoring");
            return;
        }
        
        // Ensure userMessage is a string and properly trimmed
        userMessage = String(userMessage || "").trim();
        
        if (userMessage.length === 0 && conversationState !== 'POSTPARTUM_EMOTIONAL_STATE') {
            console.log("⚠️ Empty trimmed message, ignoring");
            return;
        }
        
        isProcessing = true;
        console.log("✅ Processing message in state:", conversationState);
        
        // Extra console logs for debugging
        console.log("💬 Processing user message:", userMessage);
        console.log("📊 Message type:", typeof userMessage);
        console.log("📏 Message length:", userMessage.length);
        
        // Input field is already cleared in handleUserMessage()
        // Don't add user message to chat again as it's already done in handleUserMessage()
        
        // Show typing indicator
        const loadingMessage = addMessage('', false, true);
        
        // Short delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Process based on current state
        let response = '';
        
        console.log("📊 Processing message in state:", conversationState);
        
        // Check for symptom check keywords in any state
        if (/symptoms|symptom|check symptoms|assessment/i.test(userMessage) && conversationState !== 'SYMPTOMS_QUESTIONNAIRE') {
            conversationState = 'SYMPTOMS_QUESTIONNAIRE';
            window.conversationState = conversationState;
            console.log("🔄 Switching to SYMPTOMS_QUESTIONNAIRE state");
        }
        
        switch (conversationState) {
            case 'GREETING':
                // Check if the user tried to provide their age directly in the greeting
                if (/^\d+$/.test(userMessage)) {
                    // They entered an age number directly - process it as if in AWAITING_AGE state
                    const age = parseInt(userMessage);
                    if (age < 18) {
                        conversationState = 'AGE_VERIFICATION_FAILED';
                        window.conversationState = conversationState; // Update global state
                        response = "I understand you're looking for help. Because you're under 18, it's a good idea to speak with a parent or healthcare provider. Could you please tell me your age?";
                    } else {
                        conversationState = 'AWAITING_BIRTH_TIMING';
                        window.conversationState = conversationState; // Update global state
                        response = "How many weeks or months have passed since birth? (If you haven't given birth yet, please let me know)";
                    }
                } else {
                    // Standard greeting response - ask for age
                    conversationState = 'AWAITING_AGE';
                    window.conversationState = conversationState; // Update global state
                    response = "To give you the best support, may I ask your age?";
                }
                break;
                
            case 'AWAITING_AGE':
                try {
                    const age = parseInt(userMessage);
                    if (!isNaN(age)) {
                        if (age < 18) {
                            conversationState = 'AGE_VERIFICATION_FAILED';
                            response = "I understand you're looking for help. Because you're under 18, it's a good idea to speak with a parent or healthcare provider. Could you please tell me your age?";
                        } else {
                            conversationState = 'AWAITING_BIRTH_TIMING';
                            response = "How many weeks or months have passed since birth? (If you haven't given birth yet, please let me know)";
                        }
                    } else {
                        response = "Could you please tell me your age as a number?";
                    }
                } catch (e) {
                    response = "Could you please tell me your age as a number?";
                }
                break;
                
            case 'AGE_VERIFICATION_FAILED':
                try {
                    const age = parseInt(userMessage);
                    if (!isNaN(age)) {
                        if (age < 18) {
                            response = "I understand you're looking for help. Because you're under 18, it's a good idea to speak with a parent or healthcare provider. Could you please tell me your age?";
                        } else {
                            conversationState = 'AWAITING_BIRTH_TIMING';
                            response = "How many weeks or months have passed since birth? (If you haven't given birth yet, please let me know)";
                        }
                    } else {
                        response = "Could you please tell me your age as a number?";
                    }
                } catch (e) {
                    response = "Could you please tell me your age as a number?";
                }
                break;
                
            case 'AWAITING_BIRTH_TIMING':
                if (/not yet|haven't|no|still pregnant|expecting/i.test(userMessage)) {
                    conversationState = 'IN_PREGNANCY_INFO';
                    window.conversationState = conversationState;
                    response = `What would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:`;
                } else if (/\d+\s*(week|month|day|hr|hour|min|year|yr)/i.test(userMessage) || /^[0-9]+$/.test(userMessage)) {
                    // User has given birth and provided a valid time period
                    // Go to emotional state first
                    conversationState = 'EMOTIONAL_QUESTION';
                    window.conversationState = conversationState;
                    console.log("Going to EMOTIONAL_QUESTION state");
                    response = "How have you been feeling emotionally since the birth?\n\n1. 😊 Generally positive\n\n2. 😢 Sad or tearful\n\n3. 😰 Anxious or worried\n\n4. 😡 Irritable or angry\n\n5. 😔 Overwhelmed\n\nPlease select a number or describe how you're feeling.";
                } else {
                    // Invalid input - stay in the same state and ask again
                    response = "I couldn't understand your response about birth timing. Please let me know how many weeks or months have passed since birth, or tell me if you haven't given birth yet.";
                }
                break;
                
            case 'EMOTIONAL_QUESTION':
                // Process response about emotional state
                console.log("Processing emotional state input:", userMessage);
                
                // Store emotional state for potential future use
                localStorage.setItem('userEmotionalState', userMessage);
                
                // Validate if user entered a number outside the valid range
                if (/^[0-9]+$/.test(userMessage) && (parseInt(userMessage) < 1 || parseInt(userMessage) > 5)) {
                    response = "Please select a number between 1 and 5, or describe how you're feeling emotionally:\n\n1. 😊 Generally positive\n\n2. 😢 Sad or tearful\n\n3. 😰 Anxious or worried\n\n4. 😡 Irritable or angry\n\n5. 😔 Overwhelmed";
                    break;
                }
                
                // Provide appropriate response based on emotional state selection
                let emotionalResponse = "";
                
                if (userMessage === "2" || /sad|tear|cry|down/i.test(userMessage)) {
                    emotionalResponse = "I understand you're feeling sad or tearful, which is common in the postpartum period. These feelings can be part of 'baby blues' or could indicate postpartum depression. Remember that it's okay to ask for help, and these feelings don't make you a bad parent. Getting support from loved ones, joining a parent group, or talking to your healthcare provider can make a big difference. ";
                } else if (userMessage === "3" || /anx|worry|nervous|stress|tense/i.test(userMessage)) {
                    emotionalResponse = "Feeling anxious or worried is a normal response to the big changes that come with parenthood. Try simple breathing exercises when anxious moments arise, and consider sharing your specific worries with a healthcare provider who can offer tailored support. ";
                } else if (userMessage === "4" || /irritable|angry|frustrat|annoy/i.test(userMessage)) {
                    emotionalResponse = "Feeling irritable or angry is common with sleep deprivation and the demands of caring for a newborn. When these feelings arise, take a brief moment for yourself if possible, practice deep breathing, and remember to be patient with yourself as you adapt to this new role. ";
                } else if (userMessage === "5" || /overwhelm|too much|can't cope|burden/i.test(userMessage)) {
                    emotionalResponse = "It's completely understandable to feel overwhelmed with a new baby. This is a significant life change that comes with many new responsibilities. Breaking tasks into smaller steps, accepting help when offered, and focusing on just one moment at a time can make things feel more manageable. ";
                } else if (userMessage === "1" || /positive|good|okay|fine|happy/i.test(userMessage)) {
                    emotionalResponse = "I'm glad to hear you're feeling generally positive! It's important to continue nurturing your emotional wellbeing as you navigate this journey. ";
                } else {
                    emotionalResponse = "Thank you for sharing how you're feeling emotionally. Your emotional health is an important part of your postpartum journey. ";
                }
                
                // Transition to MENTAL_QUESTION state
                conversationState = 'MENTAL_QUESTION';
                window.conversationState = conversationState;
                
                response = emotionalResponse + "Now, how have you been feeling mentally since the birth?\n\n1. 🧠 Mentally exhausted\n\n2. 🌫️ Foggy or distracted\n\n3. 🧘 Clear and okay\n\n4. 😫 Stressed or overwhelmed\n\n5. 😌 Calm and focused\n\nPlease select a number or describe your mental state.";
                break;
                
            case 'MENTAL_QUESTION':
                // Process response about mental state
                console.log("Processing mental state input:", userMessage);
                
                // Store mental state for potential future use
                localStorage.setItem('userMentalState', userMessage);
                
                // Validate if user entered a number outside the valid range
                if (/^[0-9]+$/.test(userMessage) && (parseInt(userMessage) < 1 || parseInt(userMessage) > 5)) {
                    response = "Please select a number between 1 and 5, or describe your mental state:\n\n1. 🧠 Mentally exhausted\n\n2. 🌫️ Foggy or distracted\n\n3. 🧘 Clear and okay\n\n4. 😫 Stressed or overwhelmed\n\n5. 😌 Calm and focused";
                    break;
                }
                
                // Provide appropriate response based on mental state selection
                let mentalResponse = "";
                
                if (userMessage === "1" || /exhaust|drain|tired/i.test(userMessage)) {
                    mentalResponse = "Mental exhaustion is very common for new parents. Your brain is working overtime adjusting to new responsibilities and often with less sleep. Try to take short mental breaks when possible, even just 5 minutes of mindfulness can help. Consider asking someone you trust to watch your baby so you can have a brief mental rest. ";
                } else if (userMessage === "2" || /fog|distract|forget|focus|concentrate/i.test(userMessage)) {
                    mentalResponse = "Many parents experience 'mom brain' or 'dad brain' - the mental fog that comes with caring for a newborn. This is normal and temporary. Writing important things down, using reminder apps, and giving yourself grace when you forget things can help during this time. ";
                } else if (userMessage === "3" || /clear|okay|fine|alright/i.test(userMessage)) {
                    mentalResponse = "It's great that you're feeling mentally clear. Continue to protect your mental well-being by taking breaks when needed and staying connected with supportive people in your life. ";
                } else if (userMessage === "4" || /stress|overwhelm|too much|burden/i.test(userMessage)) {
                    mentalResponse = "Feeling mentally stressed or overwhelmed is common with all the decisions and adjustments of new parenthood. Remember that perfectionism isn't required - doing your reasonable best is enough. Consider talking with a healthcare provider if the stress feels unmanageable. ";
                } else if (userMessage === "5" || /calm|focus|peace|relax/i.test(userMessage)) {
                    mentalResponse = "I'm glad you're feeling calm and focused mentally. This is a wonderful foundation that will help you navigate the challenges of the postpartum period. ";
                } else {
                    mentalResponse = "Thank you for sharing about your mental state. Mental clarity can fluctuate during the postpartum period, and that's completely normal. ";
                }
                
                // Transition to SLEEP_QUESTION state
                conversationState = 'SLEEP_QUESTION';
                window.conversationState = conversationState;
                
                response = mentalResponse + "How have you been sleeping since the birth?\n\n1. 😴 Very poorly\n\n2. 😪 Interrupted frequently\n\n3. 😌 Somewhat okay\n\n4. 🛌 Getting enough rest\n\n5. 💤 Surprisingly well\n\nPlease select a number or describe your sleep patterns.";
                break;
                
            case 'SLEEP_QUESTION':
                // Process response about sleep
                console.log("Processing sleep input:", userMessage);
                
                // Store sleep pattern for potential future use
                localStorage.setItem('userSleepPattern', userMessage);
                
                // Validate if user entered a number outside the valid range
                if (/^[0-9]+$/.test(userMessage) && (parseInt(userMessage) < 1 || parseInt(userMessage) > 5)) {
                    response = "Please select a number between 1 and 5, or describe your sleep patterns:\n\n1. 😴 Very poorly\n\n2. 😪 Interrupted frequently\n\n3. 😌 Somewhat okay\n\n4. 🛌 Getting enough rest\n\n5. 💤 Surprisingly well";
                    break;
                }
                
                // Provide appropriate response based on sleep selection
                let sleepResponse = "";
                
                if (userMessage === "1" || /poor|bad|terrible|awful|no sleep/i.test(userMessage)) {
                    sleepResponse = "I'm sorry to hear you're sleeping very poorly. Severe sleep deprivation can affect your mood and ability to function. Try to sleep when your baby sleeps, even during the day, and consider asking a partner, family member, or friend to take a night feeding so you can get a longer stretch of sleep. If sleep problems persist, please mention it to your healthcare provider as it can affect your recovery. ";
                } else if (userMessage === "2" || /interrupt|broken|wake up|disturb/i.test(userMessage)) {
                    sleepResponse = "Interrupted sleep is challenging but normal with a newborn. Try to create a restful bedroom environment, limit screen time before bed, and develop a consistent bedtime routine when possible. Taking shifts with a partner or support person for night feedings can help each of you get some uninterrupted rest. ";
                } else if (userMessage === "3" || /okay|moderate|average|alright/i.test(userMessage)) {
                    sleepResponse = "Getting somewhat okay sleep is actually an accomplishment with a new baby! Continue to prioritize sleep when you can, and remember that your sleep needs may be higher during recovery. ";
                } else if (userMessage === "4" || /enough|sufficient|decent|good/i.test(userMessage)) {
                    sleepResponse = "It's wonderful that you're getting enough rest. Quality sleep is so important for your physical and emotional recovery, as well as for having the energy to care for your baby. ";
                } else if (userMessage === "5" || /great|well|excellent|amazing/i.test(userMessage)) {
                    sleepResponse = "That's fantastic that you're sleeping surprisingly well! This will significantly help your postpartum recovery and your ability to cope with new challenges. ";
                } else {
                    sleepResponse = "Thank you for sharing about your sleep patterns. Sleep is crucial for postpartum recovery, so try to get rest whenever possible. ";
                }
                
                // Transition to PHYSICAL_QUESTION state
                conversationState = 'PHYSICAL_QUESTION';
                window.conversationState = conversationState;
                
                response = sleepResponse + "How have you been feeling physically since the birth?\n\n1. 🤕 In pain or discomfort\n\n2. 😴 Tired or exhausted\n\n3. 💪 Recovering well\n\n4. 🙁 Having complications\n\n5. 😌 Back to normal\n\nPlease select a number or describe your physical recovery.";
                break;
                
            case 'PHYSICAL_QUESTION':
                // Process response about physical condition
                console.log("Processing physical condition input:", userMessage);
                
                // Store physical condition for potential future use
                localStorage.setItem('userPhysicalCondition', userMessage);
                
                // Validate if user entered a number outside the valid range
                if (/^[0-9]+$/.test(userMessage) && (parseInt(userMessage) < 1 || parseInt(userMessage) > 5)) {
                    response = "Please select a number between 1 and 5, or describe your physical recovery:\n\n1. 🤕 In pain or discomfort\n\n2. 😴 Tired or exhausted\n\n3. 💪 Recovering well\n\n4. 🙁 Having complications\n\n5. 😌 Back to normal";
                    break;
                }
                
                // Provide appropriate response based on physical condition selection
                let physicalResponse = "";
                
                if (userMessage === "1" || /pain|discomfort|hurt|sore|ache/i.test(userMessage)) {
                    physicalResponse = "I'm sorry you're experiencing pain or discomfort. Some discomfort is normal during recovery, but persistent or severe pain should be discussed with your healthcare provider. Make sure you're not overexerting yourself, and consider using approved pain management techniques recommended by your doctor. Warm baths (if approved by your provider), gentle stretching, and proper rest can sometimes help with minor discomforts. ";
                } else if (userMessage === "2" || /tired|exhausted|fatigue|no energy/i.test(userMessage)) {
                    physicalResponse = "Physical exhaustion is very common after giving birth and during early parenthood. Your body is recovering from pregnancy and birth while adapting to new demands. Try to prioritize nutrition with easy, healthy foods, stay hydrated, and rest whenever possible. Consider accepting help with household tasks to conserve your energy for recovery and baby care. ";
                } else if (userMessage === "3" || /recover|healing|getting better|improving/i.test(userMessage)) {
                    physicalResponse = "It's good to hear you're recovering well physically. Continue to be patient with your body - complete recovery can take time. Remember to still follow your provider's guidelines about physical activity restrictions and gradually increase your activity level. ";
                } else if (userMessage === "4" || /complication|problem|issue|concern|worry/i.test(userMessage)) {
                    physicalResponse = "I'm sorry to hear you're experiencing complications. Please make sure your healthcare provider knows about these issues, as they need proper medical attention. Don't hesitate to call your provider if you notice worsening symptoms or have concerns about your recovery. ";
                } else if (userMessage === "5" || /normal|great|excellent|good|fine/i.test(userMessage)) {
                    physicalResponse = "It's wonderful that you're feeling back to normal physically! This is a significant achievement in your postpartum journey. Continue to maintain your physical well-being with appropriate nutrition, hydration, and gradually increasing activity as approved by your provider. ";
                } else {
                    physicalResponse = "Thank you for sharing about your physical recovery. Every person's healing journey is different, and it's important to listen to your body during this time. ";
                }
                
                // Transition to SYMPTOMS_QUESTION state
                conversationState = 'SYMPTOMS_QUESTION';
                window.conversationState = conversationState;
                
                response = physicalResponse + "Could you please tell me what specific symptoms or concerns you're experiencing? This will help me provide better support for your specific needs.";
                break;
                
            case 'SYMPTOMS_QUESTION':
                // Process response about symptoms and transition to the next state
                console.log("Processing symptoms input:", userMessage);
                
                // Store symptoms for potential future use
                localStorage.setItem('userSymptoms', userMessage);
                
                // Assess risk level based on symptoms
                const riskAssessment = assessRiskLevel(userMessage);
                console.log(`Risk assessment: ${riskAssessment.level} risk`);
                
                // Generate structured symptom report
                const symptomReport = generateSymptomReport(userMessage, riskAssessment);
                
                // Transition to USER_LED state
                conversationState = 'USER_LED';
                window.conversationState = conversationState;
                
                response = symptomReport;
                break;
                
            case 'IN_PREGNANCY_INFO':
                console.log("Processing pregnancy info with input:", userMessage);
                
                // Define info options for reuse
                const infoOptions = {
                    '1': "What is Postpartum Depression?\n\nPostpartum depression is a serious mental health condition that can develop after childbirth. It can affect any new mother, occurring in about 1 in 7 births. It's more severe than the 'baby blues' and can interfere with daily functioning.",
                    '2': "Causes of Postpartum Depression\n\nPostpartum depression can be caused by:\n• Hormonal changes after childbirth\n• Sleep deprivation and exhaustion\n• Overwhelming feelings about new responsibilities\n• History of depression or anxiety\n• Lack of support\n• Relationship or financial stress",
                    '3': "Symptoms of Postpartum Depression\n\n• Persistent sadness or mood swings\n• Loss of interest in activities\n• Fatigue and sleep problems\n• Changes in appetite\n• Difficulty bonding with the baby\n• Anxiety or panic attacks\n• Feelings of worthlessness or guilt\n• Difficulty concentrating\n• Thoughts of harming yourself or your baby",
                    '4': "Prevention Measures\n\n• Early screening during pregnancy\n• Building a support network\n• Creating a postpartum care plan\n• Regular communication with healthcare providers\n• Learning about PPD before giving birth\n• Setting up help for after baby arrives",
                    '5': "Self-Care Tips\n\n• Get rest whenever possible\n• Accept help from family and friends\n• Eat regular, nutritious meals\n• Take breaks when feeling overwhelmed\n• Connect with other new mothers\n• Share your feelings with trusted people\n• Consider joining a support group"
                };
                
                // Add encouraging message for new mothers
                const encouragementMessage = "\n\nRemember: You're doing great preparing for this journey. Every step you take to learn and prepare shows what a thoughtful parent you'll be. You've got this!";
                
                const infoPrompt = `\n\nWhat else would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:`;

                // Check for "new" command to reset conversation
                if (/^new$/i.test(userMessage)) {
                    // Reset conversation state
                    conversationState = 'GREETING';
                    // Start a new conversation
                    response = "Hi, I'm MOM, your postpartum support companion. How can I help you today?";
                }
                // Direct string comparison for single digits
                else if (userMessage === "1") {
                    response = infoOptions['1'] + encouragementMessage + infoPrompt;
                    console.log("Direct match - What is PPD");
                }
                else if (userMessage === "2") {
                    response = infoOptions['2'] + encouragementMessage + infoPrompt;
                    console.log("Direct match - Causes of PPD");
                }
                else if (userMessage === "3") {
                    response = infoOptions['3'] + encouragementMessage + infoPrompt;
                    console.log("Direct match - Symptoms of PPD");
                }
                else if (userMessage === "4") {
                    response = infoOptions['4'] + encouragementMessage + infoPrompt;
                    console.log("Direct match - Prevention measures"); 
                }
                else if (userMessage === "5") {
                    response = infoOptions['5'] + encouragementMessage + infoPrompt;
                    console.log("Direct match - Self-care tips");
                }
                // Try parsing as integer if not direct match
                else {
                    const pregnancyChoice = parseInt(userMessage.trim());
                    if (!isNaN(pregnancyChoice) && pregnancyChoice >= 1 && pregnancyChoice <= 5) {
                        // Valid numeric choice
                        response = infoOptions[pregnancyChoice] + encouragementMessage + infoPrompt;
                        console.log("Parsed number - pregnancy info:", pregnancyChoice);
                    } 
                    else {
                        // Default response for invalid input
                        response = `I didn't understand that choice. Please choose a number from 1-5 or type "new" to start a new conversation:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips`;
                    }
                }
                break;
                
            case 'USER_LED':
                // Allow user to lead the conversation
                console.log("Processing user-led input:", userMessage);
                
                // Check for symptoms questionnaire request
                if (/symptoms|symptom|check symptoms|assessment/i.test(userMessage)) {
                    conversationState = 'SYMPTOMS_QUESTIONNAIRE';
                    window.conversationState = conversationState;
                    
                    response = "I can help you assess common postpartum symptoms. Which area would you like to check?\n\n1. 😔 Emotional symptoms (mood, anxiety, etc.)\n\n2. 💭 Mental symptoms (concentration, memory, etc.)\n\n3. 💤 Sleep issues\n\n4. 💪 Physical recovery concerns\n\n5. 👥 Social or relationship changes\n\nPlease choose a number (1-5), or type 'exit' to talk about something else.";
                    break;
                }
                
                // Process any other user-led conversation
                // Here we would call the backend to generate a response
                fetch('/api/chatbot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        message: userMessage,
                        userId: userId,
                        state: 'USER_LED'
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Received response from server:", data);
                    displayBotMessage(data.response);
                })
                .catch((error) => {
                    console.error('Error:', error);
                    displayBotMessage("I'm sorry, I couldn't process your message. Please try again.");
                });
                
                // Return null to prevent immediate response (we'll wait for the fetch to complete)
                return null;
                
            case 'SYMPTOMS_QUESTIONNAIRE':
                // Handle symptoms questionnaire
                console.log("Processing symptoms questionnaire input:", userMessage);
                
                // Check for exit request
                if (/exit|back/i.test(userMessage)) {
                    conversationState = 'USER_LED';
                    window.conversationState = conversationState;
                    response = "We've finished the symptom assessment. Is there anything specific from the assessment you'd like to discuss further?";
                    break;
                }
                
                // Validate if user entered a number outside the valid range
                if (/^[0-9]+$/.test(userMessage) && (parseInt(userMessage) < 1 || parseInt(userMessage) > 5)) {
                    response = "Please select a valid number between 1 and 5:\n\n1. 😔 Emotional symptoms (mood, anxiety, etc.)\n\n2. 💭 Mental symptoms (concentration, memory, etc.)\n\n3. 💤 Sleep issues\n\n4. 💪 Physical recovery concerns\n\n5. 👥 Social or relationship changes\n\nPlease choose a number (1-5), or type 'exit' to talk about something else.";
                    break;
                }
                
                // Process specific symptom options
                if (userMessage === '1' || /emotion|mood|anxiety/i.test(userMessage)) {
                    response = "Here's a quick assessment of common emotional symptoms after birth. Have you experienced any of these in the past 2 weeks?\n\n• Persistent sadness or crying\n• Feeling overwhelmed, worthless, or excessively guilty\n• Loss of interest in activities you used to enjoy\n• Withdrawing from family and friends\n• Excessive worry or anxiety\n• Anger or irritability that seems out of proportion\n• Thoughts of harming yourself or your baby\n\nIf you're experiencing several of these symptoms, especially if they're intense or persistent, it's important to speak with your healthcare provider. Postpartum mood disorders are common and treatable.\n\nWould you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation.";
                    break;
                } else if (userMessage === '2' || /mental|concentration|memory/i.test(userMessage)) {
                    response = "Here's a quick assessment of common mental symptoms after birth. Have you experienced any of these consistently?\n\n• Difficulty concentrating or making decisions\n• Forgetfulness or feeling mentally foggy\n• Racing thoughts that are difficult to control\n• Obsessive worries or intrusive thoughts\n• Difficulty focusing on tasks\n• Feeling detached or like you're \"going through the motions\"\n\nSome mental changes are normal due to hormones, sleep disruption, and adjustment to new responsibilities. However, if these symptoms significantly interfere with your daily functioning, consider discussing them with your healthcare provider.\n\nWould you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation.";
                    break;
                } else if (userMessage === '3' || /sleep|insomnia|rest/i.test(userMessage)) {
                    response = "Here's a quick assessment of common sleep issues after birth. Are you experiencing any of these?\n\n• Difficulty falling asleep even when baby is sleeping\n• Waking up with anxiety even when baby hasn't woken you\n• Intense dreams or nightmares\n• Feeling unrested even after getting some sleep\n• Complete inability to nap or sleep when given the opportunity\n• Racing thoughts that prevent sleep\n\nWhile interrupted sleep is expected with a new baby, the issues above may indicate a sleep disorder that could benefit from professional guidance. Sleep disruption can significantly impact your recovery and mental health.\n\nWould you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation.";
                    break;
                } else if (userMessage === '4' || /physical|pain|recovery/i.test(userMessage)) {
                    response = "Here's a quick assessment of physical recovery concerns. Are you experiencing any of these beyond what your provider indicated as normal?\n\n• Pain or discomfort that isn't improving or is getting worse\n• Excessive or changing pattern of bleeding\n• Fever over 100.4°F (38°C)\n• Severe headache, especially with vision changes\n• Swelling, redness, or discharge from incisions\n• Difficulty urinating or painful urination\n• Chest pain or difficulty breathing\n\nAny concerning physical symptoms should be reported to your healthcare provider promptly. Physical recovery is individual, but certain symptoms need immediate medical attention.\n\nWould you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation.";
                    break;
                } else if (userMessage === '5' || /social|relationship/i.test(userMessage)) {
                    response = "Here's a quick assessment of social and relationship changes. Have you noticed any of these since birth?\n\n• Feelings of isolation or disconnection from others\n• Significant strain in your relationship with your partner\n• Difficulty bonding with your baby\n• Feeling misunderstood by friends or family\n• Avoiding social situations you would normally enjoy\n• Feeling judged about your parenting choices\n\nChanges in relationships are normal after having a baby, but persistent difficulties may benefit from additional support. Parent groups, counseling, or even honest conversations with loved ones can help address these challenges.\n\nWould you like to check another symptom area? If yes, please enter a number 1-5, or type 'exit' to return to our conversation.";
                    break;
                } else {
                    response = "I'm not sure which symptom area you'd like to check. Could you please select a number (1-5)?\n\n1. 😔 Emotional symptoms (mood, anxiety, etc.)\n\n2. 💭 Mental symptoms (concentration, memory, etc.)\n\n3. 💤 Sleep issues\n\n4. 💪 Physical recovery concerns\n\n5. 👥 Social or relationship changes\n\nOr type 'exit' to return to our conversation.";
                    break;
                }
                
            default:
                // Check for keywords related to symptoms
                if (/symptoms|signs|check|assess|test|questionnaire|quiz|screening/i.test(userMessage)) {
                    conversationState = 'SYMPTOMS_QUESTIONNAIRE';
                    window.conversationState = conversationState;
                    console.log("✅ Transitioning to SYMPTOMS_QUESTIONNAIRE state");
                    
                    response = "I can help you assess common postpartum symptoms. Which area would you like to check?\n\n1. 😔 Emotional symptoms (mood, anxiety, etc.)\n\n2. 💭 Mental symptoms (concentration, memory, etc.)\n\n3. 💤 Sleep issues\n\n4. 💪 Physical recovery concerns\n\n5. 👥 Social or relationship changes";
                }
                else if (/depression|sad|upset|cry/i.test(userMessage)) {
                    response = "It sounds like you might be experiencing some difficult emotions. Many new mothers go through this. Would you like to talk more about how you're feeling?";
                } 
                else if (/sleep|tired|exhausted|fatigue/i.test(userMessage)) {
                    response = "Sleep deprivation is very common for new parents. It's important to try to rest when your baby sleeps, and ask for help from others when possible. Would you like some more tips on managing sleep?";
                } 
                else {
                    response = "I'm here to support you. Please let me know how I can help or what specific topics you'd like to discuss about the postpartum experience. You can also type 'symptoms' if you'd like to assess common postpartum symptoms.";
                }
                break;
        }
        
        // Remove loading indicator
        loadingMessage.remove();
        
        // Display the response
        addMessage(response, false);
        
        isProcessing = false;
    }
    
    // Single optimized handler for all input methods
    function handleUserInput(e) {
        // Prevent default for any event type
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        // Don't process if already handling a message
        if (isProcessing) {
            console.log("⚠️ Already processing a message, ignoring input");
            return;
        }
        
        // Use the handleUserMessage function which checks for "new" command
        handleUserMessage();
    }
    
    // Apply the handler to all input methods
    chatForm.addEventListener('submit', handleUserInput);
    sendButton.addEventListener('click', handleUserInput);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleUserInput(e);
        }
    });
    
    // Set the processUserMessage function in the debug object
    window.debugChatbot.processUserMessage = processUserMessage;
    
    // Initialize chat with greeting
    initializeChat();

    // Function to assess risk level based on symptoms
    function assessRiskLevel(message) {
        // Convert message to lowercase for case-insensitive matching
        const lowerMessage = message.toLowerCase();
        
        // High risk symptoms - immediate medical attention needed
        const highRiskSymptoms = [
            'suicidal', 'kill myself', 'end my life', 'don\'t want to live',
            'harm myself', 'harm my baby', 'hurt my baby', 'hurt myself',
            'severe bleeding', 'hemorrhage', 'can\'t breathe', 'chest pain',
            'seizure', 'convulsion', 'unconscious', 'passed out',
            'fever above 100.4', 'high fever', 'severe headache',
            'vision changes', 'blurry vision', 'spots in vision',
            'severe pain', 'unbearable pain', 'extreme pain',
            'thoughts of death', 'hallucination', 'seeing things', 'hearing voices',
            'can\'t move', 'paralysis', 'stroke', 'blood clot'
        ];
        
        // Medium risk symptoms - medical attention recommended soon
        const mediumRiskSymptoms = [
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
        ];
        
        // Low risk symptoms - normal postpartum experiences
        const lowRiskSymptoms = [
            'tired', 'fatigue', 'exhausted', 'no energy',
            'occasional crying', 'emotional', 'mood swings',
            'worried', 'nervous', 'concerned',
            'overwhelmed', 'stressed', 'too much',
            'forgetful', 'foggy', 'can\'t concentrate',
            'body aches', 'sore', 'discomfort',
            'sleep deprived', 'not enough sleep', 'interrupted sleep',
            'irritable', 'frustrated', 'annoyed',
            'lonely', 'isolated', 'alone',
            'relationship stress', 'partner issues', 'marriage problems'
        ];
        
        // Check for high risk symptoms first (most urgent)
        for (const symptom of highRiskSymptoms) {
            if (lowerMessage.includes(symptom)) {
                return {
                    level: 'high',
                    response: "I'm really concerned about how you're feeling. These symptoms are serious. You're not alone, and help is available. Please contact your healthcare provider immediately or go to the nearest emergency room. Your wellbeing is important, and these symptoms require prompt medical attention."
                };
            }
        }
        
        // Check for medium risk symptoms
        for (const symptom of mediumRiskSymptoms) {
            if (lowerMessage.includes(symptom)) {
                return {
                    level: 'medium',
                    response: "It sounds like you're going through some challenging adjustments. These symptoms are common but should be monitored closely. I recommend discussing them with your healthcare provider at your next appointment or sooner if they worsen. Taking care of your health is an important part of caring for your baby too."
                };
            }
        }
        
        // Default to low risk if no high or medium risk symptoms detected
        return {
            level: 'low',
            response: "Thank you for sharing. These feelings are valid and you're not alone. Many new parents experience similar symptoms, and they often improve with time, rest, and support. Continue practicing self-care and reach out to friends, family, or support groups when you need help."
        };
    }

    // Function to generate a structured symptom report
    function generateSymptomReport(message, riskAssessment) {
        // Identify reported symptoms
        const symptoms = identifySymptoms(message);
        
        // Get causes based on identified symptoms
        const causes = identifyCauses(symptoms);
        
        // Get treatment recommendations based on symptoms and risk level
        const treatment = identifyTreatment(symptoms, riskAssessment.level);
        
        // Get self-care tips based on symptoms
        const selfCare = identifySelfCare(symptoms);
        
        // Format the report
        return `
📋 POSTPARTUM ASSESSMENT REPORT 📋

🔍 REPORTED SYMPTOMS:
${symptoms.join("\n")}

⚠️ RISK LEVEL: ${riskAssessment.level.toUpperCase()}
${riskAssessment.response}

🔎 POSSIBLE CAUSES:
${causes.join("\n")}

💊 RECOMMENDED ACTIONS:
${treatment.join("\n")}

💗 SELF-CARE TIPS:
${selfCare.join("\n")}

You're taking an important step by seeking support. Remember that healing takes time, and you're doing a great job navigating this challenging period.

DISCLAIMER: This chatbot provides informational support only and is not a substitute for professional medical advice. Always consult with your healthcare provider for medical concerns.

Type "new" to start a new conversation.
`;
    }
    
    // Function to identify symptoms from user message
    function identifySymptoms(message) {
        const lowerMessage = message.toLowerCase();
        const symptoms = [];
        
        // Emotional symptoms
        if (/sad|tear|cry|depress|down|blue|unhappy|upset/i.test(lowerMessage)) {
            symptoms.push("• Feelings of sadness or tearfulness");
        }
        if (/anx|worry|nervous|stress|tense|on edge|restless/i.test(lowerMessage)) {
            symptoms.push("• Anxiety or excessive worry");
        }
        if (/irritable|angry|frustrat|annoy|short temper|rage/i.test(lowerMessage)) {
            symptoms.push("• Irritability or anger");
        }
        if (/overwhelm|too much|can't cope|burden|pressure/i.test(lowerMessage)) {
            symptoms.push("• Feeling overwhelmed");
        }
        if (/mood swing|up and down|emotional|unstable mood/i.test(lowerMessage)) {
            symptoms.push("• Mood swings");
        }
        if (/guilt|blame|bad mother|failure|not good enough/i.test(lowerMessage)) {
            symptoms.push("• Feelings of guilt or inadequacy");
        }
        if (/disconnect|detach|bond|love|feel nothing|numb/i.test(lowerMessage)) {
            symptoms.push("• Difficulty bonding with baby");
        }
        
        // Mental symptoms
        if (/fog|distract|forget|focus|concentrate|memory|think clearly/i.test(lowerMessage)) {
            symptoms.push("• Mental fog or difficulty concentrating");
        }
        if (/decision|choose|can't decide|confused/i.test(lowerMessage)) {
            symptoms.push("• Difficulty making decisions");
        }
        if (/thought|racing|mind won't stop|overthink/i.test(lowerMessage)) {
            symptoms.push("• Racing thoughts");
        }
        
        // Sleep issues
        if (/sleep|insomnia|awake|can't rest|tired|exhausted|fatigue/i.test(lowerMessage)) {
            symptoms.push("• Sleep disturbances or fatigue");
        }
        
        // Physical symptoms
        if (/pain|discomfort|hurt|sore|ache/i.test(lowerMessage)) {
            symptoms.push("• Physical pain or discomfort");
        }
        if (/bleed|discharge|infection|fever|incision|tear|swelling/i.test(lowerMessage)) {
            symptoms.push("• Physical recovery complications");
        }
        if (/appetite|eat|food|weight|hungry/i.test(lowerMessage)) {
            symptoms.push("• Changes in appetite");
        }
        if (/headache|migraine|head pain/i.test(lowerMessage)) {
            symptoms.push("• Headaches");
        }
        
        // Severe symptoms
        if (/suicidal|harm|death|kill|end life|don't want to live/i.test(lowerMessage)) {
            symptoms.push("• Thoughts of self-harm or suicide");
        }
        if (/hallucination|seeing things|hearing voices|delusion/i.test(lowerMessage)) {
            symptoms.push("• Hallucinations or delusions");
        }
        
        // If no specific symptoms identified
        if (symptoms.length === 0) {
            symptoms.push("• General postpartum concerns");
        }
        
        return symptoms;
    }
    
    // Function to identify potential causes based on symptoms
    function identifyCauses(symptoms) {
        const causes = [];
        
        // Check for emotional symptoms
        if (symptoms.some(s => /sad|tear|cry|depress|mood swing|overwhelm|irritable|angry/i.test(s))) {
            causes.push("• Hormonal changes - Dramatic drops in estrogen and progesterone after childbirth");
            causes.push("• Sleep deprivation - Fragmented sleep affecting mood regulation");
        }
        
        // Check for anxiety symptoms
        if (symptoms.some(s => /anx|worry|stress|tense|racing thought/i.test(s))) {
            causes.push("• Adjustment to new responsibilities and identity as a parent");
            causes.push("• Heightened protective instincts toward the baby");
        }
        
        // Check for bonding issues
        if (symptoms.some(s => /disconnect|bond|love|feel nothing|numb/i.test(s))) {
            causes.push("• Hormonal factors affecting emotional attachment");
            causes.push("• Exhaustion interfering with emotional capacity");
            causes.push("• Possible postpartum depression or anxiety");
        }
        
        // Check for cognitive symptoms
        if (symptoms.some(s => /fog|distract|forget|focus|concentrate|memory|decision/i.test(s))) {
            causes.push("• Sleep deprivation affecting cognitive function");
            causes.push("• Stress hormones impacting memory and concentration");
            causes.push("• Information overload from new parenting responsibilities");
        }
        
        // Check for sleep issues
        if (symptoms.some(s => /sleep|insomnia|awake|tired|exhausted|fatigue/i.test(s))) {
            causes.push("• Infant feeding schedule interrupting sleep cycles");
            causes.push("• Heightened alertness to baby's needs");
            causes.push("• Hormonal influences on sleep quality");
        }
        
        // Check for physical symptoms
        if (symptoms.some(s => /pain|discomfort|bleed|discharge|infection|fever|headache/i.test(s))) {
            causes.push("• Physical recovery from childbirth");
            causes.push("• Possible complications requiring medical attention");
            causes.push("• Muscle tension from new physical demands (holding baby, breastfeeding positions)");
        }
        
        // Check for severe symptoms
        if (symptoms.some(s => /suicidal|harm|hallucination|seeing things|hearing voices/i.test(s))) {
            causes.push("• Possible postpartum depression, anxiety, or psychosis requiring immediate medical attention");
            causes.push("• Severe hormonal imbalances affecting brain function");
            causes.push("• Extreme sleep deprivation affecting mental state");
        }
        
        // If no specific causes identified
        if (causes.length === 0) {
            causes.push("• Normal postpartum adjustment period");
            causes.push("• Hormonal changes following childbirth");
            causes.push("• Sleep disruption and physical recovery demands");
        }
        
        return causes;
    }
    
    // Function to identify treatment recommendations based on symptoms and risk level
    function identifyTreatment(symptoms, riskLevel) {
        const treatment = [];
        
        // High risk recommendations
        if (riskLevel === 'high') {
            treatment.push("• URGENT: Contact your healthcare provider immediately or go to the nearest emergency room");
            treatment.push("• Do not remain alone if experiencing thoughts of self-harm");
            treatment.push("• Call a crisis helpline: National Maternal Mental Health Hotline (1-833-943-5746)");
        }
        // Medium risk recommendations
        else if (riskLevel === 'medium') {
            treatment.push("• Schedule an appointment with your healthcare provider within the next few days");
            treatment.push("• Discuss medication options with your doctor if symptoms persist");
            treatment.push("• Consider therapy or counseling specialized in postpartum adjustment");
            treatment.push("• Join a postpartum support group (online or in-person)");
        }
        // Low risk recommendations
        else {
            treatment.push("• Monitor symptoms and discuss at your next routine check-up");
            treatment.push("• Reach out to family and friends for additional support");
            treatment.push("• Consider joining a new parents' group for community support");
        }
        
        // Specific treatment recommendations based on symptoms
        if (symptoms.some(s => /sad|tear|cry|depress|mood/i.test(s))) {
            treatment.push("• Talk therapy approaches like CBT (Cognitive Behavioral Therapy) have shown effectiveness for postpartum mood issues");
        }
        
        if (symptoms.some(s => /anx|worry|stress|tense/i.test(s))) {
            treatment.push("• Mindfulness and breathing exercises can help manage anxiety symptoms");
        }
        
        if (symptoms.some(s => /sleep|insomnia|awake|tired|exhausted|fatigue/i.test(s))) {
            treatment.push("• Discuss sleep strategies with your healthcare provider");
            treatment.push("• Consider sleep shifts with a partner or support person if possible");
        }
        
        if (symptoms.some(s => /pain|discomfort|bleed|discharge|infection|fever/i.test(s))) {
            treatment.push("• Follow up with your healthcare provider about physical symptoms");
            treatment.push("• Take prescribed medications as directed for pain or infection");
        }
        
        return treatment;
    }
    
    // Function to identify self-care tips based on symptoms
    function identifySelfCare(symptoms) {
        const selfCare = [];
        
        // General self-care tips for all postpartum individuals
        selfCare.push("• Prioritize sleep when possible - rest when your baby rests");
        selfCare.push("• Accept help from others with household tasks and baby care");
        selfCare.push("• Stay hydrated and eat nutritious, easy-to-prepare foods");
        
        // Specific self-care tips based on symptoms
        if (symptoms.some(s => /sad|tear|cry|depress|mood|overwhelm/i.test(s))) {
            selfCare.push("• Spend brief periods outdoors daily - natural light can help mood");
            selfCare.push("• Express feelings through journaling or talking with a trusted person");
            selfCare.push("• Remember that having difficult feelings doesn't make you a bad parent");
        }
        
        if (symptoms.some(s => /anx|worry|stress|tense/i.test(s))) {
            selfCare.push("• Practice 5-minute breathing exercises several times daily");
            selfCare.push("• Limit exposure to stressful media and information overload");
            selfCare.push("• Focus on one moment at a time rather than worrying about the future");
        }
        
        if (symptoms.some(s => /fog|distract|forget|focus|concentrate|memory/i.test(s))) {
            selfCare.push("• Use reminder apps or notes for important information");
            selfCare.push("• Break tasks into smaller, manageable steps");
            selfCare.push("• Be patient with yourself - 'mom brain' is a normal experience");
        }
        
        if (symptoms.some(s => /sleep|insomnia|awake|tired|exhausted|fatigue/i.test(s))) {
            selfCare.push("• Create a calming bedtime routine for yourself");
            selfCare.push("• Limit screen time before bed to improve sleep quality");
            selfCare.push("• Consider a white noise machine to help maintain sleep");
        }
        
        if (symptoms.some(s => /pain|discomfort|physical/i.test(s))) {
            selfCare.push("• Apply warm compresses for muscle soreness (if approved by your provider)");
            selfCare.push("• Practice gentle stretching for tension relief");
            selfCare.push("• Use proper body mechanics when lifting and carrying your baby");
        }
        
        return selfCare;
    }

    // Function to handle user messages
    function handleUserMessage() {
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;
        
        // Display user message
        addMessage(userMessage, true);
        messageInput.value = '';
        
        // Check if user wants to start a new conversation
        if (userMessage.toLowerCase() === 'new') {
            console.log("User requested a new conversation");
            // Reset conversation state to initial state
            conversationState = 'GREETING';
            window.conversationState = conversationState;
            localStorage.removeItem('userAge');
            localStorage.removeItem('userBirthTiming');
            localStorage.removeItem('userEmotionalState');
            localStorage.removeItem('userMentalState');
            localStorage.removeItem('userSleepPattern');
            localStorage.removeItem('userPhysicalCondition');
            localStorage.removeItem('userSymptoms');
            
            // Send greeting message
            setTimeout(() => {
                addMessage("Hi, I'm MOM, your postpartum support companion", false);
                
                // Set state to GREETING - the next user message will trigger the age question
                conversationState = 'GREETING';
                window.conversationState = conversationState;
            }, 1000);
            
            return;
        }
        
        // Process message based on current state
        processUserMessage(userMessage);
    }
}); 