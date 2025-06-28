// Chatbot client-side implementation
document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.querySelector('#chat-container, .chat-container') || document.querySelector('#chat-messages');
    const messageInput = document.getElementById('message-input');
    const chatForm = document.getElementById('chat-form');
    const sendButton = document.getElementById('send-button');
    
    let sessionId = localStorage.getItem('chatSessionId') || null;
    let isProcessing = false;
    
    // Simulated conversation state
    let conversationState = 'GREETING'; // GREETING, AWAITING_AGE, AGE_VERIFICATION_FAILED, AWAITING_CHILD_BIRTHDATE, etc.
    
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
                        // Check if line contains HTML (like <a> links)
                        if (line.includes('<a') && line.includes('</a>')) {
                            paragraph.innerHTML = line; // Use innerHTML for lines with HTML
                        } else {
                            paragraph.textContent = line; // Use textContent for plain text lines
                        }
                        contentDiv.appendChild(paragraph);
                    }
                    
                    // Add a line break if not the last line and not empty
                    if (index < array.length - 1 && line.trim()) {
                        contentDiv.appendChild(document.createElement('br'));
                    }
                });
            } else {
                // Check if content contains HTML
                if (content.includes('<a') && content.includes('</a>')) {
                    contentDiv.innerHTML = content; // Use innerHTML for content with HTML
                } else {
                    contentDiv.textContent = content; // Use textContent for plain text content
                }
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
        const chatbox = document.getElementById('chatbox');
        const userMessage = document.getElementById('user-message');
        
        // Check for test mode URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const testDate = urlParams.get('testDate');
        const testMode = urlParams.get('testMode');
        const debugMode = urlParams.get('debug') === 'true';
        
        // Set up global debug mode flag
        window.chatbotDebugMode = debugMode;
        
        if (debugMode) {
            console.log("🔍 DEBUG MODE ENABLED - Detailed logging will be shown");
        }
        
        if (testDate) {
            // Set a mock system date for testing
            try {
                const mockDate = new Date(testDate);
                if (!isNaN(mockDate)) {
                    console.log("🧪 TEST MODE: Using mock system date:", mockDate);
                    console.log(`   Year: ${mockDate.getFullYear()}, Month: ${mockDate.getMonth() + 1}, Day: ${mockDate.getDate()}`);
                    
                    // Override Date constructor for testing
                    const OriginalDate = Date;
                    Date = function(arg) {
                        if (arguments.length === 0) {
                            return new OriginalDate(mockDate);
                        } else {
                            return new OriginalDate(...arguments);
                        }
                    };
                    Date.UTC = OriginalDate.UTC;
                    Date.parse = OriginalDate.parse;
                    Date.now = function() { return mockDate.getTime(); };
                    Date.prototype = OriginalDate.prototype;
                    
                    // Display test mode indicator in UI
                    const testModeIndicator = document.createElement('div');
                    testModeIndicator.style.background = 'rgba(255, 255, 0, 0.2)';
                    testModeIndicator.style.padding = '5px';
                    testModeIndicator.style.textAlign = 'center';
                    testModeIndicator.style.fontWeight = 'bold';
                    testModeIndicator.innerHTML = `🧪 TEST MODE - Mock Date: ${mockDate.toDateString()}`;
                    document.body.insertBefore(testModeIndicator, document.body.firstChild);
                }
            } catch (e) {
                console.error("Failed to set mock date:", e);
            }
        }
        
        // Generate a session ID client-side
        if (!sessionId) {
            sessionId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chatSessionId', sessionId);
        }
        // Display the improved welcome and consent message with hand wave emoji
        addMessage("Hi there! 👋\n\nThank you for being here. Before we start, please take a moment to review:\n\nThis chatbot provides mental health support and helpful information for mothers after childbirth.\n\n This is not a substitute for professional help. If you're in crisis, please reach out to a healthcare provider.\n\nIf you're okay with this, type 'continue' to begin chatting. 💬");
        conversationState = 'AWAITING_CONTINUE';
        window.conversationState = conversationState;
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
        
        // Add missing switch statement here
        switch (conversationState) {
            case 'GREETING':
                // Check if user mentions being pregnant
                if (/pregnant|expecting|not born|not given birth|pregnancy/i.test(userMessage)) {
                    // Direct to pregnancy info state
                    conversationState = 'IN_PREGNANCY_INFO';
                    window.conversationState = conversationState;
                    response = `What would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:`;
                    break;
                    }
                
                // Check for EPDS or questionnaire-related keywords
                else if (/epds|edinburgh|depression scale|screening|assessment|questionnaire|test/i.test(userMessage)) {
                    conversationState = 'EPDS_LANGUAGE_SELECTION';
                    window.conversationState = conversationState;
                    
                    response = "Before we begin the Edinburgh Postnatal Depression Scale (EPDS), please select your preferred language for the questionnaire:\n\n1. English\n2. नेपाली (Nepali)";
                } 
                // Check if user directly says "no" to the greeting
                else if (/^(no|n|nope|nah|✗)$/i.test(userMessage)) {
                    // User declined assessment immediately, ask for age first
                    conversationState = 'AWAITING_AGE';
                    window.conversationState = conversationState;
                    response = "I understand. To provide the most relevant information, may I ask your age?";
                }
                else {
                    // Standard greeting response - go directly to age question instead of asking permission
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
                        } else if (age > 60) {
                            response = "I noticed you entered an age over 60. Could you please confirm your age as a number?";
                        } else {
                            localStorage.setItem('userAge', age);
                            conversationState = 'AWAITING_MARITAL_STATUS';
                            window.conversationState = conversationState;
                            response = "What is your marital status? Please choose one of the following options:\n1. 👩‍❤️‍👨 Married\n2. 💔 Divorced\n3. 🕯️ Widowed";
                        }
                    } else {
                        response = "Could you please tell me your age as a number?";
                    }
                } catch (e) {
                    response = "Could you please tell me your age as a number?";
                }
                break;
                
            case 'AWAITING_MARITAL_STATUS':
                // Accept both number and text answers for marital status (with or without icon)
                let status = null;
                if (/^(1|married|👩‍❤️‍👨 ?married)$/i.test(userMessage)) {
                    status = 'Married';
                } else if (/^(2|divorced|💔 ?divorced)$/i.test(userMessage)) {
                    status = 'Divorced';
                } else if (/^(3|widowed|🕯️ ?widowed)$/i.test(userMessage)) {
                    status = 'Widowed';
                }
                if (status) {
                    localStorage.setItem('maritalStatus', status);
                    conversationState = 'AWAITING_CHILD_BIRTHDATE';
                            window.conversationState = conversationState;
                    response = "Thank you. Now, could you tell me when your child was born?";
                    } else {
                    response = "What is your marital status? Please choose one of the following options:\n1. 👩‍❤️‍👨 Married\n2. 💔 Divorced\n3. 🕯️ Widowed";
                }
                break;
                
            case 'AWAITING_CHILD_BIRTHDATE':
                // Check if user hasn't given birth yet
                if (/not yet|haven't|no|still pregnant|expecting|pregnant/i.test(userMessage)) {
                    conversationState = 'IN_PREGNANCY_INFO';
                    window.conversationState = conversationState;
                    response = `What would you like to know:

1. What is postpartum depression
2. Causes of postpartum depression
3. Symptoms of postpartum depression
4. Prevention measures
5. Self-care tips

Please choose a number (1-5) or type "new" to start a new conversation:`;
                    break;
                }
                localStorage.setItem('childBirthdate', userMessage);
                let birthDateInfo = "";
                const currentDate = new Date();
                console.log("Current system date (full):", currentDate, "Timestamp:", currentDate.getTime());
                console.log("Current date for calculation:", currentDate.getFullYear(), "-", currentDate.getMonth() + 1, "-", currentDate.getDate());
                
                let weeksSinceBirth = null;
                let monthsSinceBirth = null;
                let isBS = false;
                try {
                    let birthDate;
                    const nepaliDigitPattern = /[०१२३४५६७८९]/;
                    const bsYearPattern = /(20[7-9][0-9])[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
                    if (nepaliDigitPattern.test(userMessage) || bsYearPattern.test(userMessage)) {
                        isBS = true;
                        
                        // Extract BS date components
                        const bsMatch = userMessage.match(bsYearPattern);
                        if (bsMatch) {
                            try {
                                const bsYear = parseInt(bsMatch[1], 10);
                                const bsMonth = parseInt(bsMatch[2], 10);
                                const bsDay = parseInt(bsMatch[3], 10);
                                
                                // Convert to AD for comparison
                                birthDate = bsToAd(bsYear, bsMonth, bsDay);
                                
                                // Get current date for comparison
                                const today = new Date();
                                console.log("Current system date (BS check):", today);
                                console.log("Birth date being checked (BS):", birthDate);
                                
                                // Get date components for comparison
                                const todayYear = today.getFullYear();
                                const todayMonth = today.getMonth();
                                const todayDay = today.getDate();
                                
                                const birthYear = birthDate.getFullYear();
                                const birthMonth = birthDate.getMonth();
                                const birthDay = birthDate.getDate();
                                
                                console.log("Today:", todayYear, todayMonth, todayDay);
                                console.log("Birth:", birthYear, birthMonth, birthDay);
                                
                                // Get the real current date for accurate comparison
                                const realToday = new Date();
                                
                                // Check if date is in the future
                                let isFutureDate = false;
                                const birthDateTime = new Date(birthYear, birthMonth, birthDay).getTime();
                                const todayTime = new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate()).getTime();
                                
                                // Simple timestamp comparison
                                if (birthDateTime > todayTime) {
                                    isFutureDate = true;
                                }
                                
                                console.log("Is future date (BS):", isFutureDate, "Birth time:", birthDateTime, "Today time:", todayTime);
                                
                                // Calculate time difference in days
                                const diffTime = today - birthDate;
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                
                                console.log("Difference in days (BS):", diffDays);
                                
                                // Check if date is in the future
                                if (isFutureDate) {
                                    birthDateInfo = `The Nepali date you entered seems to be in the future. Please check and enter the correct birth date.`;
                                } else {
                                    // Calculate weeks accurately
                                    weeksSinceBirth = Math.floor(diffDays / 7);
                                    
                                    // Calculate months more accurately using calendar months
                                    // Get birth date and today's date components
                                    const birthDate_year = birthDate.getFullYear();
                                    const birthDate_month = birthDate.getMonth();
                                    const today_year = today.getFullYear();
                                    const today_month = today.getMonth();
                                    
                                    // Calculate months difference accounting for actual calendar differences
                                    monthsSinceBirth = (today_year - birthDate_year) * 12 + (today_month - birthDate_month);
                                    
                                    // Adjust for day of month (if today's day is earlier in the month than birth day, subtract 1 month)
                                    if (today.getDate() < birthDate.getDate()) {
                                        monthsSinceBirth--;
                                    }
                                    
                                    // Ensure monthsSinceBirth is not negative
                                    monthsSinceBirth = Math.max(0, monthsSinceBirth);
                                    
                                    // Additional logging for debugging date calculations
                                    console.log("BS: Birth date components:", birthDate_year, birthDate_month, birthDate.getDate());
                                    console.log("BS: Today's date components:", today_year, today_month, today.getDate());
                                    console.log("BS: Calculated months:", monthsSinceBirth);
                                    
                                    // Determine appropriate message based on baby's age
                                    console.log("Time spans calculated: days:", diffDays, "weeks:", weeksSinceBirth, "months:", monthsSinceBirth);
                                    
                                    // Format response based on time since birth with more specific age ranges
                                    if (diffDays < 14) {
                                        // First 2 weeks tip
                                        const tip = "Consider traditional practices like warm oil massage (तेल मालिस) and follow the principle of सुत्केरी (postpartum rest period) by limiting visitors and accepting all help with meals and household tasks.";
                                        birthDateInfo = `Thank you! Based on your Nepali date (${userMessage}), your baby is ${diffDays} days old (${weeksSinceBirth} weeks, ${monthsSinceBirth} months). You're in the critical early postpartum period. ${tip}`;
                                    } else if (weeksSinceBirth < 6) {
                                        // 2-6 weeks tip
                                        const tip = "Continue with nutritious traditional soups like जवानो (thyme seed) and दुध (milk-based drinks) to aid recovery, and practice kangaroo care (skin-to-skin contact) with your baby.";
                                        birthDateInfo = `Thank you! Based on your Nepali date (${userMessage}), your baby is ${diffDays} days old (${weeksSinceBirth} weeks, ${monthsSinceBirth} months). You're still in the early postpartum period. ${tip}`;
                                    } else if (weeksSinceBirth < 12) {
                                        // 6-12 weeks tip
                                        const tip = "Begin gentle exercise like short walks around your neighborhood and connect with other new mothers in your community for support and advice.";
                                        birthDateInfo = `Thank you! Based on your Nepali date (${userMessage}), it's been ${diffDays} days (${weeksSinceBirth} weeks, ${monthsSinceBirth} months) since your baby was born. ${tip}`;
                                    } else {
                                        // Over 12 weeks tip
                                        const tip = "Make time for yourself daily, maintain consistent sleep routines, and consider joining mothers' groups at your local health post or community center.";
                                        birthDateInfo = `Thank you! Based on your Nepali date (${userMessage}), it's been ${diffDays} days (${weeksSinceBirth} weeks, ${monthsSinceBirth} months) since your baby was born. ${tip}`;
                                    }
                                }
                            } catch (e) {
                                console.log("Error parsing BS date:", e);
                                birthDateInfo = "The Nepali date format could not be understood. Please enter in format YYYY/MM/DD (e.g., 2080/02/15).";
                            }
                        }
                    }
                    if (!isBS) {
                        // Robustly parse YYYY/MM/DD or YYYY-MM-DD as UTC
                        let birthDate = null;
                        const isoPattern = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/;
                        const match = userMessage.match(isoPattern);
                        if (match) {
                            // Parse as YYYY/MM/DD or YYYY-MM-DD (UTC)
                            const year = parseInt(match[1], 10);
                            const month = parseInt(match[2], 10) - 1; // JS months are 0-based
                            const day = parseInt(match[3], 10);
                            birthDate = new Date(Date.UTC(year, month, day));
                        }
                        if (!birthDate || isNaN(birthDate)) {
                            birthDateInfo = "The date you entered could not be understood. Please enter the birth date in YYYY/MM/DD or YYYY-MM-DD format (e.g., 2023/12/25).";
                        } else {
                            // Get today's date in UTC (year, month, day only)
                            const now = new Date();
                            console.log("Current system date:", now);
                            console.log("Birth date being checked:", birthDate);
                            
                            // Convert to UTC for comparison based on date parts only
                            const todayYear = now.getUTCFullYear();
                            const todayMonth = now.getUTCMonth();
                            const todayDay = now.getUTCDate();
                            const todayUTC = new Date(Date.UTC(todayYear, todayMonth, todayDay));
                            
                            const birthYear = birthDate.getUTCFullYear();
                            const birthMonth = birthDate.getUTCMonth();
                            const birthDay = birthDate.getUTCDate();
                            
                            console.log("Today (UTC):", todayYear, todayMonth, todayDay);
                            console.log("Birth (UTC):", birthYear, birthMonth, birthDay);
                            
                            // Get the real current date for accurate comparison
                            const realToday = new Date();
                            
                            // First check if the birth date is in the future
                            let isFutureDate = false;
                            
                            // Create UTC timestamps for accurate comparison
                            const birthDateTime = Date.UTC(birthYear, birthMonth, birthDay);
                            const todayTime = Date.UTC(realToday.getUTCFullYear(), realToday.getUTCMonth(), realToday.getUTCDate());
                            
                            // Simple timestamp comparison
                            if (birthDateTime > todayTime) {
                                isFutureDate = true;
                            }
                            
                            console.log("Is future date:", isFutureDate, "Birth time:", birthDateTime, "Today time:", todayTime);
                            
                            // Calculate time difference in days for reporting
                            const diffTime = todayUTC - birthDate;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            console.log("Difference in days:", diffDays);
                            
                            if (isFutureDate) {
                                birthDateInfo = `The date you entered seems to be in the future. Please check and enter the correct birth date.`;
                    } else {
                                // Calculate weeks accurately
                                weeksSinceBirth = Math.floor(diffDays / 7);
                                
                                // Calculate months more accurately using calendar months
                                // Get birth date and today's date components
                                const birthDate_year = birthDate.getUTCFullYear();
                                const birthDate_month = birthDate.getUTCMonth();
                                const today_year = realToday.getUTCFullYear();
                                const today_month = realToday.getUTCMonth();
                                
                                // Calculate months difference accounting for actual calendar differences
                                monthsSinceBirth = (today_year - birthDate_year) * 12 + (today_month - birthDate_month);
                                
                                // Adjust for day of month (if today's day is earlier in the month than birth day, subtract 1 month)
                                if (realToday.getUTCDate() < birthDate.getUTCDate()) {
                                    monthsSinceBirth--;
                                }
                                
                                // Ensure monthsSinceBirth is not negative
                                monthsSinceBirth = Math.max(0, monthsSinceBirth);
                                
                                // Additional logging for debugging date calculations
                                console.log("Birth date components:", birthDate_year, birthDate_month, birthDate.getUTCDate());
                                console.log("Today's date components:", today_year, today_month, realToday.getUTCDate());
                                console.log("Calculated months:", monthsSinceBirth);
                                
                                const isLessThanSixWeeks = weeksSinceBirth < 6;
                                localStorage.setItem('isLessThanTwoWeeks', diffDays < 14);
                                
                                // Determine appropriate message based on baby's age
                                console.log("AD: Time spans calculated: days:", diffDays, "weeks:", weeksSinceBirth, "months:", monthsSinceBirth);
                                
                                // Include days with weeks and months in brackets with more specific age ranges
                                if (diffDays < 14) {
                                    // First 2 weeks tip
                                    const tip = "Consider traditional practices like warm oil massage (तेल मालिस) and follow the principle of सुत्केरी (postpartum rest period) by limiting visitors and accepting all help with meals and household tasks.";
                                    birthDateInfo = `Thanks! Your baby is ${diffDays} days old (${weeksSinceBirth} weeks, ${monthsSinceBirth} months). You're in the critical early postpartum period. ${tip}`;
                                } else if (weeksSinceBirth < 6) {
                                    // 2-6 weeks tip
                                    const tip = "Continue with nutritious traditional soups like जवानो (thyme seed) and दुध (milk-based drinks) to aid recovery, and practice kangaroo care (skin-to-skin contact) with your baby.";
                                    birthDateInfo = `Thanks! Your baby is ${diffDays} days old (${weeksSinceBirth} weeks, ${monthsSinceBirth} months). You're still in the early postpartum period. ${tip}`;
                                } else if (weeksSinceBirth < 12) {
                                    // 6-12 weeks tip
                                    const tip = "Begin gentle exercise like short walks around your neighborhood and connect with other new mothers in your community for support and advice.";
                                    birthDateInfo = `It's been ${diffDays} days (${weeksSinceBirth} weeks, ${monthsSinceBirth} months) since your baby was born. ${tip}`;
                                } else {
                                    // Over 12 weeks tip
                                    const tip = "Make time for yourself daily, maintain consistent sleep routines, and consider joining mothers' groups at your local health post or community center.";
                                    birthDateInfo = `It's been ${diffDays} days (${weeksSinceBirth} weeks, ${monthsSinceBirth} months) since your baby was born. ${tip}`;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log("Error parsing birth date:", e);
                }
                if (!birthDateInfo) {
                    if (isBS) {
                        birthDateInfo = "The Nepali date format could not be understood. Please enter in format YYYY/MM/DD (e.g., 2080/02/15).";
                    } else {
                        birthDateInfo = "The date you entered could not be understood. Please enter the birth date in English or Nepali format (e.g., 2080/09/10 or 2023/12/25).";
                    }
                }
                conversationState = 'BIRTH_TIMING_RESPONSE';
                window.conversationState = conversationState;
                response = `Thank you for sharing your baby's birth date. ${birthDateInfo}

To better support you, we can go through a few short questions about how you've been feeling. Would you like to start?`;
                break;
                
            case 'BIRTH_TIMING_RESPONSE':
                // Handle the response to the birth timing information
                if (/^(yes|y|yeah|yep|sure|ok|okay|✓)$/i.test(userMessage)) {
                    // User wants to proceed with EPDS
                    conversationState = 'EPDS_LANGUAGE_SELECTION';
                    window.conversationState = conversationState;
                    
                    response = "Before we begin the Edinburgh Postnatal Depression Scale (EPDS), please select your preferred language for the questionnaire:\n\n1. English\n2. नेपाली (Nepali)";
                } else if (/^(no|n|nope|nah|✗)$/i.test(userMessage)) {
                    // User doesn't want to proceed with EPDS
                    conversationState = 'USER_LED';
                    window.conversationState = conversationState;
                    
                    // Provide wellness tips and Nepal-specific resources instead with helpful icons
                    response = "That's completely fine. Here are some wellness tips that might be helpful:\n\n" +
                        "🚶‍♀️ 1. Get Regular Exercise\n" +
                        "Just 30 minutes of walking a day can lift your mood and improve your health.\n\n" +
                        "🥗 2. Eat Well & Stay Hydrated\n" +
                        "Eat balanced meals regularly and drink plenty of water.\n\n" +
                        "💤 3. Prioritize Sleep\n" +
                        "Stick to a consistent sleep schedule when possible.\n\n" +
                        "🧘‍♀️ 4. Practice Relaxation\n" +
                        "Try meditation, deep breathing, or stretching.\n\n" +
                        "📋 5. Set Goals & Priorities\n" +
                        "Focus on what needs to be done now. Don't overload yourself.\n\n" +
                        "🙏 6. Practice Gratitude\n" +
                        "Take time each day to reflect on things you're thankful for.\n\n" +
                        "😊 7. Stay Positive\n" +
                        "Notice negative thoughts and try to reframe them positively.\n\n" +
                        "👥 8. Stay Connected\n" +
                        "Reach out to friends or family for support.\n\n" +
                        "If you ever feel you need professional support, here are some resources in Nepal:\n\n" +
                        "📞 Mental Health Helpline Nepal: 1660 0102005\n" +
                        "🏢 Transcultural Psychosocial Organization Nepal (TPO Nepal): 01-4431717\n" +
                        "🏥 Center for Mental Health and Counselling Nepal (CMC-Nepal): 01-4102037\n\n" +
                        "Type 'new' for a new conversation.";
                }                 else {
                    // User provided an unclear response
                    response = "I didn't understand your response. Would you like to start a few short questions about how you've been feeling? Please answer with Yes or No.";
                }
                break;
                
            case 'AGE_VERIFICATION_FAILED':
                try {
                    const age = parseInt(userMessage);
                    if (!isNaN(age)) {
                        if (age < 18) {
                            response = "I understand you're looking for help. Because you're under 18, it's a good idea to speak with a parent or healthcare provider. Could you please tell me your age?";
                        } else if (age > 60) {
                            response = "I noticed you entered an age over 60. Could you please confirm your age as a number?";
                        } else {
                            localStorage.setItem('userAge', age);
                            
                            conversationState = 'AWAITING_CHILD_BIRTHDATE';
                            window.conversationState = conversationState;
                            response = "Thank you for sharing your age. Now, could you tell me when your child was born?";
                        }
                } else {
                        response = "Could you please tell me your age as a number?";
                    }
                } catch (e) {
                    response = "Could you please tell me your age as a number?";
                }
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
                    response = "Hi, I'm MOM, your postpartum support companion";
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
                
                // Check for EPDS questionnaire request
                if (/^(yes|y|yeah|yep|sure|ok|okay)$/i.test(userMessage) || /epds|edinburgh|depression scale|screening|assessment|questionnaire|test/i.test(userMessage)) {
                    conversationState = 'EPDS_LANGUAGE_SELECTION';
                    window.conversationState = conversationState;
                    
                    response = "Before we begin the Edinburgh Postnatal Depression Scale (EPDS), please select your preferred language for the questionnaire:\n\n1. English\n2. नेपाली (Nepali)";
                    break;
                } else if (/^(no|n|nope|nah)$/i.test(userMessage)) {
                    // Ask for age instead of showing self-care tips
                    conversationState = 'AWAITING_AGE';
                    window.conversationState = conversationState;
                    response = "To give you the best support, may I ask your age?";
                    break;
                }
                
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
                    
                    // Add prompt about EPDS when appropriate
                    let modifiedResponse = data.response;
                    if (/depress|sad|unhappy|mood|screen|test|assessment/i.test(userMessage)) {
                        modifiedResponse += "\n\nWould you like to take the Edinburgh Postnatal Depression Scale (EPDS) questionnaire? This is a validated screening tool that can help identify if you might be experiencing postpartum depression. Type 'take EPDS' or 'start questionnaire' if you'd like to begin.";
                    }
                    
                    displayBotMessage(modifiedResponse);
                })
                .catch((error) => {
                    console.error('Error:', error);
                    displayBotMessage("I'm sorry, I couldn't process your message. Please try again.");
                });
                
                // Return null to prevent immediate response (we'll wait for the fetch to complete)
                return null;
                
            case 'EPDS_LANGUAGE_SELECTION':
                // Process language selection
                if (/^(1|english|अंग्रेजी)$/i.test(userMessage)) {
                    // User selected English
                    localStorage.setItem('epdsLanguage', 'english');
                    
                    // Initialize EPDS score in localStorage
                    localStorage.setItem('epdsCurrentQuestion', '1');
                    localStorage.setItem('epdsScore', '0');
                    localStorage.setItem('epdsAnswers', JSON.stringify([]));
                    
                    // Move to EPDS_START state
                    conversationState = 'EPDS_START';
                    window.conversationState = conversationState;
                    
                    response = "I'll help you complete the Edinburgh Postnatal Depression Scale (EPDS) in English. This is a validated screening tool for postpartum depression. Please answer 10 questions about how you've been feeling in the past 7 days. This is not a diagnosis but can help identify if you might need additional support.\n\nQuestion 1: I have been able to laugh and see the funny side of things\n\n1. As much as I always could\n2. Not quite so much now\n3. Definitely not so much now\n4. Not at all\n\nPlease reply with the number of your answer (1-4).";
                } 
                else if (/^(2|nepali|नेपाली)$/i.test(userMessage)) {
                    // User selected Nepali
                    localStorage.setItem('epdsLanguage', 'nepali');
                    
                    // Initialize EPDS score in localStorage
                    localStorage.setItem('epdsCurrentQuestion', '1');
                    localStorage.setItem('epdsScore', '0');
                    localStorage.setItem('epdsAnswers', JSON.stringify([]));
                    
                    // Move to EPDS_START state
                    conversationState = 'EPDS_START';
                    window.conversationState = conversationState;
                    
                    response = "म तपाईंलाई नेपाली भाषामा एडिनबर्ग पोस्टनेटल डिप्रेसन स्केल (EPDS) पूरा गर्न मद्दत गर्नेछु। यो प्रसवपछिको अवसादको लागि एक मान्य स्क्रिनिंग उपकरण हो। कृपया विगत ७ दिनमा तपाईंले कस्तो महसुस गर्नुभएको छ भन्ने बारे १० प्रश्नहरूको उत्तर दिनुहोस्। यो निदान होइन तर तपाईंलाई थप समर्थन आवश्यक पर्न सक्छ कि पहिचान गर्न मद्दत गर्न सक्छ।\n\nप्रश्न १: म हाँस्न सकेको छु र चीजहरूको रमाइलो पक्ष देख्न सकेको छु\n\n1. जति म सधैं गर्न सक्थें\n2. अहिले त्यति धेरै होइन\n3. अहिले निश्चित रूपमा त्यति धेरै होइन\n4. पटक्कै होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                }
                else {
                    response = "I didn't understand your selection. Please choose your preferred language for the questionnaire:\n\n1. English\n2. नेपाली (Nepali)";
                }
                break;
                
            case 'EPDS_START':
                // Handle EPDS questionnaire
                console.log("Processing EPDS question answer:", userMessage);
                
                // Process the user's answer to the current question
                const currentQuestion = parseInt(localStorage.getItem('epdsCurrentQuestion'));
                let currentScore = parseInt(localStorage.getItem('epdsScore'));
                const epdsAnswers = JSON.parse(localStorage.getItem('epdsAnswers'));
                const language = localStorage.getItem('epdsLanguage') || 'english';
                
                // Validate answer is a number between 1-4
                let answerNum = parseInt(userMessage);
                if (isNaN(answerNum) || answerNum < 1 || answerNum > 4) {
                    if (language === 'english') {
                    response = "Please enter a valid number between 1-4 corresponding to your answer.";
                    } else {
                        response = "कृपया तपाईंको उत्तरसँग मेल खाने १-४ बीचको मान्य नम्बर प्रविष्ट गर्नुहोस्।";
                    }
                    break;
                }
                
                // Convert answer from 1-4 to 0-3 points
                const answerValue = answerNum - 1;
                
                // Store the answer 
                epdsAnswers.push(answerNum);
                localStorage.setItem('epdsAnswers', JSON.stringify(epdsAnswers));
                
                // Calculate score based on question number (EPDS scoring is different for each question)
                let pointsForAnswer = 0;
                
                // Questions 1, 2, and 4 are scored in reverse (3,2,1,0 instead of 0,1,2,3)
                if (currentQuestion === 1 || currentQuestion === 2) {
                    pointsForAnswer = 3 - answerValue; // Reverse scoring for positive questions
                } else if (currentQuestion === 4) {
                    if (answerValue === 0) pointsForAnswer = 3;
                    else if (answerValue === 1) pointsForAnswer = 2;
                    else if (answerValue === 2) pointsForAnswer = 1;
                    else pointsForAnswer = 0;
                } else {
                    pointsForAnswer = answerValue; // Normal scoring for negative questions
                }
                
                // Update total score
                currentScore += pointsForAnswer;
                localStorage.setItem('epdsScore', currentScore.toString());
                
                // Move to next question or finish
                const nextQuestion = currentQuestion + 1;
                localStorage.setItem('epdsCurrentQuestion', nextQuestion.toString());
                
                // Present the appropriate question based on question number and language
                if (language === 'english') {
                    // English questions
                if (nextQuestion === 2) {
                    response = "Question 2: I have looked forward with enjoyment to things\n\n1. As much as I ever did\n2. Rather less than I used to\n3. Definitely less than I used to\n4. Hardly at all\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 3) {
                    response = "Question 3: I have blamed myself unnecessarily when things went wrong\n\n1. Yes, most of the time\n2. Yes, some of the time\n3. Not very often\n4. No, never\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 4) {
                    response = "Question 4: I have been anxious or worried for no good reason\n\n1. No, not at all\n2. Hardly ever\n3. Yes, sometimes\n4. Yes, very often\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 5) {
                    response = "Question 5: I have felt scared or panicky for no very good reason\n\n1. Yes, quite a lot\n2. Yes, sometimes\n3. No, not much\n4. No, not at all\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 6) {
                    response = "Question 6: Things have been getting on top of me\n\n1. Yes, most of the time I haven't been able to cope at all\n2. Yes, sometimes I haven't been coping as well as usual\n3. No, most of the time I have coped quite well\n4. No, I have been coping as well as ever\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 7) {
                    response = "Question 7: I have been so unhappy that I have had difficulty sleeping\n\n1. Yes, most of the time\n2. Yes, sometimes\n3. Not very often\n4. No, not at all\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 8) {
                    response = "Question 8: I have felt sad or miserable\n\n1. Yes, most of the time\n2. Yes, quite often\n3. Not very often\n4. No, not at all\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 9) {
                    response = "Question 9: I have been so unhappy that I have been crying\n\n1. Yes, most of the time\n2. Yes, quite often\n3. Only occasionally\n4. No, never\n\nPlease reply with the number of your answer (1-4).";
                } else if (nextQuestion === 10) {
                    response = "Question 10: The thought of harming myself has occurred to me\n\n1. Yes, quite often\n2. Sometimes\n3. Hardly ever\n4. Never\n\nPlease reply with the number of your answer (1-4).";
                    }
                } else {
                    // Nepali questions
                    if (nextQuestion === 2) {
                        response = "प्रश्न २: मैले आनन्दका साथ कुराहरूको प्रतिक्षा गरेको छु\n\n1. जति धेरै मैले सधैं गर्थें\n2. पहिला भन्दा कम\n3. पहिला भन्दा निश्चित रूपमा कम\n4. लगभग छैन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 3) {
                        response = "प्रश्न ३: जब कुराहरू गलत भए मैले अनावश्यक रूपमा आफैलाई दोष दिएको छु\n\n1. हो, धेरै जसो समय\n2. हो, केही समय\n3. धेरै पटक होइन\n4. होइन, कहिल्यै होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 4) {
                        response = "प्रश्न ४: म कुनै राम्रो कारण बिना चिन्तित वा चिन्तित भएको छु\n\n1. होइन, बिल्कुल होइन\n2. धेरै कम\n3. हो, कहिलेकाहीं\n4. हो, धेरै पटक\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 5) {
                        response = "प्रश्न ५: म कुनै खास राम्रो कारण बिना डराएको वा घबराएको महसुस गरेको छु\n\n1. हो, धेरै\n2. हो, कहिलेकाहीं\n3. होइन, त्यति धेरै होइन\n4. होइन, बिल्कुल होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 6) {
                        response = "प्रश्न ६: कुराहरू मेरो माथि पर्दै छन्\n\n1. हो, धेरै जसो समय मैले सामना गर्न सकेको छैन\n2. हो, कहिलेकाहीं म सामान्यतया सामना गर्न सक्दिन\n3. होइन, धेरै जसो समय मैले राम्रोसँग सामना गरेको छु\n4. होइन, मैले सधैंझैं सामना गरेको छु\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 7) {
                        response = "प्रश्न ७: म यति दुखी भएको छु कि मलाई सुत्न गाह्रो भएको छ\n\n1. हो, धेरै जसो समय\n2. हो, कहिलेकाहीं\n3. त्यति धेरै पटक होइन\n4. होइन, बिल्कुल होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 8) {
                        response = "प्रश्न ८: मैले दु:खी वा दु:खी महसुस गरेको छु\n\n1. हो, धेरै जसो समय\n2. हो, धेरै पटक\n3. त्यति धेरै पटक होइन\n4. होइन, बिल्कुल होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 9) {
                        response = "प्रश्न ९: म यति दुखी भएको छु कि म रोएको छु\n\n1. हो, धेरै जसो समय\n2. हो, धेरै पटक\n3. कहिलेकाहीं मात्र\n4. होइन, कहिल्यै होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    } else if (nextQuestion === 10) {
                        response = "प्रश्न १०: आफूलाई हानि पुर्याउने विचार मलाई आएको छ\n\n1. हो, धेरै पटक\n2. कहिलेकाहीं\n3. बिरलै\n4. कहिल्यै होइन\n\nकृपया तपाईंको उत्तरको संख्या (१-४) संग जवाफ दिनुहोस्।";
                    }
                }

                // Handle questionnaire completion (question 11)
                if (nextQuestion === 11) {
                    // Questionnaire complete - process results
                    console.log(`EPDS questionnaire complete. Total score: ${currentScore}`);
                    
                    // Interpret score
                    let interpretation = "";
                    let recommendation = "";
                    let scoreEmoji = "";
                    let scoreCategory = "";
                    
                    if (currentScore >= 10) {
                        scoreEmoji = "🔴";
                        scoreCategory = "Possible Depression";
                        interpretation = language === 'english' ? 
                            "Your score indicates possible depression. " : 
                            "तपाईंको स्कोरले सम्भावित अवसाद देखाउँछ। ";
                        
                        recommendation = language === 'english' ? 
                            "It's recommended that you speak with a healthcare provider about these feelings. This is not a diagnosis, but your answers suggest you may benefit from professional support." : 
                            "यी भावनाहरूको बारेमा स्वास्थ्य सेवा प्रदायकसँग कुरा गर्न सिफारिस गरिन्छ। यो निदान होइन, तर तपाईंको जवाफले तपाईं पेशेवर समर्थनबाट लाभ लिन सक्नुहुन्छ भन्ने सुझाव दिन्छ।";
                    } else {
                        scoreEmoji = "🟢";
                        scoreCategory = "No Depression";
                        interpretation = language === 'english' ? 
                            "Your score suggests you are not experiencing depression at this time. " : 
                            "तपाईंको स्कोरले यस समय तपाईं अवसाद अनुभव गरिरहनुभएको छैन भन्ने सुझाव दिन्छ। ";
                        
                        recommendation = language === 'english' ? 
                            "Continue to monitor your feelings and practice self-care during this important time." : 
                            "यस महत्त्वपूर्ण समयमा आफ्नो भावनाहरूको अनुगमन गर्न र स्व-हेरचाह अभ्यास जारी राख्नुहोस्।";
                    }
                    
                    // Special attention to question 10 (suicidal thoughts)
                    const q10Answer = epdsAnswers[9]; // 0-indexed array
                    let suicidalThoughtsWarning = "";
                    if (q10Answer === 1 || q10Answer === 2) {
                        suicidalThoughtsWarning = language === 'english' ? 
                            "\n\n⚠️ IMPORTANT: Your response to question 10 suggests you may have had thoughts of harming yourself. Please speak with a healthcare provider immediately or contact a crisis helpline such as the Nepal National Suicide Prevention Helpline at 1166." : 
                            "\n\n⚠️ महत्वपूर्ण: प्रश्न १० मा तपाईंको प्रतिक्रियाले तपाईंलाई आफूलाई हानि पुर्याउने विचारहरू आएको हुन सक्छ भनेर सुझाव दिन्छ। कृपया तुरुन्तै स्वास्थ्य सेवा प्रदायकसँग कुरा गर्नुहोस् वा नेपाल राष्ट्रिय आत्महत्या रोकथाम हेल्पलाइन ११६६ मा सम्पर्क गर्नुहोस्।";
                    }
                    
                    // Reset state to USER_LED
                    conversationState = 'USER_LED';
                    window.conversationState = conversationState;
                    
                    // Format results based on language
                    if (language === 'english') {
                    response = `Thank you for completing the Edinburgh Postnatal Depression Scale (EPDS).

EPDS SCORE: ${scoreEmoji} ${currentScore}/30 - ${scoreCategory}

${interpretation}${recommendation}${suicidalThoughtsWarning}

Remember, this screening tool is not a diagnosis but can help guide you and your healthcare provider in discussions about your emotional wellbeing.

💪 WELLNESS TIPS:

🚶‍♀️ 1. Get Regular Exercise
Just 30 minutes of walking a day can lift your mood and improve your health. Even short bursts of movement throughout the day add up.

🥗 2. Eat Well & Stay Hydrated
Eat balanced meals regularly and drink plenty of water. Limit caffeine and alcohol if they affect your mood or sleep.

💤 3. Prioritize Sleep
Stick to a consistent sleep schedule. Avoid screens before bed, as blue light can interfere with falling asleep.

🧘‍♀️ 4. Practice Relaxation
Try meditation, deep breathing, or stretching. Schedule time for hobbies you enjoy, like music, reading, or nature walks.

📋 5. Set Goals & Priorities
Focus on what needs to be done now. Don't overload yourself. Celebrate small accomplishments.

🙏 6. Practice Gratitude
Take time each day to reflect on things you're thankful for—big or small. Writing them down can help.

😊 7. Stay Positive
Notice negative thoughts and try to reframe them with more balanced, helpful perspectives.

👥 8. Stay Connected
Reach out to friends or family. Social support is key for emotional resilience.

DISCLAIMER: This chatbot provides informational support only and is not a substitute for professional medical advice. Always consult with your healthcare provider for medical concerns.

🔍 RESOURCES:
• <a href="https://www.nejm.org/doi/full/10.1056/NEJMcp1607649" target="_blank">Comprehensive Guide to Postpartum Depression - Baby Blues vs. PPD, Symptoms, Causes, and Treatment (NEJM)</a>
• Nepal National Suicide Prevention Helpline: 1166 (free from Nepal Telecom)
• TPO Nepal Mental Health Helpline: 1660-010-2005 (toll-free, available 8AM-6PM)
• CMC-Nepal Mental Health Counseling: +977-9847386158

Type 'new' for a new conversation.`;
                    } else {
                        response = `एडिनबर्ग पोस्टनेटल डिप्रेसन स्केल (EPDS) पूरा गर्नुभएकोमा धन्यवाद।

EPDS स्कोर: ${scoreEmoji} ${currentScore}/30 - ${scoreCategory === "Possible Depression" ? "सम्भावित अवसाद" : "अवसाद छैन"}

${interpretation}${recommendation}${suicidalThoughtsWarning}

याद गर्नुहोस्, यो स्क्रिनिंग उपकरण निदान होइन तर तपाईंको भावनात्मक कल्याणको बारेमा छलफलहरूमा तपाईं र तपाईंको स्वास्थ्य सेवा प्रदायकलाई मार्गदर्शन गर्न मद्दत गर्न सक्छ।

💪 स्वास्थ्य सुझावहरू:

🚶‍♀️ 1. नियमित व्यायाम गर्नुहोस्
दिनको 30 मिनेट हिंड्दा तपाईंको मनोदशा उठ्न र स्वास्थ्य सुधार हुन सक्छ।

🥗 2. राम्रो खानुहोस् र हाइड्रेटेड रहनुहोस्
नियमित रूपमा सन्तुलित खाना खानुहोस् र प्रशस्त पानी पिउनुहोस्।

💤 3. निद्रालाई प्राथमिकता दिनुहोस्
एक नियमित निद्रा तालिका अपनाउनुहोस्। सुत्नु अघि स्क्रिनबाट टाढा रहनुहोस्।

🧘‍♀️ 4. आराम अभ्यास गर्नुहोस्
ध्यान, गहिरो सास, वा स्ट्रेचिङ प्रयास गर्नुहोस्। तपाईंले मन पराउने शौकहरू जस्तै संगीत, पढ्ने वा प्रकृतिमा हिँड्नको लागि समय तालिका बनाउनुहोस्।

📋 5. लक्ष्य र प्राथमिकताहरू निर्धारण गर्नुहोस्
अहिले के गर्नु पर्छ त्यसमा ध्यान केन्द्रित गर्नुहोस्। आफैलाई अधिक बोझ नलगाउनुहोस्। साना उपलब्धिहरूको उत्सव मनाउनुहोस्।

🙏 6. कृतज्ञता अभ्यास गर्नुहोस्
हरेक दिन ती कुराहरूमा प्रतिबिम्बित गर्न समय लिनुहोस् जसको लागि तपाई कृतज्ञ हुनुहुन्छ।

😊 7. सकारात्मक रहनुहोस्
नकारात्मक विचारहरू याद गर्नुहोस् र तिनीहरूलाई अधिक सन्तुलित, सहायक दृष्टिकोणहरूसँग पुनः फ्रेम गर्ने प्रयास गर्नुहोस्।

👥 8. सम्पर्कमा रहनुहोस्
साथी वा परिवारलाई सम्पर्क गर्नुहोस्। सामाजिक समर्थन भावनात्मक लचिलोपनको लागि प्रमुख हो।

अस्वीकरण: यो च्याटबोटले जानकारीमूलक समर्थन मात्र प्रदान गर्दछ र पेशेवर चिकित्सा सल्लाहको विकल्प होइन। चिकित्सा सम्बन्धी चिन्ताहरूका लागि सधैं तपाईंको स्वास्थ्य सेवा प्रदायकसँग परामर्श लिनुहोस्।

🔍 स्रोतहरू:
• <a href="https://www.nejm.org/doi/full/10.1056/NEJMcp1607649" target="_blank">प्रसवपछिको अवसादको बारेमा विस्तृत मार्गदर्शन - बेबी ब्लूज बनाम PPD, लक्षणहरू, कारणहरू, र उपचार (NEJM)</a>
• नेपाल राष्ट्रिय आत्महत्या रोकथाम हेल्पलाइन: 1166 (नेपाल टेलिकमबाट निःशुल्क)
• TPO नेपाल मानसिक स्वास्थ्य हेल्पलाइन: 1660-010-2005 (टोल-फ्री, बिहान 8 बजे-साँझ 6 बजेसम्म उपलब्ध)
• CMC-नेपाल मानसिक स्वास्थ्य परामर्श: +977-9847386158

नयाँ कुराकानीको लागि 'new' टाइप गर्नुहोस्।`;
                    }
                }
                break;
                
            case 'SYMPTOMS_QUESTION':
                // This case is kept as a fallback but we're bypassing it in the normal flow
                // Process response about symptoms and transition to the next state
                console.log("Processing symptoms input:", userMessage);
                
                // Store symptoms for potential future use
                localStorage.setItem('userSymptoms', userMessage);
                
                // Assess risk level based on symptoms
                const symptomRiskAssessment = assessRiskLevel(userMessage);
                console.log(`Risk assessment: ${symptomRiskAssessment.level} risk`);
                
                // Generate structured symptom report
                const symptomReport = generateSymptomReport(userMessage, symptomRiskAssessment);
                
                // Transition to USER_LED state
                conversationState = 'USER_LED';
                window.conversationState = conversationState;
                
                response = symptomReport;
                break;
                
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
                
            case 'AWAITING_CONTINUE':
                if (/^(continue|yes|y|yeah|yep|sure|ok|okay)$/i.test(userMessage)) {
                    conversationState = 'AWAITING_AGE';
                    window.conversationState = conversationState;
                    response = "To give you the best support, may I ask your age?";
                } else {
                    response = "Please type 'continue' or 'yes' to get started.";
                }
                break;
                
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
        
        // Check for number selections (1-5) that indicate possible depression
        // Extract numbers from the message
        const numberMatches = lowerMessage.match(/\b([1-5])\b/g);
        
        if (numberMatches && numberMatches.length > 0) {
            // Any selection of 1-5 indicates possible depression
            return {
                level: 'high',
                response: "Based on what you've shared, you may be experiencing postpartum depression. This is common and treatable. I recommend talking to your healthcare provider about these feelings. They can help determine if you would benefit from additional support or treatment."
            };
        }
        
        // Possible depression symptoms - may need professional support
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
        
        // Check for possible depression symptoms first (most important)
        for (const symptom of highRiskSymptoms) {
            if (lowerMessage.includes(symptom)) {
                return {
                    level: 'high',
                    response: "Based on what you've shared, you may be experiencing postpartum depression. This is common and treatable. I recommend talking to your healthcare provider about these feelings. They can help determine if you would benefit from additional support or treatment."
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
        
        // Determine condition based on timing
        const isLessThanTwoWeeks = localStorage.getItem('isLessThanTwoWeeks') === 'true';
        let conditionInfo = "";
        
        if (isLessThanTwoWeeks) {
            conditionInfo = "CONDITION: Possible Baby Blues\nBaby blues is a common condition affecting up to 80% of mothers in the first two weeks after birth. It typically resolves on its own with proper rest and support.";
        } else {
            conditionInfo = "CONDITION: Possible Postpartum Depression\nPostpartum depression affects about 15% of mothers beyond the initial two weeks after birth and typically requires treatment. It's important to discuss your symptoms with a healthcare provider.";
        }
        
        // Format the report
        return `
📋 POSTPARTUM ASSESSMENT REPORT 📋

🔍 REPORTED SYMPTOMS:
${symptoms.join("\n")}

⚠️ ASSESSMENT: ${riskAssessment.level === 'high' ? 'POSSIBLE DEPRESSION' : riskAssessment.level.toUpperCase()}
${riskAssessment.response}

⏱️ ${conditionInfo}

🔎 POSSIBLE CAUSES:
${causes.join("\n")}

💊 RECOMMENDED ACTIONS:
${treatment.join("\n")}

💗 SELF-CARE TIPS:
${selfCare.join("\n")}

You're taking an important step by seeking support. Remember that healing takes time, and you're doing a great job navigating this challenging period.

DISCLAIMER: This chatbot provides informational support only and is not a substitute for professional medical advice. Always consult with your healthcare provider for medical concerns.

🔍 RESOURCES:
• <a href="https://www.nejm.org/doi/full/10.1056/NEJMcp1607649" target="_blank">Comprehensive Guide to Postpartum Depression - Baby Blues vs. PPD, Symptoms, Causes, and Treatment (NEJM)</a>
• Nepal National Suicide Prevention Helpline: 1166 (free from Nepal Telecom)
• TPO Nepal Mental Health Helpline: 1660-010-2005 (toll-free, available 8AM-6PM)
• CMC-Nepal Mental Health Counseling: +977-9847386158

Type "new" for a new conversation.
`;
    }
    
    // Function to identify symptoms from user message
    function identifySymptoms(message) {
        const lowerMessage = message.toLowerCase();
        const symptoms = [];
        
        // Check for number-based selections for high-risk symptoms
        const numberMatches = lowerMessage.match(/\b([1-5])\b/g);
        
        // Map numbers to possible depression symptom descriptions
        const symptomMap = {
            '1': "• ⚠️ Thoughts about harming yourself or your baby",
            '2': "• ⚠️ Hallucinations or delusions",
            '3': "• ⚠️ Complete inability to sleep even when exhausted",
            '4': "• ⚠️ Extreme mood swings or rage episodes",
            '5': "• ⚠️ Disconnection or lack of interest in baby"
        };
        
        // Add possible depression symptoms based on number selections
        if (numberMatches && numberMatches.length > 0) {
            // Remove duplicates and sort
            const uniqueNumbers = [...new Set(numberMatches)].sort();
            
            for (const num of uniqueNumbers) {
                if (symptomMap[num]) {
                    symptoms.push(symptomMap[num]);
                }
            }
            
            // If number selections found, return just these symptoms
            if (symptoms.length > 0) {
                return symptoms;
            }
        }
        
        // If no number selections found, continue with text-based identification
        
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
        if (symptoms.some(s => /pain|discomfort|bleed|discharge|infection|fever/i.test(s))) {
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
        
        // Possible depression recommendations
        if (riskLevel === 'high') {
            treatment.push("• Important: Contact your healthcare provider to discuss your symptoms");
            treatment.push("• Consider discussing therapy or medication options with your doctor");
            treatment.push("• Call a support helpline: National Maternal Mental Health Hotline (1-833-943-5746)");
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
            // Reset conversation state to awaiting age state
            conversationState = 'AWAITING_AGE';
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
                addMessage("Hi, I'm MOM, your postpartum support companion. To give you the best support, may I ask your age?", false);
                
                // Set state to AWAITING_AGE - the next user message will be processed as age
                conversationState = 'AWAITING_AGE';
                window.conversationState = conversationState;
            }, 1000);
            
            return;
        }
        
        // Process message based on current state
        processUserMessage(userMessage);
    }

    // Helper: Convert Nepali (Bikram Sambat) date to Gregorian (AD)
    function bsToAd(bsYear, bsMonth, bsDay) {
        // Improved approximation for Bikram Sambat to Gregorian conversion
        // BS is generally 56-57 years ahead of AD depending on the month
        
        // Convert BS date to AD
        let adYear, adMonth, adDay;
        
        // Handle basic conversion - more accurate algorithm
        if (bsYear < 2000) {
            console.error("Invalid BS year: Must be 2000 or later");
            return null;
        }
        
        // Handle basic conversion - different offsets for different years
        // For years 2070-2099
        if (bsYear >= 2070 && bsYear < 2100) {
            adYear = bsYear - 57;  // More accurate for recent years
        } 
        // For years 2000-2069
        else if (bsYear >= 2000 && bsYear < 2070) {
            adYear = bsYear - 56;  // Different offset for earlier years
        } 
        else {
            adYear = bsYear - 57;  // Default offset
        }
        
        // Adjust for month differences (BS new year starts around mid-April)
        if (bsMonth < 9) {  // First 8 months of BS year (Baisakh to Mangshir)
            adMonth = bsMonth + 3;
            // No year adjustment needed
        } else {  // Last 4 months of BS year (Poush to Chaitra)
            adMonth = bsMonth - 9;
            adYear += 1;  // These correspond to next AD year
        }
        
        // Keep the day roughly the same, but make adjustments for month-end cases
        adDay = bsDay;
        
        // Boundary adjustments
        if (adMonth === 0) {
            adMonth = 12;
            adYear -= 1;
        }
        
        // Adjust days for months with fewer than 31 days
        if (adDay > 28) {
            // February special case
            if (adMonth === 2) {
                const isLeapYear = (adYear % 4 === 0 && adYear % 100 !== 0) || (adYear % 400 === 0);
                adDay = Math.min(adDay, isLeapYear ? 29 : 28);
            }
            // 30-day months
            else if ([4, 6, 9, 11].includes(adMonth)) {
                adDay = Math.min(adDay, 30);
            }
        }
        
        console.log(`Converting BS ${bsYear}-${bsMonth}-${bsDay} to AD ${adYear}-${adMonth}-${adDay}`);
        
        // Additional debug information
        if (window.chatbotDebugMode) {
            console.log(`Conversion details:
            - Input BS date: ${bsYear}/${bsMonth}/${bsDay}
            - Calculated AD date: ${adYear}/${adMonth}/${adDay}
            - Adjustment logic:
              * Year offset: ${bsYear - adYear} years
              * Month mapping: BS month ${bsMonth} → AD month ${adMonth}
              * Day adjustment: ${bsDay === adDay ? 'None' : `${bsDay} → ${adDay}`}`);
        }
        
        // Create and return JS Date object (with local timezone)
        return new Date(adYear, adMonth - 1, adDay);
    }
}); 