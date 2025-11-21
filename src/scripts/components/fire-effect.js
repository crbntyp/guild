/**
 * Fire Effect Component
 * Adds subtle flames and rising cinders to the bottom of the page
 */

class FireEffect {
  constructor() {
    this.container = null;
  }

  init() {
    // Create the fire effect container
    this.container = document.createElement('div');
    this.container.className = 'fire-effect';

    // Create cinders container
    const cinders = document.createElement('div');
    cinders.className = 'cinders';

    // Add 10 cinder particles
    for (let i = 0; i < 10; i++) {
      const cinder = document.createElement('div');
      cinder.className = 'cinder';
      cinders.appendChild(cinder);
    }

    this.container.appendChild(cinders);
    document.body.appendChild(this.container);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default new FireEffect();
