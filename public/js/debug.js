// Debug script to check form elements
document.addEventListener('DOMContentLoaded', () => {
  console.log('DEBUG: Document loaded');
  
  // Check chat form
  const chatForm = document.getElementById('chat-form');
  console.log('DEBUG: Chat form found:', !!chatForm);
  
  // Check message input
  const messageInput = document.getElementById('message-input');
  console.log('DEBUG: Message input found:', !!messageInput);
  
  if (messageInput) {
    console.log('DEBUG: Message input styles:', {
      display: window.getComputedStyle(messageInput).display,
      visibility: window.getComputedStyle(messageInput).visibility,
      width: window.getComputedStyle(messageInput).width,
      height: window.getComputedStyle(messageInput).height
    });
    
    // Force visibility and styling
    messageInput.style.display = 'block';
    messageInput.style.visibility = 'visible';
    messageInput.style.width = 'calc(100% - 60px)';
    messageInput.style.minHeight = '45px';
    messageInput.style.maxHeight = '45px';
    messageInput.style.backgroundColor = '#ffffff';
    messageInput.style.border = '2px solid #d1d5db';
    messageInput.style.borderRadius = '20px';
    messageInput.style.padding = '0.8rem 1rem';
    messageInput.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    messageInput.style.color = '#333';
    messageInput.style.fontWeight = '500';
    
    // Add focus handler
    messageInput.addEventListener('focus', () => {
      console.log('DEBUG: Input focused');
      messageInput.style.borderColor = 'var(--primary-color)';
      messageInput.style.boxShadow = '0 0 0 3px rgba(108, 99, 255, 0.2)';
    });
    
    // Add blur handler
    messageInput.addEventListener('blur', () => {
      console.log('DEBUG: Input blurred');
      messageInput.style.borderColor = '#d1d5db';
      messageInput.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    });
    
    // Add click handler
    messageInput.addEventListener('click', () => {
      console.log('DEBUG: Input clicked');
    });
  }
  
  // Check chat interface
  const chatInterface = document.getElementById('chat-interface');
  console.log('DEBUG: Chat interface found:', !!chatInterface);
  
  if (chatInterface) {
    console.log('DEBUG: Chat interface styles:', {
      display: window.getComputedStyle(chatInterface).display,
      flexDirection: window.getComputedStyle(chatInterface).flexDirection,
      height: window.getComputedStyle(chatInterface).height
    });
    
    // Force display for chat interface
    chatInterface.style.display = 'flex';
    chatInterface.style.flexDirection = 'column';
    chatInterface.style.flex = '1';
    chatInterface.style.position = 'relative';
    chatInterface.style.width = '100%';
    chatInterface.style.maxWidth = '100%';
    chatInterface.style.overflow = 'hidden';
  }
  
  // Check chat container
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) {
    console.log('DEBUG: Chat container styles:', {
      height: window.getComputedStyle(chatContainer).height,
      paddingBottom: window.getComputedStyle(chatContainer).paddingBottom,
      position: window.getComputedStyle(chatContainer).position
    });
    
    // Force styles for chat container to prevent overlap
    chatContainer.style.overflowY = 'auto';
    chatContainer.style.flex = '1';
  }
  
  // Check input wrapper
  const inputWrapper = document.querySelector('.input-wrapper');
  if (inputWrapper) {
    console.log('DEBUG: Input wrapper found:', !!inputWrapper);
    
    // Force styles for input wrapper
    inputWrapper.style.width = '100%';
    inputWrapper.style.backgroundColor = '#f8f9fa';
    inputWrapper.style.borderTop = '2px solid var(--border-light)';
    inputWrapper.style.position = 'relative';
    inputWrapper.style.zIndex = '100';
    inputWrapper.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.05)';
    inputWrapper.style.minHeight = '80px';
    inputWrapper.style.maxHeight = '80px';
  }
  
  // Check input container
  const inputContainer = document.querySelector('.input-container');
  console.log('DEBUG: Input container found:', !!inputContainer);
  
  if (inputContainer) {
    console.log('DEBUG: Input container styles:', {
      display: window.getComputedStyle(inputContainer).display,
      padding: window.getComputedStyle(inputContainer).padding,
      position: window.getComputedStyle(inputContainer).position
    });
    
    // Force styles for input container
    inputContainer.style.display = 'flex';
    inputContainer.style.padding = '1rem';
    inputContainer.style.position = 'relative';
    inputContainer.style.width = '100%';
    inputContainer.style.maxWidth = '1200px';
    inputContainer.style.margin = '0 auto';
    inputContainer.style.height = '100%';
    inputContainer.style.alignItems = 'center';
    inputContainer.style.backgroundColor = 'transparent';
    inputContainer.style.borderTop = 'none';
  }
}); 