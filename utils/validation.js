const Joi = require('joi');

// Custom validation messages
const messages = {
  'string.base': '{#label} must be a string',
  'string.empty': '{#label} cannot be empty',
  'string.min': '{#label} must be at least {#limit} characters long',
  'string.max': '{#label} must not exceed {#limit} characters',
  'string.email': 'Please provide a valid email address',
  'string.pattern.base': '{#label} format is invalid',
  'any.required': '{#label} is required',
  'number.base': '{#label} must be a number',
  'number.min': '{#label} must be at least {#limit}',
  'number.max': '{#label} must not exceed {#limit}',
  'boolean.base': '{#label} must be true or false',
  'date.base': '{#label} must be a valid date',
  'array.base': '{#label} must be an array',
  'object.base': '{#label} must be an object'
};

// National ID validation for Eswatini (12 digits)
const nationalIdSchema = Joi.string()
  .length(12)
  .pattern(/^[0-9]{12}$/)
  .required()
  .messages({
    'string.length': 'National ID must be exactly 12 digits',
    'string.pattern.base': 'National ID must contain only numbers',
    'any.required': 'National ID is required'
  });

// Password validation with strong requirements
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'any.required': 'Password is required'
  });

// Email validation
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please enter a valid email address',
    'string.max': 'Email must not exceed 255 characters',
    'any.required': 'Email is required'
  });

// Name validation
const nameSchema = Joi.string()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s'.-]+$/)
  .trim()
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'string.pattern.base': 'Name can only contain letters, spaces, apostrophes, dots, and hyphens',
    'any.required': 'Name is required'
  });

// Phone number validation (Eswatini format)
const phoneSchema = Joi.string()
  .pattern(/^(\+268|268|0)?[2467]\d{7}$/)
  .messages({
    'string.pattern.base': 'Please enter a valid Eswatini phone number (e.g., +26876543210, 76543210)'
  });

// Role validation
const roleSchema = Joi.string()
  .valid('citizen', 'admin', 'super_admin')
  .default('citizen')
  .messages({
    'any.only': 'Role must be one of: citizen, admin, super_admin'
  });

// Status validation
const statusSchema = Joi.string()
  .valid('active', 'inactive', 'suspended', 'locked')
  .default('active')
  .messages({
    'any.only': 'Status must be one of: active, inactive, suspended, locked'
  });

// UUID validation
const uuidSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.uuid': 'Must be a valid UUID',
    'any.required': 'ID is required'
  });

// Date validation
const dateSchema = Joi.date()
  .max('now')
  .messages({
    'date.max': 'Date cannot be in the future'
  });

// User registration schema
const userRegistrationSchema = Joi.object({
  nationalId: nationalIdSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  phone: phoneSchema.optional(),
  role: roleSchema.optional(),
  dateOfBirth: dateSchema.optional()
}).options({ messages });

// User login schema
const loginSchema = Joi.object({
  nationalId: nationalIdSchema,
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required'
    })
}).options({ messages });

// User profile update schema
const profileUpdateSchema = Joi.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: dateSchema.optional()
}).min(1).options({ messages });

// Password change schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New passwords do not match',
      'any.required': 'New password confirmation is required'
    })
}).options({ messages });

// Admin user creation schema
const adminUserCreationSchema = Joi.object({
  nationalId: nationalIdSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  status: statusSchema.optional()
}).options({ messages });

// User update schema (admin only)
const userUpdateSchema = Joi.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  dateOfBirth: dateSchema.optional()
}).min(1).options({ messages });

// Session validation schema
const sessionSchema = Joi.object({
  userId: uuidSchema,
  token: Joi.string().required(),
  expiresAt: Joi.date().required(),
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().max(500).optional()
}).options({ messages });

// Audit log schema
const auditLogSchema = Joi.object({
  userId: uuidSchema.optional(),
  action: Joi.string().max(50).required(),
  details: Joi.object().optional(),
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().max(500).optional()
}).options({ messages });

// Pagination schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email', 'lastLogin').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}).options({ messages });

// Search schema
const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  searchBy: Joi.string().valid('name', 'email', 'nationalId').default('name')
}).options({ messages });

// Filter schema
const filterSchema = Joi.object({
  role: Joi.string().valid('citizen', 'admin', 'super_admin').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'locked').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().min(Joi.ref('dateFrom')).optional()
}).options({ messages });

// Validation helper functions
const validateUserRegistration = (data) => {
  return userRegistrationSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

const validateProfileUpdate = (data) => {
  return profileUpdateSchema.validate(data, { abortEarly: false });
};

const validatePasswordChange = (data) => {
  return passwordChangeSchema.validate(data, { abortEarly: false });
};

const validateAdminUserCreation = (data) => {
  return adminUserCreationSchema.validate(data, { abortEarly: false });
};

const validateUserUpdate = (data) => {
  return userUpdateSchema.validate(data, { abortEarly: false });
};

const validateSession = (data) => {
  return sessionSchema.validate(data, { abortEarly: false });
};

const validateAuditLog = (data) => {
  return auditLogSchema.validate(data, { abortEarly: false });
};

const validatePagination = (data) => {
  return paginationSchema.validate(data, { abortEarly: false });
};

const validateSearch = (data) => {
  return searchSchema.validate(data, { abortEarly: false });
};

const validateFilter = (data) => {
  return filterSchema.validate(data, { abortEarly: false });
};

// Individual field validators
const validateNationalId = (nationalId) => {
  const { error } = nationalIdSchema.validate(nationalId);
  return { isValid: !error, error: error?.details[0]?.message };
};

const validatePassword = (password) => {
  const { error } = passwordSchema.validate(password);
  return { isValid: !error, error: error?.details[0]?.message };
};

const validateEmail = (email) => {
  const { error } = emailSchema.validate(email);
  return { isValid: !error, error: error?.details[0]?.message };
};

const validateName = (name) => {
  const { error } = nameSchema.validate(name);
  return { isValid: !error, error: error?.details[0]?.message };
};

const validatePhone = (phone) => {
  const { error } = phoneSchema.validate(phone);
  return { isValid: !error, error: error?.details[0]?.message };
};

const validateUUID = (id) => {
  const { error } = uuidSchema.validate(id);
  return { isValid: !error, error: error?.details[0]?.message };
};

module.exports = {
  // Schemas
  schemas: {
    userRegistrationSchema,
    loginSchema,
    profileUpdateSchema,
    passwordChangeSchema,
    adminUserCreationSchema,
    userUpdateSchema,
    sessionSchema,
    auditLogSchema,
    paginationSchema,
    searchSchema,
    filterSchema,
    nationalIdSchema,
    passwordSchema,
    emailSchema,
    nameSchema,
    phoneSchema,
    roleSchema,
    statusSchema,
    uuidSchema
  },
  
  // Validation functions
  validateUserRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateAdminUserCreation,
  validateUserUpdate,
  validateSession,
  validateAuditLog,
  validatePagination,
  validateSearch,
  validateFilter,
  
  // Individual field validators
  validators: {
    validateNationalId,
    validatePassword,
    validateEmail,
    validateName,
    validatePhone,
    validateUUID
  }
};