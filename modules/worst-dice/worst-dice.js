import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./worst-dice.css', import.meta.url).href;
document.head.appendChild(link);


class WorstDice extends HTMLElement {

  async connectedCallback() {
    const res = await fetch(new URL('./worst-dice.html', import.meta.url));
    this.innerHTML = await res.text();

    this._container    = this.querySelector('.dice-canvas-container');
    this._valueDisplay = this.querySelector('.dice-value-number');
    this._initialized  = false;

    this._resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (!this._initialized && width > 0 && height > 0) {
        this._initialized = true;
        this._initThree(width, height);
      } else if (this._initialized) {
        this._onResize();
      }
    });
    this._resizeObserver.observe(this._container);
  }

  /* ── Three.js Setup ─────────────────────────────────────────────── */

  _initThree(w, h) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    this._container.appendChild(renderer.domElement);

    const { geometry, faceNormals } = this._createD10Geometry();
    const materials = Array.from({ length: 10 }, (_, i) =>
      new THREE.MeshStandardMaterial({
        map:  this._createFaceTexture(i),
        side: THREE.DoubleSide,
      })
    );
    const dice = new THREE.Mesh(geometry, materials);
    scene.add(dice);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xaaaaff, 0.3);
    fillLight.position.set(-5, -3, -4);
    scene.add(fillLight);

    this._scene       = scene;
    this._camera      = camera;
    this._renderer    = renderer;
    this._dice        = dice;
    this._faceNormals = faceNormals; // Normalen im LOKALEN Koordinatensystem

    this._initInteraction();
    this._animate();
  }

  /* ── D10 Geometrie ──────────────────────────────────────────────── */

  _createD10Geometry() {
    const H = 1.2;
    const R = 1.0;

    // h muss so gewählt werden dass die 4 Eckpunkte jeder Fläche coplanar sind.
    // Bedingung: det([U[i]-T, L[i]-T, U[i+1]-T]) = 0
    // → h = H * (2·sin36° − sin72°) / (2·sin36° + sin72°)
    const sin36 = Math.sin(36 * Math.PI / 180);
    const sin72 = Math.sin(72 * Math.PI / 180);
    const h = H * (2 * sin36 - sin72) / (2 * sin36 + sin72);

    const T = new THREE.Vector3(0,  H, 0);
    const B = new THREE.Vector3(0, -H, 0);

    const U = [], L = [];
    for (let i = 0; i < 5; i++) {
      const au = (i * 72)      * Math.PI / 180;
      const al = (i * 72 + 36) * Math.PI / 180;
      U.push(new THREE.Vector3(Math.cos(au) * R,  h, Math.sin(au) * R));
      L.push(new THREE.Vector3(Math.cos(al) * R, -h, Math.sin(al) * R));
    }

    const positions   = [];
    const normals     = [];
    const uvs         = [];
    const groups      = [];
    const faceNormals = [];

    const addFace = (v0, v1, v2, v3, matIdx) => {
      // ── Normale ──────────────────────────────────────────
      const e1 = new THREE.Vector3().subVectors(v1, v0);
      const e2 = new THREE.Vector3().subVectors(v2, v0);
      const n  = new THREE.Vector3().crossVectors(e1, e2).normalize();
      const c  = new THREE.Vector3().add(v0).add(v1).add(v2).add(v3).multiplyScalar(0.25);
      if (n.dot(c) < 0) n.negate();
      faceNormals.push(n.clone()); // im lokalen Koordinatensystem speichern

      // ── UV-Mapping: Projektion auf Flächenebene ───────────
      // Damit Zahlen nicht verzerrt erscheinen, projizieren wir jeden Vertex
      // in das lokale 2D-Koordinatensystem der Fläche.

      // "Oben" auf der Fläche = Weltachse Y projiziert auf Flächenebene
      const worldUp = new THREE.Vector3(0, 1, 0);
      const yAxis   = worldUp.clone().addScaledVector(n, -worldUp.dot(n));

      // Falls die Fläche fast horizontal ist (Normale ≈ ±Y), Z als Fallback
      if (yAxis.length() < 0.01) {
        yAxis.set(0, 0, 1).addScaledVector(n, -n.z);
      }
      yAxis.normalize();

      // X-Achse: rechtwinklig zu Normale und Y-Achse
      const xAxis = new THREE.Vector3().crossVectors(yAxis, n).normalize();

      // Jeden Vertex in 2D projizieren (relativ zum Schwerpunkt)
      const project = (v) => [
        new THREE.Vector3().subVectors(v, c).dot(xAxis),
        new THREE.Vector3().subVectors(v, c).dot(yAxis),
      ];

      const pts = [v0, v1, v2, v3].map(project);

      // Skalierung: maximale Ausdehnung → Zahlen füllen die Fläche gut aus
      const maxE = Math.max(...pts.flatMap(([u, w]) => [Math.abs(u), Math.abs(w)]));
      const scale = maxE * 2.4; // etwas Rand lassen

      // UV: Mittelpunkt der Fläche → UV (0.5, 0.5)
      // Kein Vorzeichen-Flip nötig: THREE.CanvasTexture hat flipY=true per Default,
      // das dreht die Canvas-Y-Achse bereits korrekt in den UV-Raum.
      const toUV = ([u, w]) => [u / scale + 0.5, w / scale + 0.5];
      const [uv0, uv1, uv2, uv3] = pts.map(toUV);

      // ── Geometrie ─────────────────────────────────────────
      const start = positions.length / 3;

      // Dreieck 1: v0, v1, v2  |  Dreieck 2: v0, v2, v3
      positions.push(...v0.toArray(), ...v1.toArray(), ...v2.toArray());
      positions.push(...v0.toArray(), ...v2.toArray(), ...v3.toArray());
      for (let k = 0; k < 6; k++) normals.push(n.x, n.y, n.z);
      uvs.push(...uv0, ...uv1, ...uv2,  ...uv0, ...uv2, ...uv3);

      groups.push({ start, count: 6, materialIndex: matIdx });
    };

    for (let i = 0; i < 5; i++) {
      const i1 = (i + 1) % 5;
      addFace(T, U[i], L[i],  U[i1], i);     // obere Flächen: Werte 0–4
      addFace(B, L[i], U[i1], L[i1], i + 5); // untere Flächen: Werte 5–9
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
    for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);

    return { geometry: geo, faceNormals };
  }

  /* ── Textur für jede Fläche ─────────────────────────────────────── */

  _createFaceTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#992AEA';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(250, 235, 146, 0.4)';
    ctx.lineWidth   = 6;
    ctx.strokeRect(12, 12, 232, 232);
    ctx.fillStyle    = '#FAEB92';
    ctx.font         = 'bold 100px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  /* ── Wert-Erkennung via Raycaster ───────────────────────────────── */

  _getFrontFace() {
    // Der Raycaster schiesst einen Strahl von der Kamera durch den
    // Bildschirmmittelpunkt (NDC 0,0) und gibt die getroffene Fläche zurück.
    // face.materialIndex entspricht direkt dem Wert 0–9 weil wir die
    // Materialgruppen in der gleichen Reihenfolge wie die Zahlentexturen angelegt haben.
    if (!this._raycaster) this._raycaster = new THREE.Raycaster();
    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), this._camera);
    const hits = this._raycaster.intersectObject(this._dice);
    if (hits.length > 0 && hits[0].face) {
      return hits[0].face.materialIndex;
    }
    return 0;
  }

  /* ── Maus/Touch Steuerung mit Momentum ──────────────────────────── */

  _initInteraction() {
    const canvas = this._renderer.domElement;
    const SENSITIVITY = 0.008;
    const FRICTION    = 0.97;

    let dragging = false;
    let prev     = new THREE.Vector2();
    this._spin   = new THREE.Vector2(0, 0);

    const rotateDie = (dx, dy) => {
      const q = new THREE.Quaternion();
      q.setFromEuler(new THREE.Euler(dy * SENSITIVITY, dx * SENSITIVITY, 0, 'XYZ'));
      this._dice.quaternion.premultiply(q);
    };

    this._onMouseDown = (e) => {
      dragging = true;
      this._spin.set(0, 0);
      prev.set(e.clientX, e.clientY);
    };
    this._onMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      this._spin.set(dx, dy);
      rotateDie(dx, dy);
      prev.set(e.clientX, e.clientY);
    };
    this._onMouseUp   = () => { dragging = false; };

    this._onTouchStart = (e) => {
      e.preventDefault();
      dragging = true;
      this._spin.set(0, 0);
      prev.set(e.touches[0].clientX, e.touches[0].clientY);
    };
    this._onTouchMove = (e) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - prev.x;
      const dy = e.touches[0].clientY - prev.y;
      this._spin.set(dx, dy);
      rotateDie(dx, dy);
      prev.set(e.touches[0].clientX, e.touches[0].clientY);
    };
    this._onTouchEnd  = () => { dragging = false; };

    this._isDragging = () => dragging;
    this._friction   = FRICTION;

    canvas.addEventListener('mousedown',  this._onMouseDown);
    window.addEventListener('mousemove',  this._onMouseMove);
    window.addEventListener('mouseup',    this._onMouseUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    window.addEventListener('touchmove',  this._onTouchMove);
    window.addEventListener('touchend',   this._onTouchEnd);
  }

  /* ── Animation Loop ─────────────────────────────────────────────── */

  _animate() {
    this._animationId = requestAnimationFrame(() => this._animate());

    if (!this._isDragging?.()) {
      if (this._spin && this._spin.length() > 0.05) {
        const q = new THREE.Quaternion();
        q.setFromEuler(new THREE.Euler(
          this._spin.y * 0.008,
          this._spin.x * 0.008,
          0, 'XYZ'
        ));
        this._dice.quaternion.premultiply(q);
        this._spin.multiplyScalar(this._friction);
      }
    }

    this._renderer?.render(this._scene, this._camera);

    // Display nur aktualisieren wenn sich der Würfel gerade dreht —
    // entweder durch aktiven Drag oder durch auslaufendes Momentum
    const isMoving = this._isDragging?.() || (this._spin?.length() > 0.05);
    if (isMoving && this._valueDisplay) {
      this._valueDisplay.textContent = this._getFrontFace();
    }
  }

  /* ── Resize ─────────────────────────────────────────────────────── */

  _onResize() {
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    if (!w || !h) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  /* ── Cleanup ────────────────────────────────────────────────────── */

  disconnectedCallback() {
    cancelAnimationFrame(this._animationId);
    this._resizeObserver?.disconnect();
    const canvas = this._renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener('mousedown',  this._onMouseDown);
      canvas.removeEventListener('touchstart', this._onTouchStart);
    }
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup',   this._onMouseUp);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend',  this._onTouchEnd);
    this._renderer?.dispose();
  }

  // Öffentlicher Getter damit übergeordnete Komponenten (z.B. worst-date)
  // den aktuellen Wert lesen können ohne interne Methoden direkt aufzurufen.
  get value() {
    if (!this._initialized) return 0;
    return this._getFrontFace();
  }
}

customElements.define('worst-dice', WorstDice);
