class LaunchPage {
  constructor() {
    this.initAnimations();
    this.initPortalCards();
  }

  initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }

  initPortalCards() {
    const portalCards = document.querySelectorAll('.portal-card');
    
    portalCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) return;
        
        const role = card.dataset.role;
        if (role) {
          window.location.href = `/auth/register?role=${role}`;
        }
      });

      // Add hover effects
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }
}

// Initialize launch page
document.addEventListener('DOMContentLoaded', () => {
  new LaunchPage();
});