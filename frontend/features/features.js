class FeaturesPage {
    constructor() {
        this.initTabs();
        this.initAnimations();
        this.initMedicalBackground();
    }

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Remove active class from all buttons and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to current button and content
                btn.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    initAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation delays
                    const delay = index * 0.1;
                    entry.target.style.animation = `fadeInUp 0.8s ease-out ${delay}s forwards`;
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all elements with animation class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    initMedicalBackground() {
        // Create floating medical icons in background
        const medicalIcons = ['❤️', '🩺', '💊', '🏥', '🔬', '💉'];
        const medicalBackground = document.querySelector('.medical-background');
        
        if (medicalBackground) {
            medicalIcons.forEach((icon, index) => {
                const medicalIcon = document.createElement('div');
                medicalIcon.className = `medical-icon ${this.getIconClass(icon)}`;
                medicalIcon.textContent = icon;
                medicalIcon.style.animationDelay = `${index * 2}s`;
                medicalIcon.style.left = `${Math.random() * 90}%`;
                medicalIcon.style.top = `${Math.random() * 90}%`;
                medicalBackground.appendChild(medicalIcon);
            });
        }
    }

    getIconClass(icon) {
        const iconMap = {
            '❤️': 'heart',
            '🩺': 'stethoscope',
            '💊': 'pill',
            '🏥': 'hospital',
            '🔬': 'microscope',
            '💉': 'syringe'
        };
        return iconMap[icon] || 'medical';
    }
}

// Initialize features page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FeaturesPage();
});