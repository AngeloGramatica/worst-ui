const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-slider.css', import.meta.url).href;
document.head.appendChild(link);

class WorstSlider extends HTMLElement {
  async connectedCallback() {
    const res = await fetch(new URL('./worst-slider.html', import.meta.url));
    this.innerHTML = await res.text();

    this._initSlider();
  }

  _initSlider() {
    // this.querySelector statt document.querySelector — so greift jede Instanz
    // nur auf ihre eigenen Elemente zu
    const slider        = this.querySelector('.slider');
    const grip          = this.querySelector('.grip-zone');
    const sliderWrapper = this.querySelector('.slider-wrapper');
    const valueDisplay  = this.querySelector('.value-display');

    const MAX_ANGLE  = 35;
    const SENSITIVITY = 4; // verhindert, dass der Slider bei kleiner Bewegung gleich ausschlägt

    let currentAngle = 0;
    let dragging     = false;
    let startY       = 0;

    // Winkel in einen Wert zwischen 0–100 umrechnen
    function angleToValue(angle) {
      const clamped = clamp(angle);
      return Math.round(((MAX_ANGLE + clamped) / (MAX_ANGLE * 2)) * 100);
    }

    // Winkel auf ±MAX_ANGLE begrenzen
    function clamp(angle) {
      return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));
    }

    function updateSlider(deltaY) {
      currentAngle = clamp(deltaY);
      sliderWrapper.style.transform = `rotate(${currentAngle}deg)`;

      const val = angleToValue(currentAngle);
      slider.value = val;
      valueDisplay.textContent = val;

      // Browser löst bei programmatischer Wertänderung kein input-Event aus —
      // manuell feuern damit andere Listener (falls vorhanden) reagieren können
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 1. Startposition der Maus beim Klick auf die Greifzone merken
    grip.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      e.preventDefault(); // verhindert Textauswahl während des Ziehens
    });

    // 2. Mausbewegung: Differenz zur Startposition berechnen und Slider updaten
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      updateSlider((e.clientY - startY) / SENSITIVITY);
    });

    // 3. Maus losgelassen: Dragging beenden
    window.addEventListener('mouseup', () => {
      dragging = false;
    });

    // Direktes Ziehen am Slider-Track soll auch den Wert anzeigen
    slider.addEventListener('input', (e) => {
      valueDisplay.textContent = e.target.value;
    });
  }
}

customElements.define('worst-slider', WorstSlider);
