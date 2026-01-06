/**
 * Core types and utilities for live-editor
 */

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'textarea';
  label: string;
  value: string | number;
  required?: boolean;
}

export interface FormData {
  fields: FormField[];
  updatedAt: Date;
}

/**
 * Validates a form field
 */
export function validateField(field: FormField): boolean {
  if (field.required) {
    // Check for null, undefined, or empty string (but not 0 which is valid)
    if (field.value === null || field.value === undefined || field.value === '') {
      return false;
    }
  }
  return true;
}

/**
 * Validates all fields in a form
 */
export function validateForm(formData: FormData): boolean {
  return formData.fields.every(validateField);
}
