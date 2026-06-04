const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-matrix.css', import.meta.url).href;
document.head.appendChild(link);

const COLS = 50;
const ROWS = 20;

class WorstMatrix extends HTMLElement {

  async connectedCallback() {
    const res = await fetch(new URL('./worst-matrix.html', import.meta.url));
    this.innerHTML = await res.text();

    this._buildMatrix();
    this._initInteraction();
  }

  _buildMatrix() {
    const grid = this.querySelector('.matrix-grid');

    // 50 × 20 = 1000 Checkboxen per Fragment einfügen (performanter als
    // 1000× einzeln ans DOM anhängen)
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < COLS * ROWS; i++) {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      fragment.appendChild(cb);
    }

    grid.appendChild(fragment);
  }

  _initInteraction() {
    const grid = this.querySelector('.matrix-grid');
    let isSelecting = false;

    // Maus gedrückt auf einer Checkbox: Selektion starten
    grid.addEventListener('mousedown', (e) => {
      if (e.target.type === 'checkbox') {
        isSelecting = true;
        e.target.checked = true;
        e.preventDefault(); // verhindert Textauswahl beim Ziehen
      }
    });

    // Über Checkbox fahren während Maus gedrückt: anwählen
    grid.addEventListener('mouseover', (e) => {
      if (isSelecting && e.target.type === 'checkbox') {
        e.target.checked = true;
      }
    });

    // Maus losgelassen — auf window damit es auch ausserhalb des Grids feuert
    window.addEventListener('mouseup', () => {
      isSelecting = false;
    });
  }
}

customElements.define('worst-matrix', WorstMatrix);
