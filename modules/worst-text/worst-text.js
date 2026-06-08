const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-text.css', import.meta.url).href;
document.head.appendChild(link);

class WorstText extends HTMLElement {
  async connectedCallback() {
    const res = await fetch(new URL('./worst-text.html', import.meta.url));
    this.innerHTML = await res.text();
    this.dispatchEvent(new CustomEvent("component-loaded", {
      bubbles: true,
      detail: { count: this.querySelectorAll(".card").length }
    }));
  }
}

customElements.define('worst-text', WorstText);
