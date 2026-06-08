const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-flowfield.css', import.meta.url).href;
document.head.appendChild(link);

class WorstFlowfield extends HTMLElement {
  async connectedCallback() {
    const res = await fetch(new URL('./worst-flowfield.html', import.meta.url));
    this.innerHTML = await res.text();
    this.dispatchEvent(new CustomEvent("component-loaded", {
      bubbles: true,
      detail: { count: this.querySelectorAll(".card").length }
    }));

    // p5 muss global verfügbar sein (via <script src="p5.js"> in index.html)
    this._initP5();
  }

  _initP5() {
    // Zweites Argument "c" sagt p5, dass es den Canvas in das Element mit
    // id="c" einsetzen soll statt in den body
    new p5(function (p) {
      const CIRCLE_RADIUS  = 12;
      const MAX_SELECTED   = 4;
      const RESOLUTION     = 10;
      const SPAWN_DURATION = 15000;
      const SELECTED_COLORS = ['#5DCAA5', '#AFA9EC', '#F0997B', '#FAC775'];

      const CANVAS_W     = 620;
      const CANVAS_H     = 340;
      const FIELD_W      = CANVAS_W - 150;
      const MAX_BUBBLES  = 31;
      const MAX_FORCE    = 0.5;
      const CYCLE_DURATION = 100000;

      let flowfield, bubbles;
      let selected  = [];
      let slots     = [0, 0, 0, 0];
      let startTime;
      let started   = false;

      p.setup = function () {
        let cnv = p.createCanvas(CANVAS_W, CANVAS_H);
        cnv.parent('c');
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('monospace');

        startTime = p.millis();
        flowfield = new FlowField(RESOLUTION);

        // Zahlen 1–MAX_BUBBLES mischen und auf Bubbles verteilen
        let numbers = [];
        for (let n = 1; n <= MAX_BUBBLES; n++) numbers.push(n);
        p.shuffle(numbers, true);

        bubbles = [];
        for (let i = 0; i < MAX_BUBBLES; i++) {
          bubbles.push(new Bubble((FIELD_W / 100) * i, CANVAS_H / 2, p.random(0.8, 2), numbers[i]));
        }
      };

      p.draw = function () {
        p.background('#FAEB92');
        if (!started) return;

        let elapsed = p.millis() - startTime;
        if (elapsed >= CYCLE_DURATION) {
          flowfield.init();
          startTime = p.millis();
          elapsed   = 0;
        }

        // Bubbles tauchen nach und nach auf (nicht alle auf einmal)
        let visibleCount = Math.min(
          Math.floor((bubbles.length / (SPAWN_DURATION / 1000)) * (elapsed / 1000)),
          bubbles.length,
        );

        for (let i = 0; i < visibleCount; i++) {
          bubbles[i].follow(flowfield);
          bubbles[i].run();
        }

        drawSlots();
      };

      p.mousePressed = function () {
        let elapsed = p.millis() - startTime;
        let visibleCount = Math.min(
          Math.floor((bubbles.length / (SPAWN_DURATION / 1000)) * (elapsed / 1000)),
          bubbles.length,
        );
        for (let i = 0; i < visibleCount; i++) {
          let v = bubbles[i];
          if (p.dist(p.mouseX, p.mouseY, v.pos.x, v.pos.y) < CIRCLE_RADIUS) {
            let idx = selected.indexOf(v);
            if (idx !== -1) {
              // Bubble abwählen
              slots[idx] = 0;
              v.selectedColor = null;
              selected.splice(idx, 1);
            } else if (selected.length < MAX_SELECTED) {
              // Bubble in den nächsten freien Slot setzen
              let slotIdx = slots.indexOf(0);
              slots[slotIdx] = v.value;
              v.selectedColor = SELECTED_COLORS[slotIdx];
              selected.push(v);
            }
            break;
          }
        }
      };

      function drawSlots() {
        let sx = FIELD_W + 10, sy = 16, sw = 118, sh = 64, gap = 8;
        for (let i = 0; i < 4; i++) {
          let y = sy + i * (sh + gap);
          let hasVal = slots[i] !== 0;
          p.stroke('#B4B2A9');
          p.strokeWeight(1);
          p.fill(hasVal ? SELECTED_COLORS[i] + '33' : '#F1EFE8');
          p.rect(sx, y, sw, sh, 6);
          p.noStroke();
          p.fill('#888780');
          p.textSize(10);
          p.textStyle(p.NORMAL);
          p.text('slot ' + (i + 1), sx + sw / 2, y + 13);
          p.fill(hasVal ? '#2C2C2A' : '#B4B2A9');
          p.textSize(hasVal ? 26 : 16);
          p.textStyle(p.BOLD);
          p.text(hasVal ? slots[i] : '—', sx + sw / 2, y + sh / 2 + 7);
        }
      }

      function Bubble(x, y, speed, value) {
        this.pos          = p.createVector(x, y);
        this.vel          = p.createVector(0, 0);
        this.acc          = p.createVector(0, 0);
        this.maxSpeed     = speed;
        this.maxForce     = MAX_FORCE;
        this.value        = value;
        this.selectedColor = null;

        this.follow = function (ff) {
          let desired = ff.lookup(this.pos);
          desired.mult(this.maxSpeed);
          let steer = p5.Vector.sub(desired, this.vel);
          steer.limit(this.maxForce);
          this.acc.add(steer);
        };

        this.run = function () {
          this.vel.add(this.acc);
          this.vel.limit(this.maxSpeed);
          this.pos.add(this.vel);
          this.acc.mult(0);
          this.borders();
          this.display();
        };

        this.borders = function () {
          let r = CIRCLE_RADIUS;
          if (this.pos.x < r)       this.pos.x = FIELD_W - r;
          if (this.pos.x > FIELD_W) this.pos.x = r;
          if (this.pos.y < r)       this.pos.y = CANVAS_H - r;
          if (this.pos.y > CANVAS_H) this.pos.y = r;
        };

        this.display = function () {
          let isHover    = p.dist(p.mouseX, p.mouseY, this.pos.x, this.pos.y) < CIRCLE_RADIUS;
          let isSelected = this.selectedColor !== null;
          p.stroke(isSelected ? this.selectedColor : isHover ? '#1D9E75' : '#B4B2A9');
          p.strokeWeight(isSelected ? 2.5 : isHover ? 2 : 1);
          p.fill(isSelected ? this.selectedColor + '44' : '#F1EFE8');
          p.circle(this.pos.x, this.pos.y, CIRCLE_RADIUS * 2);
          p.noStroke();
          p.fill(isSelected ? '#2C2C2A' : '#5F5E5A');
          p.textSize(this.value >= 100 ? 10 : 12);
          p.textStyle(p.BOLD);
          p.text(this.value, this.pos.x, this.pos.y);
        };
      }

      function FlowField(res) {
        this.res  = res;
        this.cols = Math.floor(FIELD_W / res);
        this.rows = Math.floor(CANVAS_H / res);
        this.field = [];

        this.init = function () {
          this.field = [];
          for (let i = 0; i < this.cols; i++) {
            this.field[i] = [];
            for (let j = 0; j < this.rows; j++) {
              // Vektorfeld: Kreisbewegung basierend auf Gitterposition
              this.field[i][j] = p.createVector(this.rows / 2 - j, -1 * (this.cols / 2 - i));
            }
          }
        };
        this.init();

        this.lookup = function (pos) {
          let col = Math.floor(p.constrain(pos.x / this.res, 0, this.cols - 1));
          let row = Math.floor(p.constrain(pos.y / this.res, 0, this.rows - 1));
          return this.field[col][row].copy().normalize();
        };
      }

      function reset() {
        selected = [];
        slots    = [0, 0, 0, 0];
        for (let v of bubbles) v.selectedColor = null;
      }

      document.getElementById('start-btn').addEventListener('click', () => {
        started   = !started;
        startTime = p.millis();
      });

      document.getElementById('reset-btn').addEventListener('click', reset);

    }, 'c');
  }
}

customElements.define('worst-flowfield', WorstFlowfield);
