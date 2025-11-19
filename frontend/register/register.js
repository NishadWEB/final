class RegisterForm {
  constructor() {
    this.initEventListeners();
    this.setupPasswordStrength();
  }

  initEventListeners() {
    // Role selection
    const roleInputs = document.querySelectorAll('input[name="role"]');
    roleInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.toggleRoleSpecificFields(input.value);
      });
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