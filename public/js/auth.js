// Authentication related functionality

// Function to check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

// Function to get current user
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Function to get user initials
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Function to handle logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/home.html';
}

// Function to update UI based on auth state
function updateUIForAuthState(user) {
  const authButtons = document.querySelector('.auth-buttons');
  const profileSection = document.querySelector('.profile-section');
  const profileIcon = profileSection?.querySelector('.profile-icon');
  const profileDropdown = profileSection?.querySelector('.profile-dropdown');
  
  if (!authButtons || !profileSection) return;
  
  if (user) {
    // Hide auth buttons, show profile
    authButtons.style.display = 'none';
    profileSection.style.display = 'flex';
    
    // Update profile icon with initials
    if (profileIcon) {
      const initials = getInitials(user.name || user.email || 'User');
      profileIcon.textContent = initials;
    }

    // Set dropdown content to only logout button
    if (profileDropdown) {
      // Remove any existing content and event listeners
      profileDropdown.innerHTML = '';
      
      // Create and add only the logout button
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'profile-dropdown-item';
      logoutBtn.textContent = 'Logout';
      logoutBtn.addEventListener('click', logout);
      
      profileDropdown.appendChild(logoutBtn);
    }
  } else {
    // Show auth buttons and hide profile
    authButtons.style.display = 'flex';
    profileSection.style.display = 'none';
  }
}

// Function to inject header HTML
function injectHeader() {
  const headerHTML = `
    <div class="nav-links">
      <a href="/" class="active">Home</a>
      <a href="/aboutus.html">About</a>
      <div class="auth-buttons">
        <a href="/login.html" class="login-btn">Login</a>
        <a href="/signup.html" class="signup-btn">Sign Up</a>
      </div>
      <div class="profile-section">
        <div class="profile-icon"></div>
        <div class="profile-dropdown"></div>
      </div>
    </div>
  `;

  const nav = document.querySelector('nav');
  if (nav) {
    const existingLinks = nav.querySelector('.nav-links');
    if (existingLinks) {
      existingLinks.remove();
    }
    nav.insertAdjacentHTML('beforeend', headerHTML);
    setupEventListeners();
  }
}

// Function to setup event listeners
function setupEventListeners() {
  const profileSection = document.querySelector('.profile-section');
  const profileIcon = profileSection?.querySelector('.profile-icon');
  const profileDropdown = profileSection?.querySelector('.profile-dropdown');

  if (profileIcon && profileDropdown) {
    // Toggle dropdown on profile icon click
    profileIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileSection.contains(e.target)) {
        profileDropdown.classList.remove('active');
      }
    });
  }
}

// Function to redirect if authenticated
function redirectIfAuthenticated() {
  if (isAuthenticated() && 
      (window.location.pathname.includes('login.html') || 
       window.location.pathname.includes('signup.html'))) {
    window.location.href = '/home.html';
  }
}

// Function to redirect if not authenticated
function redirectIfNotAuthenticated() {
  if (!isAuthenticated() && 
      (window.location.pathname.includes('chat.html'))) {
    window.location.href = '/login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Only inject header if it doesn't exist
  const existingProfileSection = document.querySelector('.profile-section');
  if (!existingProfileSection) {
    injectHeader();
  }
  
  // Update UI based on auth state
  updateUIForAuthState(getCurrentUser());
  
  // Check authentication requirements
  redirectIfAuthenticated();
  redirectIfNotAuthenticated();

  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store auth data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Redirect to home page
          window.location.href = '/home.html';
        } else {
          const error = await response.json();
          alert(error.msg || 'Login failed. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your connection and try again.');
      }
    });
  }

  // Handle signup form submission
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store auth data
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Redirect to home page
          window.location.href = '/home.html';
        } else {
          const error = await response.json();
          alert(error.msg || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please check your connection and try again.');
      }
    });
  }

  // Handle navigation buttons
  const loginBtn = document.querySelector('a.login');
  const signupBtn = document.querySelector('a.sign-up');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'login.html';
    });
  }
  
  if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'signup.html';
    });
  }
});