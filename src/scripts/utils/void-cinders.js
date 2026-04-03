/**
 * Adds void cinder particles to a modal element.
 * Call with the modal container (not the overlay).
 */
export function addVoidCinders(element) {
  if (!element || element.querySelector('.void-cinders')) return;
  const cinders = document.createElement('div');
  cinders.className = 'void-cinders';
  for (let i = 0; i < 8; i++) {
    cinders.appendChild(document.createElement('span'));
  }
  element.prepend(cinders);
}
