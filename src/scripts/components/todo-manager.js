/**
 * Todo Manager - Manages todo cards with localStorage persistence
 */
class TodoManager {
  constructor(containerId, authService) {
    this.containerId = containerId;
    this.container = null;
    this.todos = [];
    this.authService = authService;
    this.storageKey = this.getStorageKey();
    // Always use production Railway backend for sync
    this.apiUrl = 'https://guild-production.up.railway.app/api/fetch-metadata';
    this.masonry = null;
    this.editingTodoId = null;
  }

  /**
   * Get user-specific storage key based on Battle.net account
   */
  getStorageKey() {
    const user = this.authService?.getUser();
    const battletag = user?.battletag;

    if (battletag) {
      return `guild_todos_${battletag.replace('#', '_')}`;
    }

    // Fallback to generic key if not logged in
    return 'guild_todos';
  }

  /**
   * Initialize the todo manager
   */
  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`TodoManager: Container #${this.containerId} not found`);
      return;
    }

    // Update storage key in case user logged in after construction
    this.storageKey = this.getStorageKey();

    // Load todos from backend (with localStorage fallback)
    await this.loadTodos();

    // Render the UI
    this.render();
  }

  /**
   * Load todos from backend (with localStorage fallback)
   */
  async loadTodos() {
    try {
      // Try backend first if user is authenticated
      if (this.authService?.isAuthenticated()) {
        console.log('🔄 Attempting to load todos from backend...');
        const backendData = await this.loadFromBackend();
        if (backendData) {
          this.todos = backendData;
          // Also save to localStorage for offline access
          localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
          console.log('✅ Loaded', this.todos.length, 'todos from backend');
          return;
        } else {
          console.log('⚠️ Backend returned no data, falling back to localStorage');
        }
      } else {
        console.log('⚠️ User not authenticated, using localStorage only');
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.todos = JSON.parse(stored);
        console.log('✅ Loaded', this.todos.length, 'todos from localStorage (key:', this.storageKey, ')');
      } else {
        console.log('ℹ️ No todos found in localStorage (key:', this.storageKey, ')');
      }
    } catch (error) {
      console.error('❌ Error loading todos:', error);
      this.todos = [];
    }
  }

  /**
   * Load todos from backend
   */
  async loadFromBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.apiUrl.replace('/api/fetch-metadata', '/api/user/todos')}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to load todos from backend:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading from backend:', error);
      return null;
    }
  }

  /**
   * Save todos to both localStorage and backend
   */
  async saveTodos() {
    try {
      // Save to localStorage (instant)
      localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
      console.log('💾 Saved', this.todos.length, 'todos to localStorage (key:', this.storageKey, ')');

      // Save to backend (async) if authenticated
      if (this.authService?.isAuthenticated()) {
        console.log('☁️ Syncing todos to backend...');
        this.saveToBackend().catch(err => {
          console.error('❌ Failed to sync todos to backend:', err);
        });
      } else {
        console.log('⚠️ Not syncing to backend - user not authenticated');
      }
    } catch (error) {
      console.error('❌ Error saving todos:', error);
    }
  }

  /**
   * Save todos to backend
   */
  async saveToBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return;

      const response = await fetch(`${this.apiUrl.replace('/api/fetch-metadata', '/api/user/todos')}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.todos)
      });

      if (response.ok) {
        console.log('☁️ Synced todos to backend');
      } else {
        console.warn('Failed to sync todos to backend:', response.status);
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
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
   * Add a new todo
   */
  async addTodo(todoData) {
    const todo = {
      id: Date.now(),
      title: todoData.title,
      description: todoData.description,
      url: todoData.url,
      image: todoData.image || null,
      createdAt: new Date().toISOString()
    };

    this.todos.unshift(todo); // Add to beginning
    this.saveTodos();
    this.renderGrid();
  }

  /**
   * Update an existing todo
   */
  async updateTodo(id, todoData) {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
      this.todos[index] = {
        ...this.todos[index],
        title: todoData.title,
        description: todoData.description,
        url: todoData.url,
        image: todoData.image || this.todos[index].image
      };
      this.saveTodos();
      this.renderGrid();
    }
  }

  /**
   * Edit a todo
   */
  editTodo(id) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      this.editingTodoId = id;
      this.openModal(todo);
    }
  }

  /**
   * Delete a todo
   */
  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.saveTodos();
    this.renderGrid();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      <div class="todos-header">
        <div class="todos-header-info">
          <h1>My Warcraft todos</h1>
          <span class="info-description">Organise your Warcraft activities with ease, farm mounts on Mondays leave a reminder, or find an interesting link to check back on, add it here.</span>
          <button class="btn-add-todo" id="btn-add-todo">
          <i class="las la-plus"></i>
          <span>Add Todo</span>
        </button>
        </div>
        
      </div>

      <div class="todos-grid" id="todos-grid"></div>

      <!-- Todo Form Modal -->
      <div class="todo-form-modal" id="todo-form-modal">
        <div class="todo-form-content">
          <h2>Add a Warcraft todo</h2>
          <form id="todo-form">
            <div class="form-group">
              <label for="todo-title">Title *</label>
              <input type="text" id="todo-title" placeholder="e.g. Farm Midnight Mount" required>
            </div>

            <div class="form-group">
              <label for="todo-description">Description *</label>
              <textarea id="todo-description" placeholder="e.g. Complete Karazhan on all characters" required></textarea>
            </div>

            <div class="form-group">
              <label for="todo-url">URL (optional)</label>
              <input type="url" id="todo-url" placeholder="Paste URL to fetch metadata from page">
              <div class="form-checkbox">
                <input type="checkbox" id="auto-fill-metadata" checked>
                <label for="auto-fill-metadata">Autofill from video metadata</label>
              </div>
              <div class="url-status" id="url-status"></div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" id="btn-cancel">Cancel</button>
              <button type="submit" class="btn-save">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('btn-add-todo').addEventListener('click', () => this.openModal());
    document.getElementById('btn-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('todo-form').addEventListener('submit', (e) => this.handleSubmit(e));

    // Auto-fetch metadata when URL is entered
    const urlInput = document.getElementById('todo-url');
    let urlTimeout;
    urlInput.addEventListener('input', (e) => {
      clearTimeout(urlTimeout);
      const url = e.target.value.trim();

      if (url && this.isValidUrl(url)) {
        urlTimeout = setTimeout(() => this.handleUrlInput(url), 800);
      }
    });

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

    if (this.todos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="las la-clipboard-list"></i>
          <p>No todos yet. Click "Add Todo" to create your first one!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.todos.map(todo => `
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
    const modal = document.getElementById('todo-form-modal');
    const modalTitle = modal.querySelector('h2');

    if (todo) {
      // Editing mode
      modalTitle.textContent = 'Edit Warcraft todo';
      document.getElementById('todo-title').value = todo.title;
      document.getElementById('todo-description').value = todo.description;
      document.getElementById('todo-url').value = todo.url || '';

      // Store image metadata if it exists
      if (todo.image) {
        const titleInput = document.getElementById('todo-title');
        titleInput.dataset.metadata = JSON.stringify({ image: todo.image });
      }
    } else {
      // Add mode
      modalTitle.textContent = 'Add a Warcraft todo';
    }

    modal.classList.add('active');
    document.getElementById('todo-title').focus();
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('todo-form-modal');
    modal.classList.remove('active');
    document.getElementById('todo-form').reset();
    document.getElementById('url-status').textContent = '';
    document.getElementById('url-status').className = 'url-status';
    this.editingTodoId = null;

    // Clear metadata
    const titleInput = document.getElementById('todo-title');
    delete titleInput.dataset.metadata;
  }

  /**
   * Handle URL input
   */
  async handleUrlInput(url) {
    const status = document.getElementById('url-status');
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const autoFillCheckbox = document.getElementById('auto-fill-metadata');

    status.textContent = 'Fetching metadata...';
    status.className = 'url-status loading';

    const metadata = await this.fetchMetadata(url);

    if (metadata) {
      // Auto-fill title and description if checkbox is checked
      if (autoFillCheckbox.checked) {
        if (metadata.title && !titleInput.value) {
          titleInput.value = metadata.title;
        }
        if (metadata.description && !descriptionInput.value) {
          descriptionInput.value = metadata.description;
        }
        status.textContent = '✓ Metadata loaded';
      } else {
        status.textContent = metadata.image ? '✓ Image loaded' : '✓ No image found';
      }
      status.className = 'url-status success';

      // Store metadata for later
      titleInput.dataset.metadata = JSON.stringify(metadata);
    } else {
      status.textContent = 'Could not fetch metadata';
      status.className = 'url-status error';
    }
  }

  /**
   * Handle form submit
   */
  async handleSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('todo-title');
    const urlInput = document.getElementById('todo-url');
    const descInput = document.getElementById('todo-description');

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
      alert('Please enter a title');
      return;
    }

    if (!description) {
      alert('Please enter a description');
      return;
    }

    // Get metadata if available (only for image)
    let metadata = null;
    try {
      metadata = titleInput.dataset.metadata ? JSON.parse(titleInput.dataset.metadata) : null;
    } catch (e) {}

    const todoData = {
      title,
      url: url || null,
      description: description,
      image: metadata?.image || null
    };

    if (this.editingTodoId) {
      // Update existing todo
      await this.updateTodo(this.editingTodoId, todoData);
    } else {
      // Add new todo
      await this.addTodo(todoData);
    }

    this.closeModal();
  }

  /**
   * Validate URL
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      // Format as "Jan 15, 2025"
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default TodoManager;
