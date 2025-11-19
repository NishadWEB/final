const moment = require('moment');

// Format date for display
exports.formatDate = (date) => {
  return moment(date).format('MMMM D, YYYY [at] h:mm A');
};

// Format date for input fields
exports.formatDateForInput = (date) => {
  return moment(date).format('YYYY-MM-DDTHH:mm');
};

// Calculate age from date of birth
exports.calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation)
exports.isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Generate random color for avatars
exports.generateAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

// Get initials for avatar
exports.getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Debounce function for search inputs
exports.debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check if user is authenticated
exports.isAuthenticated = (req) => {
  return req.session && req.session.user;
};

// Check if user has specific role
exports.hasRole = (req, role) => {
  return req.session && req.session.user && req.session.user.role === role;
};