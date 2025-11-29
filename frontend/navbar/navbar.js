class Navbar {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.navbarNav = document.querySelector('.navbar-nav');
    this.userMenu = document.querySelector('.user-menu');
    this.userTrigger = document.querySelector('.user-trigger');
    this.userDropdown = document.querySelector('.user-dropdown');
    this.init();
  }

  init() {
    // Scroll effect
    window.addEventListener('scroll', () => this.handleScroll());
    
    // Mobile menu
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });
    }

    // User dropdown
    if (this.userTrigger) {
      this.userTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
      });
    }

    // Close menus when clicking outside
    document.addEventListener('click', (e) => this.handleClickOutside(e));
    
    // Close mobile menu when clicking on links
    this.navbarNav?.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        this.closeMobileMenu();
      }
    });

    // Set active nav link
    this.setActiveNavLink();
    
    // Initialize user avatar
    this.initUserAvatar();
    
    // Add resize listener
    window.addEventListener('resize', () => this.handleResize());
    
    // Hide signup button on initialization
    this.hideSignupButton();
  }

  handleScroll() {
    if (window.scrollY > 100) {
      this.navbar?.classList.add('scrolled');
    } else {
      this.navbar?.classList.remove('scrolled');
    }
  }

  toggleMobileMenu() {
    this.navbarNav?.classList.toggle('active');
    this.mobileMenuBtn?.classList.toggle('active');
    
    // Animate hamburger icon
    if (this.mobileMenuBtn?.classList.contains('active')) {
      this.mobileMenuBtn.innerHTML = '✕';
    } else {
      this.mobileMenuBtn.innerHTML = '☰';
    }
  }

  closeMobileMenu() {
    this.navbarNav?.classList.remove('active');
    this.mobileMenuBtn?.classList.remove('active');
    this.mobileMenuBtn.innerHTML = '☰';
  }

  toggleUserDropdown() {
    this.userDropdown?.classList.toggle('active');
    
    // Close other dropdowns
    document.querySelectorAll('.user-dropdown').forEach(dropdown => {
      if (dropdown !== this.userDropdown) {
        dropdown.classList.remove('active');
      }
    });
  }

  closeUserDropdown() {
    this.userDropdown?.classList.remove('active');
  }

  handleClickOutside(e) {
    if (!e.target.closest('.navbar-nav') && !e.target.closest('.mobile-menu-btn')) {
      this.closeMobileMenu();
    }
    
    if (!e.target.closest('.user-menu')) {
      this.closeUserDropdown();
    }
  }

  setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav a');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (currentPath === linkPath || 
          (currentPath.startsWith(linkPath) && linkPath !== '/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  initUserAvatar() {
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && !userAvatar.textContent.trim()) {
      // Generate initials from user data or use default
      const userName = this.getUserName();
      userAvatar.textContent = userName ? userName.charAt(0).toUpperCase() : 'U';
    }
  }

  getUserName() {
    // This would typically come from your auth system
    // For demo purposes, we'll check localStorage or use a default
    return localStorage.getItem('userName') || 'User';
  }

  handleResize() {
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }

  // Method to hide signup button and only show login button
  hideSignupButton() {
    const signupButtons = document.querySelectorAll('.btn-signup');
    const loginButtons = document.querySelectorAll('.btn-login');
    
    // Hide all signup buttons
    signupButtons.forEach(button => {
      button.style.display = 'none';
    });
    
    // Ensure login buttons are visible and have the primary style
    loginButtons.forEach(button => {
      button.style.display = 'flex';
      button.classList.add('btn-login');
      button.classList.remove('btn-signup');
    });
  }

  // Method to update user info (can be called after login)
  updateUserInfo(userData) {
    const userNameElement = document.querySelector('.user-trigger span');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userNameElement && userData.name) {
      userNameElement.textContent = userData.name;
    }
    
    if (userAvatar && userData.name) {
      userAvatar.textContent = userData.name.charAt(0).toUpperCase();
    }
    
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    }
  }

  // Method to show/hide auth buttons based on login status
  updateAuthState(isLoggedIn) {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (authButtons && userMenu) {
      if (isLoggedIn) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
      } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
        // Ensure only login button is visible
        this.hideSignupButton();
      }
    }
  }
}

// Add CSS for animations
const navbarStyles = `
  .mobile-menu-btn {
    transition: all 0.3s ease;
  }
  
  .navbar-nav {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .user-dropdown {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .user-dropdown.active {
    animation: slideDown 0.3s ease;
  }
  
  /* Ensure signup buttons are hidden */
  .btn-signup {
    display: none !important;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = navbarStyles;
document.head.appendChild(styleSheet);

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navbar = new Navbar();
  
  // Example: Update auth state based on login status
  // This would typically come from your auth system
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  window.navbar.updateAuthState(isLoggedIn);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navbar;
}