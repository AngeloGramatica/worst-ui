// worst-dice wird hier importiert — kein separater Script-Tag in index.html nötig.
// ES-Module werden nur einmal ausgeführt, auch wenn mehrere Stellen sie importieren.
import '../worst-dice/worst-dice.js';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-date.css', import.meta.url).href;
document.head.appendChild(link);


class WorstDate extends HTMLElement {

  async connectedCallback() {
    // DD.MM.YY: 6 Würfel, je 2 pro Ziffernpaar, getrennt durch Punkte
    const res = await fetch(new URL('./worst-date.html', import.meta.url));
    this.innerHTML = await res.text();

    this._dices = [...this.querySelectorAll('worst-dice')];
  }

  disconnectedCallback() {}
}

customElements.define('worst-date', WorstDate);
