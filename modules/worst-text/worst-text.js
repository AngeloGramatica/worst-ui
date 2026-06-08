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
    // Toggle: Blinken ein/ausschalten via animation-play-state
    const blinkSwitch = this.querySelector(".blink-switch");
    const blinkCard = this.querySelector(".blink-card");

    blinkSwitch.addEventListener("change", () => {
      // .blink-off auf der Card pausiert alle Animationen darin (siehe CSS)
      blinkCard.classList.toggle("blink-off", blinkSwitch.checked);
    });

    // Slider: Text rotieren
    const slider = this.querySelector(".ape-slider");
    const text = this.querySelector(".upside-down");

    slider.addEventListener("input", () => {
      const rotation = 180 - slider.value;
      text.style.transform = `rotate(${rotation}deg)`;
    });

    // 7: Autocorrect — ersetzt das letzte Wort nach jedem Leerschlag durch ein falsches
    const wrongWords = [
      "Kartoffel", "Steuererklärung", "Nilpferd", "Weltuntergang",
      "Schnitzel", "Pommes", "Urlaub", "Banane", "Chaos", "Gesundheit"
    ];
    const autocorrectInput = this.querySelector(".autocorrect-input");
    const autocorrectPreview = this.querySelector(".autocorrect-preview");
    let correctedWords = [];

    autocorrectInput.addEventListener("keyup", (e) => {
      // Nach Leerschlag: letztes Wort durch ein zufälliges ersetzen
      if (e.key === " ") {
        const words = autocorrectInput.value.trim().split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord) {
          const replacement = wrongWords[Math.floor(Math.random() * wrongWords.length)];
          correctedWords.push(replacement);
        }
        autocorrectPreview.textContent = "Autocorrect: " + correctedWords.join(" ");
      }
    });

    // 8: Self-delete — Text löscht sich nach 1s Inaktivität Buchstabe für Buchstabe
    const selfDeleteInput = this.querySelector(".self-delete-input");
    let deleteTimeout = null;  // wartet auf Inaktivität bevor das Löschen startet
    let deleteInterval = null; // tickt jeden gelöschten Buchstaben

    selfDeleteInput.addEventListener("input", () => {
      // Jede neue Eingabe bricht den laufenden Lösch-Countdown ab.
      // Ohne clearTimeout würden mehrere Timeouts parallel laufen
      // und das Löschen würde immer schneller werden.
      clearTimeout(deleteTimeout);
      clearInterval(deleteInterval);

      // Erst nach 1s ohne Eingabe beginnt der Lösch-Prozess
      deleteTimeout = setTimeout(() => {

        // setInterval löscht alle 80ms einen Buchstaben von hinten
        // slice(0, -1) gibt den String ohne das letzte Zeichen zurück
        deleteInterval = setInterval(() => {
          if (selfDeleteInput.value.length > 0) {
            selfDeleteInput.value = selfDeleteInput.value.slice(0, -1);
          } else {
            // Wenn der Input leer ist: Interval stoppen, sonst läuft es endlos
            clearInterval(deleteInterval);
          }
        }, 80);
      }, 1000);
    });
  }
}

customElements.define("worst-text", WorstText);
