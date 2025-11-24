/**
 * Footer Component - Renders credit and footer sections
 */
class Footer {
  constructor(containerId = 'footer-root') {
    this.containerId = containerId;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Footer: Container #${this.containerId} not found`);
      return;
    }

    this.render(container);
  }

  /**
   * Render the full footer structure with credit section
   */
  render(container) {
    container.innerHTML = `
      <section class="credit">
        <span class="credit-logo">crbntyp</span>
      </section>

      <footer class="footer">
        <p>Powered by Battle.net API | Made with <i class="las la-heart"></i></p>
      </footer>
    `;
  }
}

export default Footer;
