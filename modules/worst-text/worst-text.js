const link = document.createElement("link");
link.rel = "stylesheet";
link.href = new URL("./worst-text.css", import.meta.url).href;
document.head.appendChild(link);

class WorstText extends HTMLElement {
  async connectedCallback() {
    const res = await fetch(new URL("./worst-text.html", import.meta.url));
    this.innerHTML = await res.text();
    this.init();
    this.dispatchEvent(
      new CustomEvent("component-loaded", {
        bubbles: true,
        detail: { count: this.querySelectorAll(".card").length },
      }),
    );
  }
  init() {
    const slider = this.querySelector(".ape-slider");
    const text = this.querySelector(".upside-down");

    slider.addEventListener("input", ()=>{
      const rotation = 180-slider.value;
      text.style.transform = `rotate(${rotation}deg)`;
      // console.log(rotation)
    })
  }
}

customElements.define("worst-text", WorstText);
