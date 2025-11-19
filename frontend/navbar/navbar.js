class Navbar {
  constructor() {
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.navbarNav = document.querySelector('.navbar-nav');
    this.init();
  }

  init() {
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.navbar-nav') && !e.target.closest('.mobile-menu-btn')) {
        this.closeMobileMenu();
      }
    });

    // Set active nav link
    this.setActiveNavLink();
  }

  toggleMobileMenu() {
    this.navbarNav.classList.toggle('active');
  }

  closeMobileMenu() {
    this.navbarNav.classList.remove('active');
  }

  setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav a');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (currentPath === linkPath || 
          (currentPath.startsWith(linkPath) && linkPath !== '/')) {
        link.classList.add('active');
      }
    });
  }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Navbar();
});