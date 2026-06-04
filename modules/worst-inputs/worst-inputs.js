// worst-slider muss zuerst importiert werden, damit der Browser <worst-slider>
// kennt bevor connectedCallback das HTML rendert
import "../worst-slider/worst-slider.js";

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = new URL("./worst-inputs.css", import.meta.url).href;
document.head.appendChild(link);

class WorstInputs extends HTMLElement {
  async connectedCallback() {
    const res = await fetch(new URL("./worst-inputs.html", import.meta.url));
    this.innerHTML = await res.text();

    this.initForms();
    this.initNameSearch(); // async — läuft parallel, blockiert nicht den Rest
    this.initRangeInput();
    this.initCheckboxInput();
  }

  // #region Namenssuche (Formular 11)

  async initNameSearch() {
    const letterContainer = this.querySelector("#name-letter-dropdowns");
    const resultsList = this.querySelector("#name-results");
    const selectedValue = this.querySelector("#name-selected-value");

    // 4 Buchstaben-Dropdowns generieren (A–Z + leere Option)
    const selects = Array.from({ length: 4 }, () => {
      const sel = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "–";
      sel.appendChild(empty);
      for (let code = 65; code <= 90; code++) {
        const opt = document.createElement("option");
        opt.value = opt.textContent = String.fromCharCode(code);
        sel.appendChild(opt);
      }
      letterContainer.appendChild(sel);
      return sel;
    });

    // Einmalig 400 deutsche Vornamen von randomuser.me laden und alphabetisch sortieren.
    // Danach wird nur noch client-seitig gefiltert — kein weiterer API-Call nötig.
    let names = [];
    try {
      const res = await fetch("https://randomuser.me/api/?results=400&nat=de");
      const data = await res.json();
      names = data.results
        .map((p) => p.name.first)
        // Duplikate entfernen, dann alphabetisch sortieren
        .filter((name, i, arr) => arr.indexOf(name) === i)
        .sort();
    } catch (err) {
      resultsList.innerHTML = "<li>Namen konnten nicht geladen werden.</li>";
      return;
    }

    // Filtert den gespeicherten Namen-Array nach dem aktuellen Präfix
    // und aktualisiert die Trefferliste.
    const updateResults = () => {
      // Prefix = alle gewählten Buchstaben zusammengesetzt (leere Dropdowns ignoriert)
      const prefix = selects
        .map((s) => s.value)
        .join("")
        .toLowerCase();

      if (!prefix) {
        resultsList.innerHTML = "";
        return;
      }

      const matches = names
        .filter((name) => name.toLowerCase().startsWith(prefix))
        .slice(0, 10); // max. 10 Treffer

      resultsList.innerHTML = matches.length
        ? matches.map((name) => `<li>${name}</li>`).join("")
        : "<li>Keine Treffer</li>";

      // Klick auf einen Namen → in Anzeigefeld übernehmen
      resultsList.querySelectorAll("li").forEach((li, i) => {
        li.addEventListener("click", () => {
          selectedValue.textContent = matches[i];
        });
      });
    };

    selects.forEach((sel) => sel.addEventListener("change", updateResults));
  }

  // #endregion

  // #region Formulare

  initForms() {
    // #region Formular 1 — Selbstlöschende Felder

    this.querySelectorAll("#name_1, #email_1").forEach((input) => {
      input.addEventListener("blur", () => {
        this.querySelectorAll("input").forEach((i) => (i.value = ""));
      });
    });

    // #endregion

    // #region Formular 3 — Button deaktiviert sich beim Blur

    const sendBtn = this.querySelector("#button_3");
    this.querySelectorAll("#name_3, #email_3").forEach((input) => {
      input.addEventListener("input", () => {
        sendBtn.disabled = false;
      });
      input.addEventListener("blur", () => {
        sendBtn.disabled = true;
      });
    });

    // #endregion

    // #region Formular 5 — Alters-Zähler

    const counter = this.querySelector("#counter");
    const btn = this.querySelector("#toggle-btn");

    let count = 0;
    let direction = 1;
    let running = false;
    let timeout = null;

    // Easing-Funktion: langsam → schnell → langsam (Sinus-Kurve)
    function easeInOut(t) {
      return Math.pow(Math.sin(t * Math.PI), 4);
    }

    function step() {
      if (!running) return;
      count += direction;
      if (count >= 100) direction = -1;
      if (count <= 0) direction = 1;
      counter.textContent = count;
      const delay = 150 - easeInOut(count / 100) * 145;
      timeout = setTimeout(step, delay);
    }

    btn.addEventListener("click", () => {
      if (running) {
        running = false;
        clearTimeout(timeout);
        btn.textContent = "Start";
      } else {
        running = true;
        btn.textContent = "Stop";
        step();
      }
    });

    // #endregion

    // #region Formular 6 — Radio-Captcha

    // querySelectorAll gibt eine NodeList zurück — kein echtes Array.
    // Spread [...] konvertiert sie damit forEach, map etc. funktionieren.
    const radioBtns = [...this.querySelectorAll(".radio-btn")];
    const unlockCount = this.querySelector("#unlock-counter");
    const unlockEmail = this.querySelector("#unlock-email");
    const unlockPw = this.querySelector("#unlock-pw");

    const REQUIRED = 4;
    let streak = 0;
    let activeIndex = null;

    function lightRandom() {
      radioBtns.forEach((r) => r.classList.remove("active"));
      activeIndex = Math.floor(Math.random() * radioBtns.length);
      radioBtns[activeIndex].classList.add("active");
    }

    const captchaInterval = setInterval(lightRandom, 1200);
    lightRandom();

    radioBtns.forEach((btn, i) => {
      btn.addEventListener("click", (e) => {
        // Ein <label> das einen <input> umschliesst feuert den Click zweimal.
        // preventDefault() verhindert die zweite Auslösung durch den Browser.
        e.preventDefault();

        if (i === activeIndex) {
          streak++;
          unlockCount.textContent = streak;

          if (streak >= REQUIRED) {
            clearInterval(captchaInterval);
            radioBtns.forEach((r) => r.classList.remove("active"));
            unlockEmail.disabled = false;
            unlockPw.disabled = false;
            unlockCount.textContent = "✓ Freigeschaltet!";
          }
        } else {
          // Falscher Klick: kurzes rotes Feedback, Streak zurücksetzen
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 400);
          streak = 0;
          unlockCount.textContent = streak;
        }
      });
    });

    // #endregion

    // #region Formular 7 — Vertauschte Felder

    const swapEmail = this.querySelector("#swap-email");
    const swapPw = this.querySelector("#swap-pw");

    // Leitet Tastatureingaben vom Quell- ins Zielfeld um.
    // keydown statt input, damit preventDefault() greift bevor das Zeichen
    // ins falsche Feld geschrieben wird.
    function redirectInput(source, target) {
      source.addEventListener("keydown", (e) => {
        if (e.key.length === 1) {
          e.preventDefault();
          target.value += e.key;
        } else if (e.key === "Backspace") {
          e.preventDefault();
          target.value = target.value.slice(0, -1);
        }
      });
    }

    redirectInput(swapEmail, swapPw);
    redirectInput(swapPw, swapEmail);

    // #endregion

    // #region Formular 9 — Alphabet-Dropdowns (Vor- und Nachname)

    // Erstellt n Dropdowns mit A–Z Optionen in einem Container.
    // DocumentFragment sammelt alle Elemente vor dem DOM-Insert —
    // performanter als n× einzeln appendChild aufzurufen.
    function buildAlphabetDropdowns(containerId, count) {
      const container = this.querySelector(`#${containerId}`);
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < count; i++) {
        const select = document.createElement("select");
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "_";
        select.appendChild(empty);

        // A=65, Z=90 in ASCII
        for (let code = 65; code <= 90; code++) {
          const option = document.createElement("option");
          option.value = option.textContent = String.fromCharCode(code);
          select.appendChild(option);
        }

        fragment.appendChild(select);
      }

      container.appendChild(fragment);
    }

    // .call(this) nötig weil buildAlphabetDropdowns this.querySelector verwendet
    // und this innerhalb einer normalen Funktion sonst undefined wäre
    buildAlphabetDropdowns.call(this, "firstname-dropdowns", 10);
    buildAlphabetDropdowns.call(this, "lastname-dropdowns", 10);

    // #endregion

    // #region Formular 10 — Wandernder Submit-Button

    const roamingContainer = this.querySelector(".roaming-container");
    const roamingBtn = this.querySelector("#roaming-btn");
    const roamingEmail = this.querySelector("#roaming-email");

    let x = 0;
    let y = 0;
    let phase = 0; // 0=rechts, 1=runter, 2=links, 3=hoch
    let moving = false; // startet erst wenn E-Mail eingetragen ist
    const speed = 5;

    const animateRoaming = () => {
      if (moving) {
        const maxX = roamingContainer.clientWidth - roamingBtn.offsetWidth;
        const maxY = roamingContainer.clientHeight - roamingBtn.offsetHeight;

        if (phase === 0) {
          x += speed;
          if (x >= maxX) {
            x = maxX;
            phase = 1;
          }
        } else if (phase === 1) {
          y += speed;
          if (y >= maxY) {
            y = maxY;
            phase = 2;
          }
        } else if (phase === 2) {
          x -= speed;
          if (x <= 0) {
            x = 0;
            phase = 3;
          }
        } else {
          y -= speed;
          if (y <= 0) {
            y = 0;
            phase = 0;
          }
        }

        roamingBtn.style.left = x + "px";
        roamingBtn.style.top = y + "px";
      }
      requestAnimationFrame(animateRoaming);
    };

    roamingBtn.disabled = true;

    roamingEmail.addEventListener("input", () => {
      const hasEmail = roamingEmail.value.trim().length > 0;
      roamingBtn.disabled = !hasEmail;
      moving = hasEmail;
    });

    animateRoaming();

    // #endregion

    // #region Passwort-Formular — Schrittweise Bestätigung

    const pw = this.querySelector("#password");
    const pwConf = this.querySelector("#password_confirm");
    const pw1 = this.querySelector("#pw-1");
    const pw1Input = this.querySelector("#password_confirm2");
    const pw2 = this.querySelector("#pw-2");
    const pw2Input = this.querySelector("#password_confirm3");
    const submitPw = this.querySelector("#submit_password");

    // Schritt 1: erstes Bestätigungsfeld → pw-1 einblenden
    pwConf.addEventListener("input", () => {
      if (pw.value.length > 0 && pwConf.value.length > 0) {
        pw1.style.display = "grid";
      }
    });

    // Schritt 2: pw-1 ausgefüllt → pw-2 einblenden
    pw1Input.addEventListener("input", () => {
      if (pw1Input.value.length > 0) pw2.style.display = "grid";
    });

    // Schritt 3: pw-2 ausgefüllt → Submit aktivieren
    pw2Input.addEventListener("input", () => {
      submitPw.disabled = pw2Input.value.length === 0;
    });

    submitPw.addEventListener("click", (e) => {
      e.preventDefault();
      alert(
        "Das Passwort entspricht nicht den Vorgaben. " +
          "Es muss mindestens 72 Zeichen lang sein und folgende Sonderzeichen beinhalten: " +
          "%, §, ☃, ψ, ꙮ, ‽, ⸘, 𓂀, ⛧ sowie mindestens drei Emojis die nicht im Unicode-Standard enthalten sind. " +
          "Ausserdem darf das Passwort weder Vokale noch Konsonanten enthalten, " +
          "muss rückwärts gelesen einen Satz auf Klingonisch ergeben, " +
          "und darf auf keinen Fall Ihr tatsächliches Passwort sein. " +
          "Die Gross-/Kleinschreibung muss zufällig sein, jedoch nicht zu zufällig. " +
          "Das Passwort darf nicht das gleiche sein wie Ihr letztes Passwort, " +
          "Ihr vorletztes Passwort, oder irgendeines der 847 vorherigen Passwörter. " +
          "Aus Sicherheitsgründen wurde Ihr Passwort bereits an Ihre Grossmutter weitergeleitet.",
      );

      [pw, pwConf, pw1Input, pw2Input].forEach((i) => (i.value = ""));
      pw1.style.display = "none";
      pw2.style.display = "none";
      submitPw.disabled = true;
    });

    // #endregion
  }

  // #endregion

  //#region Range Input
  initRangeInput() {
    //#region Phone Input
    const phoneInput = this.querySelectorAll(".phone-input");
    phoneInput.forEach((input) => {
      input.addEventListener("input", () => {
        const digit = input.nextElementSibling;
        digit.textContent = input.value || "0";
      });
    });
    //#endregion
  }
  //#endregion

  initCheckboxInput() {
    const binaryZip = this.querySelector(".binary-zip");
    const zips = binaryZip.querySelectorAll(".binary-digit");
    const result = this.querySelector(".binary-result");
    let total = 0;

    function calcTotal() {}

    zips.forEach((digit) => {
      const checkBox = digit.querySelector(".binary-input");
      checkBox.addEventListener("change", () => {
        const number = checkBox.nextElementSibling;
        const zahl = parseInt(checkBox.id.split('-')[1]);
        if (checkBox.checked) {
          number.textContent = "1";
          total += zahl;
        } else {
          number.textContent = "0";
          total -= zahl; 
        }
        result.textContent = total;
      });
    });
  }
}

customElements.define("worst-inputs", WorstInputs);
