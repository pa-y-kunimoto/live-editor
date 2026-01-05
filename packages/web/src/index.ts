import { FormData, FormField, validateForm } from '@live-editor/core';

/**
 * Example web application that uses the core package
 */

export class LiveEditor {
  private formData: FormData;

  constructor() {
    this.formData = {
      fields: [],
      updatedAt: new Date(),
    };
  }

  addField(field: FormField): void {
    this.formData.fields.push(field);
    this.formData.updatedAt = new Date();
  }

  removeField(fieldId: string): void {
    this.formData.fields = this.formData.fields.filter(f => f.id !== fieldId);
    this.formData.updatedAt = new Date();
  }

  updateField(fieldId: string, value: string | number): void {
    const field = this.formData.fields.find(f => f.id === fieldId);
    if (field) {
      field.value = value;
      this.formData.updatedAt = new Date();
    }
  }

  validate(): boolean {
    return validateForm(this.formData);
  }

  getFormData(): FormData {
    return { ...this.formData };
  }
}

// Example usage
export function createExampleEditor(): LiveEditor {
  const editor = new LiveEditor();

  editor.addField({
    id: 'name',
    type: 'text',
    label: 'Name',
    value: '',
    required: true,
  });

  editor.addField({
    id: 'email',
    type: 'email',
    label: 'Email',
    value: '',
    required: true,
  });

  return editor;
}
