class RegisterForm {
    constructor() {
        this.initEventListeners();
        this.setupPasswordStrength();
        this.initMedicalBackground();
        this.handleRoleFromURL(); // Add this line
    }

    // Add this new method to handle role from URL
    handleRoleFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role');
        
        if (role === 'patient' || role === 'doctor') {
            // Check the appropriate radio button
            const roleInput = document.querySelector(`input[name="role"][value="${role}"]`);
            if (roleInput) {
                roleInput.checked = true;
                this.toggleRoleSpecificFields(role);
                
                // Disable role selection and show locked message
                this.lockRoleSelection(role);
            }
        }
    }

    // Add this method to lock role selection
    lockRoleSelection(selectedRole) {
        const roleInputs = document.querySelectorAll('input[name="role"]');
        const roleSelection = document.querySelector('.role-selection');
        
        // Disable all radio buttons (visual lock). Disabled radios won't be
        // submitted with the form, so add a hidden input to ensure the role
        // value reaches the server.
        roleInputs.forEach(input => {
            input.disabled = true;
        });

        // Ensure there is a fallback hidden input so the role value is included in POST
        const existingHidden = document.querySelector('input[type="hidden"][name="role"]');
        if (!existingHidden) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'role';
            hidden.value = selectedRole;
            // Prefer to append right after the radio group so it is inside the form
            const form = document.getElementById('register-form');
            if (form) form.appendChild(hidden);
        }
        
        // Add locked message
        const lockedMessage = document.createElement('div');
        lockedMessage.className = 'role-locked-message';
        lockedMessage.innerHTML = `
            <i class="fas fa-lock"></i>
            <span>Role locked as ${selectedRole}. <a href="/" class="change-role-link">Go back to change role</a></span>
        `;
        
        roleSelection.appendChild(lockedMessage);
        
        // Add visual styling for locked state
        roleSelection.classList.add('role-selection-locked');
    }

    initEventListeners() {
        // Role selection - only add listeners if not locked
        const roleInputs = document.querySelectorAll('input[name="role"]');
        roleInputs.forEach(input => {
            if (!input.disabled) {
                input.addEventListener('change', () => {
                    this.toggleRoleSpecificFields(input.value);
                });
            }
        });

        // Password confirmation
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('confirm_password');
        
        if (passwordInput && confirmInput) {
            confirmInput.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput, confirmInput);
            });
        }

        // Form submission
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', (e) => this.validateForm(e));
        }
    }

    initMedicalBackground() {
        // Create floating medical icons in background
        const medicalIcons = ['❤️', '🩺', '💊', '🏥', '👤', '👨‍⚕️'];
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
            '👤': 'user',
            '👨‍⚕️': 'doctor'
        };
        return iconMap[icon] || 'medical';
    }

    toggleRoleSpecificFields(role) {
        const doctorFields = document.querySelectorAll('.doctor-field');
        const patientFields = document.querySelectorAll('.patient-field');
        
        if (role === 'doctor') {
            doctorFields.forEach(field => field.style.display = 'block');
            patientFields.forEach(field => field.style.display = 'none');
        } else if (role === 'patient') {
            doctorFields.forEach(field => field.style.display = 'none');
            patientFields.forEach(field => field.style.display = 'block');
        } else {
            doctorFields.forEach(field => field.style.display = 'none');
            patientFields.forEach(field => field.style.display = 'none');
        }
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strengthBar = document.querySelector('.strength-bar');
            
            if (!strengthBar) return;

            // Reset classes
            strengthBar.className = 'strength-bar';
            
            if (password.length === 0) {
                strengthBar.style.width = '0%';
                return;
            }

            let strength = 0;
            
            // Length check
            if (password.length >= 6) strength++;
            if (password.length >= 8) strength++;
            
            // Complexity checks
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            // Update strength bar
            if (strength <= 2) {
                strengthBar.classList.add('strength-weak');
            } else if (strength <= 4) {
                strengthBar.classList.add('strength-medium');
            } else {
                strengthBar.classList.add('strength-strong');
            }
        });
    }

    validatePasswordMatch(passwordInput, confirmInput) {
        if (passwordInput.value !== confirmInput.value) {
            confirmInput.style.borderColor = '#ef4444';
        } else {
            confirmInput.style.borderColor = '#10b981';
        }
    }

    validateForm(e) {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        // If radios are locked and disabled, the value may be in a hidden input
        const roleSelected = document.querySelector('input[name="role"]:checked')
            || document.querySelector('input[type="hidden"][name="role"]');
        
        if (!roleSelected) {
            e.preventDefault();
            alert('Please select a role (Patient or Doctor)!');
            return false;
        }

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            e.preventDefault();
            alert('Passwords do not match!');
            return false;
        }

        if (password.value.length < 6) {
            e.preventDefault();
            alert('Password must be at least 6 characters long!');
            return false;
        }

        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RegisterForm();
});