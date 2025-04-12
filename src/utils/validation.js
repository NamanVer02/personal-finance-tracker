// Input validation utility functions

// Username validation
export const validateUsername = (username) => {
  if (!username || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

// Email validation
export const validateEmail = (email) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// 2FA code validation
export const validate2FACode = (code) => {
  if (!code || !/^\d{6}$/.test(code)) {
    return 'Please enter a valid 6-digit code';
  }
  return null;
};

// Transaction validation
export const validateTransaction = (transaction) => {
  const errors = {};

  if (!transaction.label || transaction.label.trim().length < 2) {
    errors.label = 'Label must be at least 2 characters long';
  }

  if (!transaction.amount || isNaN(transaction.amount) || parseFloat(transaction.amount) <= 0) {
    errors.amount = 'Please enter a valid positive amount';
  }

  if (!transaction.category) {
    errors.category = 'Please select a category';
  }

  if (!transaction.date) {
    errors.date = 'Please select a date';
  } else {
    const selectedDate = new Date(transaction.date);
    const today = new Date();
    if (selectedDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};