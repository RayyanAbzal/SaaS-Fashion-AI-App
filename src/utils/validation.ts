export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDisplayName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateWardrobeItem = (item: {
  name: string;
  category: string;
  color: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.name.trim()) {
    errors.push('Item name is required');
  }
  
  if (!item.category) {
    errors.push('Category is required');
  }
  
  if (!item.color.trim()) {
    errors.push('Color is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateOutfit = (outfit: {
  name: string;
  items: any[];
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!outfit.name.trim()) {
    errors.push('Outfit name is required');
  }
  
  if (outfit.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}; 