// Authentication related functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  checkAuth();

  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Handle signup form submission
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Handle logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// Function to check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('token');
  
  // Update UI based on authentication status
  updateAuthUI(!!token);
  
  if (token) {
    // Fetch user info and update UI
    fetchUserInfo();
  }
}

// Function to update UI based on authentication status
function updateAuthUI(isLoggedIn) {
  // Get UI elements
  const loginBtns = document.querySelectorAll('.login-btn');
  const signupBtns = document.querySelectorAll('.signup-btn');
  const profilePics = document.querySelectorAll('.profile-pic');
  
  if (isLoggedIn) {
    // User is logged in - hide login/signup buttons, show profile
    loginBtns.forEach(btn => btn.style.display = 'none');
    signupBtns.forEach(btn => btn.style.display = 'none');
    profilePics.forEach(pic => pic.style.display = 'block');
    
    // Update profile picture
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    updateProfilePicture(user);
  } else {
    // User is not logged in - show login/signup buttons, hide profile
    loginBtns.forEach(btn => btn.style.display = 'inline-block');
    signupBtns.forEach(btn => btn.style.display = 'inline-block');
    profilePics.forEach(pic => pic.style.display = 'none');
  }
  
  // Initialize the profile dropdown menu if logged in
  if (isLoggedIn) {
    setupProfileMenu();
  }
}

// Function to set up the profile menu dropdown
function setupProfileMenu() {
  const profilePics = document.querySelectorAll('.profile-pic');
  
  profilePics.forEach(pic => {
    pic.onclick = function(e) {
      e.stopPropagation();
      
      // Remove any existing dropdown
      const existingDropdown = document.querySelector('.profile-dropdown');
      if (existingDropdown) {
        existingDropdown.remove();
      }
      
      // Create dropdown
      const dropdown = document.createElement('div');
      dropdown.className = 'profile-dropdown';
      dropdown.style.position = 'absolute';
      dropdown.style.top = (pic.offsetTop + pic.offsetHeight + 5) + 'px';
      dropdown.style.right = '20px';
      dropdown.style.backgroundColor = 'white';
      dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      dropdown.style.borderRadius = '8px';
      dropdown.style.padding = '8px 0';
      dropdown.style.zIndex = '100';
      dropdown.style.minWidth = '200px';
      
      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Add user info
      dropdown.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 4px;">${user.firstName || ''} ${user.lastName || ''}</div>
          <div style="font-size: 0.9em; color: #666;">${user.email || ''}</div>
        </div>
        <a href="#" id="logout-btn" style="display: block; padding: 10px 16px; color: #ff5555; text-decoration: none; cursor: pointer;">
          <i class="fas fa-sign-out-alt"></i> Logout
        </a>
      `;
      
      // Add to document
      document.body.appendChild(dropdown);
      
      // Add click event for logout
      document.getElementById('logout-btn').addEventListener('click', handleLogout);
      
      // Add hover effect to dropdown menu items
      const menuItems = dropdown.querySelectorAll('a');
      menuItems.forEach(item => {
        item.addEventListener('mouseover', () => {
          item.style.backgroundColor = '#f5f5f5';
        });
        item.addEventListener('mouseout', () => {
          item.style.backgroundColor = 'transparent';
        });
      });
      
      // Close dropdown when clicking outside
      window.onclick = function() {
        dropdown.remove();
        window.onclick = null;
      };
    };
  });
}

// Function to handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  // Reset error messages
  clearErrorMessages();
  
  // Get form data
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Basic validation
  let isValid = true;
  
  if (!email) {
    displayError('email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    displayError('email-error', 'Please enter a valid email');
    isValid = false;
  }
  
  if (!password) {
    displayError('password-error', 'Password is required');
    isValid = false;
  }
  
  if (!isValid) return;
  
  try {
    // Show loading state
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;
    
    // Make API request
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update UI
    updateAuthUI(true);
    
    // Get redirect URL from query params or default to home
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/';
    
    // Redirect user
    window.location.href = redirectUrl;
  } catch (error) {
    // Display error
    displayError('login-error', error.message || 'Failed to sign in. Please try again.');
    
    // Reset button
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
}

// Function to handle signup form submission
async function handleSignup(e) {
  e.preventDefault();
  
  // Reset error messages
  clearErrorMessages();
  
  // Get form data
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const phoneNumber = document.getElementById('phoneNumber')?.value || '';
  
  // Basic validation
  let isValid = true;
  
  if (!firstName) {
    displayError('firstName-error', 'First name is required');
    isValid = false;
  }
  
  if (!lastName) {
    displayError('lastName-error', 'Last name is required');
    isValid = false;
  }
  
  if (!username) {
    displayError('username-error', 'Username is required');
    isValid = false;
  } else if (username.length < 3) {
    displayError('username-error', 'Username must be at least 3 characters');
    isValid = false;
  }
  
  if (!email) {
    displayError('email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    displayError('email-error', 'Please enter a valid email');
    isValid = false;
  }
  
  if (!password) {
    displayError('password-error', 'Password is required');
    isValid = false;
  } else if (password.length < 6) {
    displayError('password-error', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (!confirmPassword) {
    displayError('confirmPassword-error', 'Please confirm your password');
    isValid = false;
  } else if (password !== confirmPassword) {
    displayError('confirmPassword-error', 'Passwords do not match');
    isValid = false;
  }
  
  if (!isValid) return;
  
  try {
    // Show loading state
    const submitBtn = document.querySelector('#signup-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;
    
    // Make API request
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        password,
        phoneNumber
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Store token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update UI
    updateAuthUI(true);
    
    // Redirect user
    window.location.href = '/';
  } catch (error) {
    // Display error
    displayError('signup-error', error.message || 'Failed to create account. Please try again.');
    
    // Reset button
    const submitBtn = document.querySelector('#signup-form button[type="submit"]');
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
}

// Function to handle logout
function handleLogout(e) {
  e.preventDefault();
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Update UI
  updateAuthUI(false);
  
  // Redirect to home
  window.location.href = '/';
}

// Function to fetch user info
async function fetchUserInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const response = await fetch('/api/auth/user', {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      // If unauthorized, clear storage and redirect
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateAuthUI(false);
        window.location.reload();
      }
      return;
    }
    
    const data = await response.json();
    
    // Update user info in local storage
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update profile picture
    updateProfilePicture(data.user);
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

// Function to update profile picture
function updateProfilePicture(user) {
  const profilePics = document.querySelectorAll('.profile-pic');
  
  if (user && user.firstName) {
    // Get user initials for the profile picture
    const initials = `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`;
    
    // Update each profile picture container with initials
    profilePics.forEach(pic => {
      // Clear any existing content
      pic.innerHTML = '';
      
      // Create initials display
      const initialsDiv = document.createElement('div');
      initialsDiv.style.width = '100%';
      initialsDiv.style.height = '100%';
      initialsDiv.style.display = 'flex';
      initialsDiv.style.alignItems = 'center';
      initialsDiv.style.justifyContent = 'center';
      initialsDiv.style.color = 'white';
      initialsDiv.style.fontWeight = 'bold';
      initialsDiv.style.fontSize = '16px';
      initialsDiv.textContent = initials.toUpperCase();
      
      pic.appendChild(initialsDiv);
    });
  } else {
    // Set default icon for the profile picture
    profilePics.forEach(pic => {
      // Clear any existing content
      pic.innerHTML = '';
      
      // Create icon display
      const iconDiv = document.createElement('div');
      iconDiv.style.width = '100%';
      iconDiv.style.height = '100%';
      iconDiv.style.display = 'flex';
      iconDiv.style.alignItems = 'center';
      iconDiv.style.justifyContent = 'center';
      iconDiv.style.color = 'white';
      
      const icon = document.createElement('i');
      icon.className = 'fas fa-user';
      iconDiv.appendChild(icon);
      
      pic.appendChild(iconDiv);
    });
  }
}

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to display form errors
function displayError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Helper function to clear all error messages
function clearErrorMessages() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
} 