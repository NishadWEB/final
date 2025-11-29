class ContactPage {
    constructor() {
        this.initAnimations();
        this.initMedicalBackground();
        this.initFormValidation();
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
        const medicalIcons = ['❤️', '🩺', '💊', '🏥', '📞', '✉️'];
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
            '📞': 'phone',
            '✉️': 'email'
        };
        return iconMap[icon] || 'medical';
    }

    initFormValidation() {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                this.validateForm(e);
            });
        }
    }

    validateForm(e) {
        const form = e.target;
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ef4444';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        });

        if (!isValid) {
            e.preventDefault();
            this.showMessage('Please fill in all required fields.', 'error');
        }
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `alert alert-${type}`;
        messageEl.textContent = message;

        // Insert before form
        const form = document.querySelector('form');
        form.parentNode.insertBefore(messageEl, form);

        // Remove message after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}

// Initialize contact page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactPage();
});