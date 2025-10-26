/**
 * FormModal - Reusable form modal component
 * Handles modal display, form rendering, and validation
 */
class FormModal {
  constructor(config) {
    this.id = config.id; // Unique modal ID
    this.title = config.title; // Modal title
    this.editTitle = config.editTitle || config.title; // Title when editing
    this.fields = config.fields; // Array of field configurations
    this.onSubmit = config.onSubmit; // Form submit callback
    this.onClose = config.onClose; // Optional close callback
    this.modalElement = null;
    this.formElement = null;
    this.editMode = false;
    this.editData = null;
  }

  /**
   * Render the modal HTML structure
   * @returns {string} Modal HTML
   */
  render() {
    return `
      <div class="form-modal" id="${this.id}">
        <div class="form-modal-content">
          <h2>${this.title}</h2>
          <form id="${this.id}-form">
            ${this.renderFields()}
            <div class="form-actions">
              <button type="button" class="btn-cancel" data-action="cancel">Cancel</button>
              <button type="submit" class="btn-save">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Render form fields based on configuration
   * @returns {string} Fields HTML
   */
  renderFields() {
    return this.fields.map(field => {
      switch (field.type) {
        case 'textarea':
          return this.renderTextarea(field);
        case 'checkbox':
          return this.renderCheckbox(field);
        default:
          return this.renderInput(field);
      }
    }).join('');
  }

  /**
   * Render input field
   */
  renderInput(field) {
    const requiredAttr = field.required ? 'required' : '';
    const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';

    return `
      <div class="form-group">
        <label for="${this.id}-${field.name}">${field.label}</label>
        <input
          type="${field.type}"
          id="${this.id}-${field.name}"
          name="${field.name}"
          ${placeholderAttr}
          ${requiredAttr}
        >
        ${field.helperText ? `<small>${field.helperText}</small>` : ''}
        ${field.statusElement ? `<div class="field-status" id="${this.id}-${field.name}-status"></div>` : ''}
      </div>
    `;
  }

  /**
   * Render textarea field
   */
  renderTextarea(field) {
    const requiredAttr = field.required ? 'required' : '';
    const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';

    return `
      <div class="form-group">
        <label for="${this.id}-${field.name}">${field.label}</label>
        <textarea
          id="${this.id}-${field.name}"
          name="${field.name}"
          ${placeholderAttr}
          ${requiredAttr}
        ></textarea>
        ${field.helperText ? `<small>${field.helperText}</small>` : ''}
      </div>
    `;
  }

  /**
   * Render checkbox field
   */
  renderCheckbox(field) {
    const checkedAttr = field.checked ? 'checked' : '';

    return `
      <div class="form-group">
        <div class="form-checkbox">
          <input
            type="checkbox"
            id="${this.id}-${field.name}"
            name="${field.name}"
            ${checkedAttr}
          >
          <label for="${this.id}-${field.name}">${field.label}</label>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners after modal is added to DOM
   */
  attachListeners() {
    this.modalElement = document.getElementById(this.id);
    this.formElement = document.getElementById(`${this.id}-form`);

    if (!this.modalElement || !this.formElement) {
      console.error(`FormModal: Elements not found for ${this.id}`);
      return;
    }

    // Cancel button
    const cancelBtn = this.modalElement.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }

    // Form submit
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Attach field-specific listeners
    this.fields.forEach(field => {
      if (field.onChange) {
        const element = document.getElementById(`${this.id}-${field.name}`);
        if (element) {
          element.addEventListener('input', (e) => {
            field.onChange(e.target.value, e.target, this);
          });
        }
      }
    });
  }

  /**
   * Open the modal
   * @param {Object} data - Optional data to populate form (for editing)
   */
  open(data = null) {
    if (!this.modalElement) {
      console.error(`FormModal: Modal ${this.id} not found. Make sure render() output is added to DOM.`);
      return;
    }

    this.editMode = !!data;
    this.editData = data;

    // Update title
    const titleElement = this.modalElement.querySelector('h2');
    if (titleElement) {
      titleElement.textContent = this.editMode ? this.editTitle : this.title;
    }

    // Populate form if data provided
    if (data) {
      this.populateForm(data);
    }

    // Show modal
    this.modalElement.classList.add('active');

    // Focus first input
    const firstInput = this.formElement.querySelector('input, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modalElement) return;

    this.modalElement.classList.remove('active');
    this.formElement.reset();
    this.editMode = false;
    this.editData = null;

    // Clear status elements
    this.modalElement.querySelectorAll('.field-status').forEach(el => {
      el.textContent = '';
      el.className = 'field-status';
    });

    // Clear any custom data attributes
    this.formElement.querySelectorAll('[data-metadata]').forEach(el => {
      delete el.dataset.metadata;
    });

    // Call onClose callback if provided
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * Populate form with data
   */
  populateForm(data) {
    this.fields.forEach(field => {
      const element = document.getElementById(`${this.id}-${field.name}`);
      if (!element) return;

      const value = data[field.name];
      if (value !== undefined && value !== null) {
        if (field.type === 'checkbox') {
          element.checked = !!value;
        } else {
          element.value = value;
        }
      }
    });
  }

  /**
   * Get form data
   * @returns {Object} Form values
   */
  getFormData() {
    const data = {};

    this.fields.forEach(field => {
      const element = document.getElementById(`${this.id}-${field.name}`);
      if (!element) return;

      if (field.type === 'checkbox') {
        data[field.name] = element.checked;
      } else {
        data[field.name] = element.value.trim();
      }
    });

    return data;
  }

  /**
   * Get field element by name
   */
  getField(fieldName) {
    return document.getElementById(`${this.id}-${fieldName}`);
  }

  /**
   * Get status element for a field
   */
  getFieldStatus(fieldName) {
    return document.getElementById(`${this.id}-${fieldName}-status`);
  }

  /**
   * Set status message for a field
   */
  setFieldStatus(fieldName, message, type = '') {
    const statusElement = this.getFieldStatus(fieldName);
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `field-status ${type}`;
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const formData = this.getFormData();

    // Basic validation
    for (const field of this.fields) {
      if (field.required && !formData[field.name]) {
        alert(`Please enter ${field.label.replace('*', '').trim()}`);
        return;
      }
    }

    // Call submit callback
    if (this.onSubmit) {
      await this.onSubmit(formData, this.editMode, this.editData);
    }

    this.close();
  }

  /**
   * Check if modal is in edit mode
   */
  isEditMode() {
    return this.editMode;
  }

  /**
   * Get edit data
   */
  getEditData() {
    return this.editData;
  }
}

export default FormModal;
