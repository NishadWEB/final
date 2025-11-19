class ScrollButton {
  constructor() {
    this.scrollButton = document.getElementById('scroll-to-top');
    this.init();
  }

  init() {
    if (!this.scrollButton) return;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        this.scrollButton.classList.add('visible');
      } else {
        this.scrollButton.classList.remove('visible');
      }
    });

    // Scroll to top when clicked
    this.scrollButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ScrollButton();
});