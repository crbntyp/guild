/**
 * PageHeader Component
 * Generates standardized page header HTML
 * Used by: TodoManager, YouTubeManager, and potentially other pages
 */

class PageHeader {
  /**
   * Render a page header with title, description, and optional action button
   *
   * @param {Object} options - Configuration options
   * @param {string} options.className - Base CSS class name (e.g., 'todos', 'youtube', 'gallery')
   * @param {string} options.title - Page title (e.g., 'My Todos', 'My YouTube')
   * @param {string} options.description - Page description text
   * @param {Object} options.actionButton - Optional action button configuration
   * @param {string} options.actionButton.id - Button ID
   * @param {string} options.actionButton.icon - Line Awesome icon class (e.g., 'la-plus')
   * @param {string} options.actionButton.text - Button text
   * @returns {string} HTML string for the page header
   */
  static render(options) {
    const {
      className = 'page',
      title = '',
      description = '',
      actionButton = null
    } = options;

    const actionButtonHTML = actionButton ? `
      <button class="page-header-action ${actionButton.id}" id="${actionButton.id}">
        <i class="las ${actionButton.icon}"></i>
        <span>${actionButton.text}</span>
      </button>
    ` : '';

    return `
      <div class="${className}-header page-header-panel">
        <div class="page-header-content">
          <div class="page-header-text">
            <h1>${title}</h1>
            <p class="page-header-desc">${description}</p>
          </div>
          ${actionButtonHTML}
        </div>
        <div class="page-header-border"></div>
      </div>
    `;
  }
}

export default PageHeader;
