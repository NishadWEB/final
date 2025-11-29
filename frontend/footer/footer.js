// Scroll to Top Functionality
class ScrollToTop {
    constructor() {
        this.scrollButton = document.getElementById('scroll-to-top');
        this.init();
    }

    init() {
        // Show/hide scroll button based on scroll position
        window.addEventListener('scroll', () => this.toggleScrollButton());
        
        // Scroll to top when button is clicked
        this.scrollButton.addEventListener('click', () => this.scrollToTop());
    }

    toggleScrollButton() {
        if (window.pageYOffset > 300) {
            this.scrollButton.classList.add('visible');
        } else {
            this.scrollButton.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize scroll to top when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScrollToTop();
});