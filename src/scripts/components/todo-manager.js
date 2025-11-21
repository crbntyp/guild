import FormModal from './form-modal.js';
import ItemManager from './item-manager.js';
import PageHeader from './page-header.js';

/**
 * Todo Manager - Manages todo cards with localStorage persistence
 */
class TodoManager extends ItemManager {
  constructor(containerId, authService) {
    super({
      containerId,
      authService,
      storagePrefix: 'guild_todos',
      apiEndpoint: '/api/user/todos',
      baseApiUrl: 'https://guild-production.up.railway.app'
    });

    // Todo-specific properties
    this.apiUrl = 'https://guild-production.up.railway.app/api/fetch-metadata';
    this.masonry = null;

    // Initialize FormModal
    this.formModal = new FormModal({
      id: 'todo-form-modal',
      title: 'Add a Warcraft todo',
      editTitle: 'Edit Warcraft todo',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title *',
          placeholder: 'e.g. Farm Midnight Mount',
          required: true
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description *',
          placeholder: 'e.g. Complete Karazhan on all characters',
          required: true
        },
        {
          name: 'url',
          type: 'url',
          label: 'URL (optional)',
          placeholder: 'Paste URL to fetch metadata from page',
          statusElement: true,
          onChange: (value) => this.handleUrlInput(value)
        },
        {
          name: 'auto-fill-metadata',
          type: 'checkbox',
          label: 'Autofill from video metadata',
          checked: true
        }
      ],
      onSubmit: (data, isEdit, editData) => this.handleFormSubmit(data, isEdit, editData)
    });
  }

  /**
   * Initialize the todo manager
   */
  async init() {
    // Call parent init to load items
    await super.init();

    // Render the UI
    this.render();
  }

  /**
   * Fetch metadata from URL
   */
  async fetchMetadata(url) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  /**
   * Add a new todo (override parent to include todo-specific fields)
   */
  async addTodo(todoData) {
    await this.addItem({
      title: todoData.title,
      description: todoData.description,
      url: todoData.url,
      image: todoData.image || null
    });
    this.renderGrid();
  }

  /**
   * Update an existing todo (override parent to include todo-specific fields)
   */
  async updateTodo(id, todoData) {
    await this.updateItem(id, {
      title: todoData.title,
      description: todoData.description,
      url: todoData.url,
      image: todoData.image || this.getItemById(id)?.image
    });
    this.renderGrid();
  }

  /**
   * Edit a todo
   */
  editTodo(id) {
    const todo = this.getItemById(id);
    if (todo) {
      this.editingItemId = id;
      this.openModal(todo);
    }
  }

  /**
   * Delete a todo (override parent to trigger re-render)
   */
  async deleteTodo(id) {
    await this.deleteItem(id);
    this.renderGrid();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      ${PageHeader.render({
        className: 'todos',
        title: 'Todos',
        description: 'Organise your Warcraft activities with ease. Farm mounts, leave reminders, or save interesting links to check back on.',
        actionButton: {
          id: 'btn-add-todo',
          icon: 'la-plus',
          text: 'Add Todo'
        }
      })}

      <div class="todos-grid" id="todos-grid"></div>

      ${this.formModal.render()}
    `;

    // Attach FormModal listeners
    this.formModal.attachListeners();

    // Attach event listeners
    document.getElementById('btn-add-todo').addEventListener('click', () => this.openModal());

    // Render the grid
    this.renderGrid();

    // Recalculate layout on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.masonry) {
          this.masonry.layout();
        }
      }, 100);
    });
  }

  /**
   * Render the todos grid
   */
  renderGrid() {
    const grid = document.getElementById('todos-grid');
    if (!grid) return;

    if (this.items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="las la-clipboard-list"></i>
          <p>No todos yet. Click "Add Todo" to create your first one!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.items.map(todo => `
      <div class="todo-card" data-id="${todo.id}">
        ${todo.image ? `<img src="${todo.image}" alt="${todo.title}" class="todo-image">` : `<div class="todo-image"><i class="las la-clipboard-list"></i></div>`}
        <div class="todo-content">
          <div class="todo-date">
            <div class="todo-date-left">
              <i class="las la-calendar"></i>
              <span>${this.formatDate(todo.createdAt)}</span>
            </div>
            <div class="todo-actions">
              <button class="todo-edit" data-id="${todo.id}" title="Edit todo">
                <i class="las la-pen"></i>
              </button>
              <button class="todo-complete" data-id="${todo.id}" title="Mark as complete">
                <i class="las la-check"></i>
              </button>
            </div>
          </div>
          <div class="todo-title">${this.escapeHtml(todo.title)}</div>
          <div class="todo-description">${this.escapeHtml(todo.description)}</div>
          ${todo.url ? `<a href="${todo.url}" target="_blank" rel="noopener" class="todo-link" onclick="event.stopPropagation()"><i class="las la-external-link-alt"></i><span>Visit Link</span></a>` : ''}
        </div>
      </div>
    `).join('');

    // Attach edit handlers
    grid.querySelectorAll('.todo-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        this.editTodo(id);
      });
    });

    // Attach complete handlers
    grid.querySelectorAll('.todo-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        this.deleteTodo(id);
      });
    });

    // Initialize Masonry
    this.initMasonry();
  }

  /**
   * Initialize Masonry layout
   */
  initMasonry() {
    const grid = document.getElementById('todos-grid');
    if (!grid) return;

    // Destroy existing masonry instance if it exists
    if (this.masonry) {
      this.masonry.destroy();
    }

    // Initialize new masonry instance
    this.masonry = new Masonry(grid, {
      itemSelector: '.todo-card',
      columnWidth: '.todo-card',
      percentPosition: true,
      gutter: 24
    });

    // Layout after images load
    const images = grid.querySelectorAll('img.todo-image');
    let loadedImages = 0;

    if (images.length === 0) {
      // No images, layout immediately
      this.masonry.layout();
    } else {
      images.forEach(img => {
        if (img.complete) {
          loadedImages++;
          if (loadedImages === images.length) {
            this.masonry.layout();
          }
        } else {
          img.addEventListener('load', () => {
            loadedImages++;
            if (loadedImages === images.length) {
              this.masonry.layout();
            }
          });
        }
      });
    }
  }

  /**
   * Open modal
   */
  openModal(todo = null) {
    if (todo) {
      // Store editing ID and open with data
      this.editingItemId = todo.id;
      this.formModal.open(todo);

      // Store image metadata if it exists
      if (todo.image) {
        const titleInput = this.formModal.getField('title');
        if (titleInput) {
          titleInput.dataset.metadata = JSON.stringify({ image: todo.image });
        }
      }
    } else {
      // Add mode
      this.editingItemId = null;
      this.formModal.open();
    }
  }

  /**
   * Close modal (handled by FormModal, but keep for backwards compatibility)
   */
  closeModal() {
    this.formModal.close();
    this.editingItemId = null;
  }

  /**
   * Handle URL input
   */
  async handleUrlInput(url) {
    // Debounce URL input
    clearTimeout(this.urlTimeout);

    if (!url || !this.isValidUrl(url)) {
      return;
    }

    this.urlTimeout = setTimeout(async () => {
      const titleInput = this.formModal.getField('title');
      const descriptionInput = this.formModal.getField('description');
      const autoFillCheckbox = this.formModal.getField('auto-fill-metadata');

      this.formModal.setFieldStatus('url', 'Fetching metadata...', 'loading');

      const metadata = await this.fetchMetadata(url);

      if (metadata) {
        // Auto-fill title and description if checkbox is checked
        if (autoFillCheckbox && autoFillCheckbox.checked) {
          if (metadata.title && titleInput && !titleInput.value) {
            titleInput.value = metadata.title;
          }
          if (metadata.description && descriptionInput && !descriptionInput.value) {
            descriptionInput.value = metadata.description;
          }
          this.formModal.setFieldStatus('url', '✓ Metadata loaded', 'success');
        } else {
          this.formModal.setFieldStatus('url', metadata.image ? '✓ Image loaded' : '✓ No image found', 'success');
        }

        // Store metadata for later
        if (titleInput) {
          titleInput.dataset.metadata = JSON.stringify(metadata);
        }
      } else {
        this.formModal.setFieldStatus('url', 'Could not fetch metadata', 'error');
      }
    }, 800);
  }

  /**
   * Handle form submit from FormModal
   */
  async handleFormSubmit(formData, isEdit, editData) {
    const title = formData.title;
    const url = formData.url;
    const description = formData.description;

    // Get metadata if available (only for image)
    let metadata = null;
    try {
      const titleInput = this.formModal.getField('title');
      if (titleInput && titleInput.dataset.metadata) {
        metadata = JSON.parse(titleInput.dataset.metadata);
      }
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }

    const todoData = {
      title,
      url: url || null,
      description: description,
      image: metadata?.image || null
    };

    if (this.editingItemId) {
      // Update existing todo
      await this.updateTodo(this.editingItemId, todoData);
      this.editingItemId = null;
    } else {
      // Add new todo
      await this.addTodo(todoData);
    }
  }

}

export default TodoManager;
