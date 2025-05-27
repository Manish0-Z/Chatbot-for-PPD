// Chatbot functionality
document.addEventListener('DOMContentLoaded', () => {
  // Reference UI elements
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Postpartum depression questionnaire flow
  const questionnaire = [
    "Hello! Welcome to our postpartum support chat. I'm here to help assess your postpartum health. How are you feeling today?", // Greeting
    "Could you please share your age with me?", // Age question
    "How many weeks or months have passed since you gave birth?", // Postpartum timeframe
    "Have you been experiencing any symptoms or problems that might be related to postpartum depression? Please describe them in detail." // Symptoms
  ];
  
  // Questionnaire state
  let isQuestionnaireActive = false;
  let currentQuestionIndex = 0;
  let userResponses = {};
  
  // Make variables global for access from other scripts
  window.questionnaire = questionnaire;
  window.isQuestionnaireActive = isQuestionnaireActive;
  window.currentQuestionIndex = currentQuestionIndex;
  window.userResponses = userResponses;
  window.handleQuestionnaireResponse = handleQuestionnaireResponse;
  
  // Handle form submission
  if (chatForm) {
    chatForm.addEventListener('submit', sendMessage);
  }
  
  // Handle textarea Enter key (submit) and Shift+Enter (new line)
  if (messageInput) {
    // Auto-resize textarea as user types
    messageInput.addEventListener('input', function() {
      // Store the current scroll position
      const scrollPos = this.scrollTop;
      
      // Reset height to auto to calculate new height
      this.style.height = 'auto';
      
      // Calculate new height with limits (min 45px, max 120px)
      const newHeight = Math.min(Math.max(this.scrollHeight, 45), 120);
      this.style.height = newHeight + 'px';
      
      // Restore scroll position
      this.scrollTop = scrollPos;
      
      // If textarea has content, enhance the border
      if (this.value.trim().length > 0) {
        this.style.borderColor = '#a0aec0';
      } else {
        this.style.borderColor = '#d1d5db';
      }
    });
    
    // Handle Enter key to submit, Shift+Enter for new line
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        // Only submit if there's content
        if (this.value.trim().length > 0) {
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
    });
    
    // Focus the input field by default
    setTimeout(() => {
      messageInput.focus();
    }, 500);
  }
  
  // Set up close button for history panel
  const closeHistoryBtn = document.getElementById('history-close-btn');
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
      const historyPanel = document.getElementById('chat-history-panel');
      const historyBtn = document.getElementById('history-btn');
      
      if (historyPanel) {
        historyPanel.style.display = 'none';
      }
      
      if (historyBtn) {
        historyBtn.classList.remove('active');
      }
    });
  }
  
  // Always show chat interface, don't require authentication
  showChatInterface();

  // Initialize chat controls
  initializeChatControls();
  
  // Try to load conversation history or start a new one
  const currentChatHistory = getChatHistory();
  if (currentChatHistory && currentChatHistory.messages && currentChatHistory.messages.length > 0) {
    // Load existing conversation
    loadChatHistory(currentChatHistory);
  } else {
    // Clear any existing session to ensure a fresh start when no history
    localStorage.removeItem('chatSessionId');
    console.log('[DEBUG] Cleared existing session ID at page load');
    
    // Start the postpartum questionnaire automatically
    startPostpartumQuestionnaire();
  }
});

// Function to start the postpartum questionnaire
function startPostpartumQuestionnaire() {
  // Reset questionnaire state
  isQuestionnaireActive = true;
  currentQuestionIndex = 0;
  userResponses = {};
  
  // Update global variables
  window.isQuestionnaireActive = isQuestionnaireActive;
  window.currentQuestionIndex = currentQuestionIndex;
  window.userResponses = userResponses;
  
  // Clear any existing messages
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
  
  // Focus the input field
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    setTimeout(() => {
      messageInput.focus();
    }, 500);
  }
  
  // Ask first question immediately
  addBotMessage(questionnaire[currentQuestionIndex]);
}

// Initialize chat controls like new chat and history buttons
function initializeChatControls() {
  // New chat button
  const newChatBtn = document.getElementById('new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
    console.log('[DEBUG] New chat button initialized');
  } else {
    console.log('[DEBUG] New chat button not found');
  }
  
  // History button
  const historyBtn = document.getElementById('history-btn');
  if (historyBtn) {
    historyBtn.addEventListener('click', toggleChatHistory);
    console.log('[DEBUG] History button initialized');
  } else {
    console.log('[DEBUG] History button not found');
  }
  
  // History close button
  const closeHistoryBtn = document.getElementById('history-close-btn');
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
      const historyPanel = document.getElementById('chat-history-panel');
      const historyBtn = document.getElementById('history-btn');
      
      if (historyPanel) {
        historyPanel.style.display = 'none';
      }
      
      if (historyBtn) {
        historyBtn.classList.remove('active');
      }
    });
    console.log('[DEBUG] History close button initialized');
  }
}

// Generate a unique ID for each chat
function generateChatId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Start a new chat conversation
function startNewChat() {
  // Clear chat display
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
  
  // Clear session ID
  localStorage.removeItem('chatSessionId');
  localStorage.removeItem('currentChatId');
  
  // Start the postpartum questionnaire
  startPostpartumQuestionnaire();
  
  // Create a new chat history
  const newChat = {
    id: generateChatId(),
    title: "Postpartum Screening",
    createdAt: new Date().toISOString(),
    messages: [{
      role: 'assistant',
      content: questionnaire[0], // First question as the initial message
      timestamp: new Date().toISOString()
    }]
  };
  
  // Save the new chat
  saveChatHistory(newChat);
  
  // Close history panel if open
  const historyPanel = document.getElementById('chat-history-panel');
  if (historyPanel && historyPanel.style.display === 'block') {
    historyPanel.style.display = 'none';
    
    // Remove active class from history button
    const historyBtn = document.getElementById('history-btn');
    if (historyBtn) {
      historyBtn.classList.remove('active');
    }
  }
  
  // Briefly highlight the new chat button
  const newChatBtn = document.getElementById('new-chat-btn');
  if (newChatBtn) {
    newChatBtn.classList.add('active');
    setTimeout(() => {
      newChatBtn.classList.remove('active');
    }, 500);
  }
}

// Toggle chat history panel
function toggleChatHistory() {
  const historyPanel = document.getElementById('chat-history-panel');
  const historyBtn = document.getElementById('history-btn');
  
  if (!historyPanel) return;
  
  if (historyPanel.style.display === 'none' || !historyPanel.style.display) {
    // Show and populate history panel
    historyPanel.style.display = 'block';
    populateChatHistory();
    
    // Add active class to history button
    if (historyBtn) {
      historyBtn.classList.add('active');
    }
  } else {
    // Hide panel
    historyPanel.style.display = 'none';
    
    // Remove active class from history button
    if (historyBtn) {
      historyBtn.classList.remove('active');
    }
  }
}

// Populate chat history panel with saved chats
function populateChatHistory() {
  const historyList = document.getElementById('chat-history-list');
  if (!historyList) return;
  
  // Clear existing items
  historyList.innerHTML = '';
  
  // Get all saved chats
  const allChats = getAllChatHistories();
  
  if (allChats && allChats.length > 0) {
    // Sort by most recent first
    allChats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add each chat to the list
    allChats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-history-item';
      
      // Extract first message for preview
      let previewText = "Empty conversation";
      if (chat.messages && chat.messages.length > 0) {
        // Find first user message for better context, or use first message
        const userMessage = chat.messages.find(m => m.role === 'user');
        if (userMessage) {
          previewText = userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : '');
        } else {
          previewText = chat.messages[0].content.substring(0, 30) + (chat.messages[0].content.length > 30 ? '...' : '');
        }
      }
      
      // Format date
      const date = new Date(chat.createdAt);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      chatItem.innerHTML = `
        <div class="chat-history-title">${chat.title || "Conversation"}</div>
        <div class="chat-history-preview">${escapeHTML(previewText)}</div>
        <div class="chat-history-date">${formattedDate}</div>
        <div class="chat-history-actions">
          <button class="load-chat-btn" data-id="${chat.id}"><i class="fas fa-arrow-right"></i></button>
          <button class="delete-chat-btn" data-id="${chat.id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      historyList.appendChild(chatItem);
    });
    
    // Add event listeners to buttons
    const loadButtons = historyList.querySelectorAll('.load-chat-btn');
    loadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const chatId = btn.getAttribute('data-id');
        loadChatById(chatId);
      });
    });
    
    const deleteButtons = historyList.querySelectorAll('.delete-chat-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chatId = btn.getAttribute('data-id');
        deleteChatHistory(chatId);
        // Refresh the history panel
        populateChatHistory();
      });
    });
  } else {
    // No chats found
    historyList.innerHTML = '<div class="no-history">No conversation history found</div>';
  }
}

// Load a specific chat by ID
function loadChatById(chatId) {
  const chat = getChatHistoryById(chatId);
  if (chat) {
    loadChatHistory(chat);
    
    // Close history panel
    const historyPanel = document.getElementById('chat-history-panel');
    const historyBtn = document.getElementById('history-btn');
    
    if (historyPanel) {
      historyPanel.style.display = 'none';
    }
    
    if (historyBtn) {
      historyBtn.classList.remove('active');
    }
  }
}

// Load a chat history into the chat window
function loadChatHistory(chatHistory) {
  if (!chatHistory || !chatHistory.messages) return;
  
  // Clear current chat
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
  
  // Set as current chat
  localStorage.setItem('currentChatId', chatHistory.id);
  
  // Load all messages
  chatHistory.messages.forEach(message => {
    if (message.role === 'user') {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message user-message';
      
      // Always use user icon for user avatar
      const avatarContent = `
        <div class="message-avatar user-avatar">
          <span class="default-avatar"><i class="fas fa-user"></i></span>
        </div>
      `;
      
      // Create message content
      messageEl.innerHTML = `
        ${avatarContent}
        <div class="message-content">
          <div class="message-text">${escapeHTML(message.content)}</div>
        </div>
      `;
      
      chatMessages.appendChild(messageEl);
    } else if (message.role === 'assistant') {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message bot-message';
      
      messageEl.innerHTML = `
        <div class="message-avatar bot-avatar">
          <i class="fas fa-heart"></i>
        </div>
        <div class="message-content">
          <div class="message-text">${formatBotMessage(message.content)}</div>
        </div>
      `;
      
      chatMessages.appendChild(messageEl);
    }
  });
  
  // Scroll to bottom
  scrollToBottom();
  
  // Set session ID if available in the chat history
  if (chatHistory.sessionId) {
    setSessionId(chatHistory.sessionId);
  }
}

// Session management
function getSessionId() {
  // Try to get session ID from localStorage
  let sessionId = localStorage.getItem('chatSessionId');
  console.log('[DEBUG] Getting session ID from storage:', sessionId);
  return sessionId;
}

function setSessionId(sessionId) {
  // Store the session ID in localStorage
  console.log('[DEBUG] Setting session ID in storage:', sessionId);
  localStorage.setItem('chatSessionId', sessionId);
  
  // Also update current chat history with session ID
  const currentChatId = localStorage.getItem('currentChatId');
  if (currentChatId) {
    const chat = getChatHistoryById(currentChatId);
    if (chat) {
      chat.sessionId = sessionId;
      updateChatHistory(chat);
    }
  }
}

// Function to get all chat histories
function getAllChatHistories() {
  try {
    const savedChats = localStorage.getItem('savedChats');
    if (savedChats) {
      return JSON.parse(savedChats);
    }
    return [];
  } catch (error) {
    console.error('[DEBUG] Error retrieving chat histories:', error);
    return [];
  }
}

// Function to get a specific chat history by ID
function getChatHistoryById(chatId) {
  const allChats = getAllChatHistories();
  return allChats.find(chat => chat.id === chatId);
}

// Function to get current chat history
function getChatHistory() {
  const currentChatId = localStorage.getItem('currentChatId');
  if (currentChatId) {
    return getChatHistoryById(currentChatId);
  }
  return null;
}

// Function to save a chat history
function saveChatHistory(chatHistory) {
  if (!chatHistory || !chatHistory.id) return;
  
  try {
    // Set as current chat
    localStorage.setItem('currentChatId', chatHistory.id);
    
    // Add to saved chats
    const allChats = getAllChatHistories();
    
    // Check if this chat already exists
    const existingIndex = allChats.findIndex(chat => chat.id === chatHistory.id);
    if (existingIndex >= 0) {
      // Update existing chat
      allChats[existingIndex] = chatHistory;
    } else {
      // Add new chat
      allChats.push(chatHistory);
    }
    
    // Save all chats
    localStorage.setItem('savedChats', JSON.stringify(allChats));
  } catch (error) {
    console.error('[DEBUG] Error saving chat history:', error);
  }
}

// Function to update an existing chat history
function updateChatHistory(chatHistory) {
  if (!chatHistory || !chatHistory.id) return;
  
  const allChats = getAllChatHistories();
  const existingIndex = allChats.findIndex(chat => chat.id === chatHistory.id);
  
  if (existingIndex >= 0) {
    allChats[existingIndex] = chatHistory;
    localStorage.setItem('savedChats', JSON.stringify(allChats));
  }
}

// Function to add a message to current chat history
function addMessageToHistory(role, content) {
  const currentChatId = localStorage.getItem('currentChatId');
  if (!currentChatId) return;
  
  const chat = getChatHistoryById(currentChatId);
  if (chat) {
    if (!chat.messages) {
      chat.messages = [];
    }
    
    chat.messages.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    // Update first user message as title if it's the first
    if (role === 'user' && !chat.hasUserMessage) {
      chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      chat.hasUserMessage = true;
    }
    
    updateChatHistory(chat);
  }
}

// Function to delete a chat history
function deleteChatHistory(chatId) {
  const allChats = getAllChatHistories();
  const updatedChats = allChats.filter(chat => chat.id !== chatId);
  localStorage.setItem('savedChats', JSON.stringify(updatedChats));
  
  // If current chat was deleted, clear current chat ID
  const currentChatId = localStorage.getItem('currentChatId');
  if (currentChatId === chatId) {
    localStorage.removeItem('currentChatId');
  }
}

// Function to show chat interface without requiring authentication
function showChatInterface() {
  const chatInterface = document.getElementById('chat-interface');
  const authPrompt = document.getElementById('auth-prompt');
  
  if (chatInterface) {
    chatInterface.style.display = 'flex';
    chatInterface.style.flexDirection = 'column';
  }
  
  if (authPrompt) {
    authPrompt.style.display = 'none';
  }
  
  // Show personalized greeting if user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const userGreeting = document.getElementById('user-greeting');
    
    if (userGreeting && userInfo.firstName) {
      userGreeting.innerHTML = `Hi <strong>${userInfo.firstName}</strong>! How are you feeling today? How can I help you?`;
    }
  } else {
    // Show generic greeting for non-logged in users
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
      userGreeting.innerHTML = `Hi there! How are you feeling today? How can I help you?`;
    }
  }
}

// Function to send message to server
async function sendMessage(e) {
  e.preventDefault();
  
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  try {
    // Add user message to UI
    addUserMessage(message);
    
    // Add message to history
    addMessageToHistory('user', message);
    
    // Clear input
    messageInput.value = '';
    // Reset height of textarea
    messageInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Check if we're in the questionnaire flow
    if (isQuestionnaireActive) {
      // Process questionnaire response
      handleQuestionnaireResponse(message);
    } else {
      // Normal chatbot flow - send to server
      await sendMessageToServer(message);
    }
  } catch (error) {
    console.error('[DEBUG] Chat error:', error);
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Show error message
    addBotMessage('Sorry, I encountered an error processing your message. Please try again.');
    
    // Add error message to history
    addMessageToHistory('assistant', 'Sorry, I encountered an error processing your message. Please try again.');
  }
}

// Function to handle questionnaire responses
function handleQuestionnaireResponse(message) {
  // Store user response
  const questionKey = ['greeting', 'age', 'postpartumTime', 'symptoms'][currentQuestionIndex];
  userResponses[questionKey] = message;
  
  // Move to next question
  currentQuestionIndex++;
  
  // Remove typing indicator after a short delay
  setTimeout(() => {
    hideTypingIndicator();
    
    // If we have more questions, ask the next one
    if (currentQuestionIndex < questionnaire.length) {
      addBotMessage(questionnaire[currentQuestionIndex]);
    } else {
      // Generate and display the final report
      generateQuestionnaireReport();
      
      // End questionnaire mode
      isQuestionnaireActive = false;
    }
  }, 1000);
}

// Function to generate the questionnaire report
function generateQuestionnaireReport() {
  // Analyze symptoms to provide personalized feedback
  const symptoms = userResponses.symptoms.toLowerCase();
  
  // Identify potential PPD indicators
  const possiblePPD = 
    symptoms.includes('sad') || 
    symptoms.includes('depress') || 
    symptoms.includes('anxious') || 
    symptoms.includes('anxiety') || 
    symptoms.includes('overwhelm') || 
    symptoms.includes('cry') ||
    symptoms.includes('sleep') ||
    symptoms.includes('appetite') ||
    symptoms.includes('interest') ||
    symptoms.includes('hopeless') ||
    symptoms.includes('guilt') ||
    symptoms.includes('worthless');
  
  // Determine risk level based on symptoms
  let causes = "";
  let treatmentPlan = "";
  
  if (possiblePPD) {
    causes = `
      <div class="report-section">
        <strong>Potential Causes:</strong><br>
        Based on your description, your symptoms may be related to postpartum depression (PPD). PPD can be caused by:
        <ul>
          <li>Hormonal changes following childbirth</li>
          <li>Physical exhaustion and sleep deprivation</li>
          <li>Emotional factors related to adjusting to parenthood</li>
          <li>Personal or family history of depression or anxiety</li>
          <li>Lack of social support or relationship stress</li>
        </ul>
      </div>
    `;
    
    treatmentPlan = `
      <div class="report-section">
        <strong>Recommended Treatment Plan:</strong><br>
        <ul>
          <li><strong>Professional Support:</strong> Schedule an appointment with your healthcare provider within the next week for a comprehensive evaluation</li>
          <li><strong>Therapy Options:</strong> Consider cognitive behavioral therapy (CBT) or interpersonal therapy, which are highly effective for PPD</li>
          <li><strong>Medication:</strong> Your doctor may recommend antidepressants that are safe during breastfeeding if appropriate</li>
          <li><strong>Support Groups:</strong> Connect with local or online postpartum support groups to share experiences with others</li>
          <li><strong>Self-Care:</strong> Prioritize sleep when possible, accept help from others, and try to get 15-30 minutes of light exercise daily</li>
        </ul>
      </div>
    `;
  } else {
    causes = `
      <div class="report-section">
        <strong>Understanding Your Experience:</strong><br>
        The adjustment period after childbirth can be challenging. Your described symptoms might be related to:
        <ul>
          <li>Normal postpartum adjustment ("baby blues")</li>
          <li>Sleep deprivation and physical recovery</li>
          <li>Adapting to new responsibilities and routines</li>
        </ul>
      </div>
    `;
    
    treatmentPlan = `
      <div class="report-section">
        <strong>Wellness Recommendations:</strong><br>
        <ul>
          <li><strong>Rest:</strong> Try to sleep when your baby sleeps</li>
          <li><strong>Support:</strong> Don't hesitate to ask family and friends for help with daily tasks</li>
          <li><strong>Connection:</strong> Join a new parents' group to build your support network</li>
          <li><strong>Self-care:</strong> Take short breaks for activities you enjoy</li>
          <li><strong>Monitoring:</strong> Keep track of your mood and energy levels</li>
        </ul>
      </div>
    `;
  }
  
  const report = `
    <h3>Postpartum Assessment Report</h3>
    
    <div class="report-section">
      <strong>Your Responses:</strong>
      <ul>
        <li><strong>How you're feeling:</strong> "${escapeHTML(userResponses.greeting)}"</li>
        <li><strong>Age:</strong> ${escapeHTML(userResponses.age)}</li>
        <li><strong>Time Since Birth:</strong> ${escapeHTML(userResponses.postpartumTime)}</li>
        <li><strong>Symptoms Described:</strong> "${escapeHTML(userResponses.symptoms)}"</li>
      </ul>
    </div>
    
    ${causes}
    
    ${treatmentPlan}
  `;
  
  addBotMessage(report);
  
  // End questionnaire mode
  isQuestionnaireActive = false;
  window.isQuestionnaireActive = false;
  
  // Focus the input field
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    setTimeout(() => {
      messageInput.focus();
    }, 500);
  }
}

// Function to send message to server
async function sendMessageToServer(message) {
  // Get token if user is logged in
  const token = localStorage.getItem('token');
  
  // Get session ID for conversation tracking
  const sessionId = getSessionId();
  
  console.log('[DEBUG] Using session ID for request:', sessionId);
  
  // Call API - with token if logged in, without if anonymous
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['x-auth-token'] = token;
  }
  
  // Always include session ID header, can be null for first request
  headers['x-session-id'] = sessionId;
  console.log('[DEBUG] Request headers:', headers);
  
  const response = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ message })
  });
  
  const data = await response.json();
  console.log('[DEBUG] Response data:', data);
  
  // Hide typing indicator
  hideTypingIndicator();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send message');
  }
  
  // Always store session ID for future requests
  if (data.sessionId) {
    setSessionId(data.sessionId);
    console.log('[DEBUG] Stored session ID from response:', data.sessionId);
  }
  
  // Add bot response to UI
  addBotMessage(data.response);
  
  // Add response to history
  addMessageToHistory('assistant', data.response);
  
  // Scroll to bottom
  scrollToBottom();
}

// Function to add user message to chat
function addUserMessage(message) {
  const chatMessages = document.getElementById('chat-messages');
  
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'chat-message user-message';
  
  // Always use user icon for user avatar
  const avatarContent = `
    <div class="message-avatar user-avatar">
      <span class="default-avatar"><i class="fas fa-user"></i></span>
    </div>
  `;
  
  // Create message content
  messageContainer.innerHTML = `
    ${avatarContent}
    <div class="message-content">
      <div class="message-text">${escapeHTML(message)}</div>
    </div>
  `;
  
  // Add to chat
  chatMessages.appendChild(messageContainer);
  
  // Scroll to bottom
  scrollToBottom();
}

// Function to add bot message to chat
function addBotMessage(message) {
  const chatMessages = document.getElementById('chat-messages');
  
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'chat-message bot-message';
  
  // Create message content with formatted text
  messageContainer.innerHTML = `
    <div class="message-avatar bot-avatar">
      <i class="fas fa-heart"></i>
    </div>
    <div class="message-content">
      <div class="message-text">${formatBotMessage(message)}</div>
    </div>
  `;
  
  // Add to chat
  chatMessages.appendChild(messageContainer);
  
  // Scroll to bottom
  scrollToBottom();
}

// Function to show typing indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  
  // Create typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-message bot-message typing-indicator';
  typingIndicator.id = 'typing-indicator';
  
  // Create typing indicator content
  typingIndicator.innerHTML = `
    <div class="message-avatar bot-avatar">
      <i class="fas fa-heart"></i>
    </div>
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  // Add to chat
  chatMessages.appendChild(typingIndicator);
  
  // Scroll to bottom
  scrollToBottom();
}

// Function to hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Function to scroll to bottom of chat
function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    // Add a small delay to make sure all content is rendered
    setTimeout(() => {
      // Scroll to the bottom of the container
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }
}

// Function to format bot message
function formatBotMessage(message) {
  // Check if message already contains HTML tags (like in the report)
  if (message.includes('<div') || message.includes('<h3') || message.includes('<ul')) {
    // Message already has HTML formatting, return as is
    return message;
  }
  
  // For plain text messages, apply standard formatting
  // Replace newlines with <br>
  let formattedMessage = escapeHTML(message).replace(/\n/g, '<br>');
   
  // Style bullet points
  formattedMessage = formattedMessage.replace(/•\s(.*?)(<br>|$)/g, '<div class="bullet-point"><span class="bullet">•</span> $1</div>');
   
  return formattedMessage;
}

// Function to format time
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Function to escape HTML
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(match) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}

// Add suggested messages functionality if buttons exist
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggested-message')) {
    const message = e.target.dataset.message;
    if (message) {
      // Set message in input
      const messageInput = document.getElementById('message-input');
      messageInput.value = message;
      
      // Focus input
      messageInput.focus();
      
      // Optionally, submit the form automatically
      // document.getElementById('chat-form').dispatchEvent(new Event('submit'));
    }
  }
});

 