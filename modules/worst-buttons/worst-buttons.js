// CSS einmal beim Laden des Moduls einfügen (nicht bei jeder Instanz)
const link = document.createElement("link");
link.rel = "stylesheet";
// import.meta.url gibt die URL dieser JS-Datei zurück — so ist der CSS-Pfad
// immer relativ zu diesem Modul, egal von wo index.html geladen wird
link.href = new URL("./worst-buttons.css", import.meta.url).href;
document.head.appendChild(link);

class WorstButtons extends HTMLElement {
  // connectedCallback wird aufgerufen sobald das Element ins DOM eingefügt wird
  async connectedCallback() {
    const res = await fetch(new URL("./worst-buttons.html", import.meta.url));
    this.innerHTML = await res.text();
    this.init();
  }

  init() {
    // Alle <a>-Elemente: Seitenreload durch leeres href="" verhindern
    this.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", (e) => e.preventDefault());
    });

    const buttonWb8 = this.querySelector(".wB8");
    const wB8Box = buttonWb8.closest(".magic-box");

    const buttonWb9 = this.querySelector(".wB9");
    const fullScreen = this.querySelector(".full-screen");

    const denButton = fullScreen.querySelector(".denButton");

    const wB10 = this.querySelector(".wB10");
    const wB11 = this.querySelector(".wB11");

    const wB12 = this.querySelector(".wB12");
    const option1 = this.querySelector("#option1");
    const option2 = this.querySelector("#option2");

    const wB10Box = wB10.closest(".magic-box");

    //****************** EventListener WB8 ***************** */
    buttonWb8.addEventListener("click", () => {
      // Button durch Text ersetzen
      buttonWb8.style.display = "none";
      const msg = document.createElement("p");
      msg.textContent = "Du must fester drücken!";
      wB8Box.appendChild(msg);

      // Nach 2 Sekunden Text entfernen und Button zurückbringen
      setTimeout(() => {
        msg.remove();
        buttonWb8.style.display = "";
      }, 2000);
    });

    //****************** EventListener WB9 ***************** */
    buttonWb9.addEventListener("click", () => {
      fullScreen.classList.add("show");
    });

    let clickCount = 0;
    denButton.addEventListener("click", () => {
      clickCount++;
      if (clickCount === 5) {
        const msg = document.createElement("p");
        msg.textContent = "Weils so schön war, gleich noch 5 mal!";
        fullScreen.appendChild(msg);
      }
      if (clickCount >= 10) {
        location.reload();
        clickCount = 0;
      }
    });

    /****************** EventListener WB10 - Slimy ***************** */
    // Aktuelle Position des Buttons als Offset von der Mitte
    let offsetX = 0;
    let offsetY = 0;

    wB10Box.addEventListener("mousemove", (e) => {
      const btnRect = wB10.getBoundingClientRect();

      // Mitte des Buttons
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;

      // Distanz Maus → Button
      const dx = e.clientX - btnCenterX;
      const dy = e.clientY - btnCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Nur reagieren wenn Maus innerhalb von 100px
      if (dist < 100) {
        // Entgegengesetzte Richtung, 10px Schritt
        offsetX -= (dx / dist) * 10;
        offsetY -= (dy / dist) * 10;

        wB10.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
      }
    });

    
    /****************** EventListener WB11 - Monster ***************** */
    let running = false;
    
    wB11.addEventListener("click", () => {
      running = !running;
      growLoop();
    });

    // Hilfsfunktion: wartet x Millisekunden
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function growLoop() {
      let scale = 1;
      let counter = 0;
      while (running && counter < 100) {
        scale += 0.2;
        wB11.style.transform = `translate(-50%, -50%) scale(${scale})`;
        await sleep(50);
        counter++;
      }
    }

    // Array.from generiert die Pfade automatisch aus der Anzahl Dateien
    const soundsOption1 = Array.from(
      { length: 11 },
      (_, i) => `sounds/peasant${i + 1}.wav`,
    );
    const soundsOption2 = Array.from(
      { length: 7 },
      (_, i) => `sounds/human${i + 1}.wav`,
    );

    let idx1 = 0;
    let idx2 = 0;

    /****************** EventListener WB12 ***************** */
    wB12.addEventListener("click", () => {
      if (option1.checked) {
        // Bauer
        new Audio(soundsOption1[idx1]).play();
        idx1 = (idx1 + 1) % soundsOption1.length;
      }
      if (option2.checked) {
        // Soldat
        new Audio(soundsOption2[idx2]).play();
        idx2 = (idx2 + 1) % soundsOption2.length;
      }
    });
  }
}

customElements.define("worst-buttons", WorstButtons);