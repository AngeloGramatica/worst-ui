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

    //zum zählen der Buttons
    this.dispatchEvent(
      new CustomEvent("component-loaded", {
        bubbles: true,
        detail: { count: this.querySelectorAll(".card").length },
      }),
    );
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

    const wB13 = this.querySelector(".wB13");

    const wB14 = this.querySelector(".wB14");

    const wB14Box = wB14.closest(".magic-box");

    const option1 = this.querySelector("#option1");
    const option2 = this.querySelector("#option2");

    //Slimy
    const wB10Box = wB10.closest(".magic-box");

    const generator = this.querySelector(".generator");
    const genNums = Array.from(this.querySelectorAll(".genNum"));

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

    // Spans initialisieren (Text in <span> wrappen für Animation)
    genNums.forEach((el) => {
      const span = document.createElement("span");
      span.textContent = el.textContent;
      el.textContent = "";
      el.appendChild(span);
    });

    // Eine einzelne Ziffer einblenden (altes span raus, neues rein)
    function swapDigit(el, value, duration) {
      return new Promise((resolve) => {
        const oldSpan = el.querySelector("span");

        const newSpan = document.createElement("span");
        newSpan.textContent = value;
        newSpan.style.transform = "translateY(20px)";
        newSpan.style.opacity = "0";
        el.appendChild(newSpan);

        newSpan.getBoundingClientRect();

        if (oldSpan) {
          oldSpan.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
          oldSpan.style.transform = "translateY(-20px)";
          oldSpan.style.opacity = "0";
        }
        newSpan.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
        newSpan.style.transform = "translateY(0)";
        newSpan.style.opacity = "1";

        setTimeout(() => {
          if (oldSpan) oldSpan.remove();
          resolve();
        }, duration);
      });
    }

    // Ziffer 5–7x mit Zufallszahlen spinnen, dann auf Zielwert einrasten
    async function animateDigit(el, finalValue) {
      const spins = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < spins; i++) {
        const rand = Math.floor(Math.random() * 10);
        await swapDigit(el, rand, 80);
      }
      await swapDigit(el, finalValue, 120);
    }

    let runId = 0;

    generator.addEventListener("click", async () => {
      runId++;
      const myRun = runId;

      // Animierte Ziffern (ab Index 2) auf "x" zurücksetzen
      for (let i = 2; i < genNums.length; i++) {
        genNums[i].innerHTML = "<span>x</span>";
      }

      const prefix = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
      const finalDigits = [
        null, // genNums[0]: fixe "0", wird nicht animiert
        7,
        prefix,
        ...Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)),
      ];

      for (let i = 2; i < genNums.length; i++) {
        if (myRun !== runId) return;
        await animateDigit(genNums[i], finalDigits[i]);
        await sleep(80);
      }
    });

    /****************** EventListener "Will you marry me?" ***************** */
    wB14.addEventListener("mouseenter", () => {
      const x = Math.floor((Math.random()*100 + 20) * (Math.random() < 0.5 ? 1 : -1));
      const y = Math.floor((Math.random()*100 + 20) * (Math.random() < 0.5 ? 1 : -1));

      wB14.style.transform = `translate(${x}px, ${y}px)`;
    });

    /****************** EventListener wB15 - Split ***************** */
    const wB15Wrapper = this.querySelector(".wB15-wrapper");
    wB15Wrapper.addEventListener("click", () => {
      wB15Wrapper.classList.toggle("split");
    });
  }
}

customElements.define("worst-buttons", WorstButtons);
