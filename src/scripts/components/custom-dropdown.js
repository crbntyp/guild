// Custom Dropdown Component
// A fully customizable dropdown menu built with HTML, CSS, and JavaScript

class CustomDropdown {
  constructor(config) {
    this.id = config.id;
    this.label = config.label;
    this.options = config.options; // Array of {value, label, icon (optional)}
    this.selectedValue = config.selectedValue || null;
    this.onChange = config.onChange || (() => {});
    this.container = null;
    this.isOpen = false;
  }

  render() {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue) || this.options[0];

    const html = `
      <div class="custom-dropdown" id="${this.id}" data-dropdown="${this.id}">
        <button class="dropdown-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">
          <span class="dropdown-label">
            ${selectedOption.icon ? `<img src="${selectedOption.icon}" alt="" class="dropdown-icon" />` : ''}
            <span class="dropdown-text">${selectedOption.label}</span>
          </span>
          <i class="las la-angle-down dropdown-arrow"></i>
        </button>
        <div class="dropdown-menu" role="listbox">
          ${this.options.map(option => `
            <button
              class="dropdown-item ${option.value === this.selectedValue ? 'selected' : ''}"
              data-value="${option.value}"
              role="option"
              aria-selected="${option.value === this.selectedValue}"
            >
              ${option.icon ? `<img src="${option.icon}" alt="" class="dropdown-icon" />` : ''}
              <span class="dropdown-item-text">${option.label}</span>
              ${option.count !== undefined ? `<span class="dropdown-count">${option.count}</span>` : ''}
              ${option.value === this.selectedValue ? '<i class="las la-check dropdown-check"></i>' : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    return html;
  }

  attachToElement(parentElement) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.render();
    this.container = tempDiv.firstElementChild;
    parentElement.appendChild(this.container);

    this.attachEventListeners();
  }

  attachEventListeners() {
    const toggle = this.container.querySelector('.dropdown-toggle');
    const menu = this.container.querySelector('.dropdown-menu');
    const items = this.container.querySelectorAll('.dropdown-item');

    // Toggle dropdown
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Handle item clicks
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.dataset.value;
        this.selectOption(value);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
        toggle.focus();
      }
    });
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    // Close other dropdowns first
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
      if (dropdown !== this.container) {
        dropdown.classList.remove('open');
      }
    });

    this.container.classList.add('open');
    this.isOpen = true;

    const toggle = this.container.querySelector('.dropdown-toggle');
    toggle.setAttribute('aria-expanded', 'true');
  }

  closeDropdown() {
    this.container.classList.remove('open');
    this.isOpen = false;

    const toggle = this.container.querySelector('.dropdown-toggle');
    toggle.setAttribute('aria-expanded', 'false');
  }

  selectOption(value) {
    // Convert value to appropriate type
    const parsedValue = value === '' ? null : (isNaN(value) ? value : parseInt(value));

    this.selectedValue = parsedValue;
    this.updateUI();
    this.closeDropdown();
    this.onChange(parsedValue);
  }

  updateUI() {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue) || this.options[0];

    // Update toggle button
    const toggle = this.container.querySelector('.dropdown-toggle');
    const labelSpan = toggle.querySelector('.dropdown-label');
    labelSpan.innerHTML = `
      ${selectedOption.icon ? `<img src="${selectedOption.icon}" alt="" class="dropdown-icon" />` : ''}
      <span class="dropdown-text">${selectedOption.label}</span>
    `;

    // Update selected state in menu items
    const items = this.container.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      const itemValue = item.dataset.value;
      const parsedItemValue = itemValue === '' ? null : (isNaN(itemValue) ? itemValue : parseInt(itemValue));

      if (parsedItemValue === this.selectedValue) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        // Add check icon if not present
        if (!item.querySelector('.dropdown-check')) {
          item.innerHTML += '<i class="las la-check dropdown-check"></i>';
        }
      } else {
        item.classList.remove('selected');
        item.setAttribute('aria-selected', 'false');
        // Remove check icon if present
        const checkIcon = item.querySelector('.dropdown-check');
        if (checkIcon) {
          checkIcon.remove();
        }
      }
    });
  }

  setValue(value) {
    this.selectedValue = value;
    if (this.container) {
      this.updateUI();
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default CustomDropdown;
