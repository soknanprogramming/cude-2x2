import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@customElement('cube-game')
export class CubeGame extends LitElement {
  @query('#canvas-container')
  canvasContainer!: HTMLDivElement;

  @property({ type: Number })
  time = 0;

  @property({ type: Boolean })
  isRunning = false;

  @state()
  private showMenu = false;

  @state()
  private scrambling = false;

  @state()
  private solved = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private cubies: THREE.Group[] = [];
  private timerInterval?: number;
  
  // Interaction state
  private isLayerDragging = false;
  private mouseDown = false;
  private startMousePos = new THREE.Vector2();
  private selectedCubie: THREE.Object3D | null = null;
  private selectedFaceNormal = new THREE.Vector3();
  
  // Dragging state
  private dragPivot = new THREE.Object3D();
  private dragLayerCubies: THREE.Object3D[] = [];
  private dragDirection = new THREE.Vector2();
  private currentDragAngle = 0;
  private axisName: 'x' | 'y' | 'z' = 'x';
  private layerIndex = 0;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      background: var(--game-bg, radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%));
      overflow: hidden;
      touch-action: none;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      transition: background 0.3s;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      outline: none;
      cursor: grab;
    }
    #canvas-container:active {
      cursor: grabbing;
    }

    .ui-top {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
      z-index: 10;
    }

    .stopwatch {
      background: var(--card-bg);
      padding: 0.5rem 1.25rem;
      border-radius: 100px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      pointer-events: auto;
    }

    .stopwatch-icon {
      color: var(--accent);
      width: 18px;
      height: 18px;
    }

    .timer {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-h);
      min-width: 70px;
    }

    .timer.running { color: var(--accent); }

    .ui-bottom {
      position: absolute;
      bottom: 1.5rem;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    }

    .control-group {
      background: var(--card-bg);
      padding: 0.4rem;
      border-radius: 100px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      display: flex;
      gap: 0.4rem;
      pointer-events: auto;
    }

    button {
      background: transparent;
      border: none;
      padding: 0.6rem 1rem;
      color: var(--text);
      font-weight: 600;
      border-radius: 100px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      white-space: nowrap;
      font-size: 0.875rem;
    }

    button:hover:not(:disabled) {
      background: var(--accent-bg);
      color: var(--accent);
    }

    button.primary { background: var(--accent); color: white; }
    button.primary:hover:not(:disabled) { background: var(--accent-hover); color: white; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    button svg { width: 16px; height: 16px; }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1.5rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .overlay.active { opacity: 1; pointer-events: auto; }

    .modal {
      background: var(--card-bg);
      width: 100%;
      max-width: 450px;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: var(--shadow);
      text-align: center;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }

    .overlay.active .modal { transform: translateY(0); }
    .modal h2 { margin-top: 0; font-size: 1.75rem; color: var(--text-h); margin-bottom: 1rem; }
    .modal p { color: var(--text); line-height: 1.5; margin-bottom: 1.5rem; font-size: 0.95rem; }

    .shortcut-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin: 1rem 0;
      text-align: left;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      background: var(--bg);
      border-radius: 8px;
    }

    .key {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      color: var(--accent);
    }

    .btn-full { width: 100%; justify-content: center; margin-top: 0.5rem; }

    @media (max-width: 768px) {
      .control-group { border-radius: 16px; padding: 0.5rem; }
      button { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
      button span { display: none; } /* Hide text on mobile icons only */
      button svg { width: 18px; height: 18px; margin: 0; }
    }
  `;

  firstUpdated() {
    this.initThree();
    this.createCube();
    this.renderLoop();
    
    const el = this.renderer.domElement;
    el.addEventListener('mousedown', this.onPointerDown.bind(this));
    window.addEventListener('mousemove', this.onPointerMove.bind(this));
    window.addEventListener('mouseup', this.onPointerUp.bind(this));
    
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onPointerDown(e.touches[0] as any);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
        this.onPointerMove(e.touches[0] as any);
    }, { passive: false });
    window.addEventListener('touchend', () => this.onPointerUp());

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    const isPaused = this.time > 0 && !this.isRunning && !this.solved;
    if (this.scrambling || this.isLayerDragging || isPaused) return;

    const key = e.key.toLowerCase();
    
    // Core rotations
    if (key === 'q') this.animateRotation('x', 0, true);
    if (key === 'a') this.animateRotation('x', 0, false);
    if (key === 'w') this.animateRotation('y', 1, true);
    if (key === 's') this.animateRotation('y', 1, false);
    if (key === 'e') this.animateRotation('z', 1, true);
    if (key === 'd') this.animateRotation('z', 1, false);
    if (key === 'r') this.animateRotation('x', 1, true);
    if (key === 'f') this.animateRotation('x', 1, false);

    // Shortcuts
    if (e.code === 'Space') { e.preventDefault(); this.scramble(); }
    if (key === 'n') this.resetCube();
    if (key === 'p') this.togglePause();
    if (key === 'g') this.solved = false;
    if (key === 'backspace' || key === 'delete') this.resetTimer();
    if (key === 'h') this.showMenu = !this.showMenu;
    if (key === 'escape') {
      this.showMenu = false;
      if (this.solved) this.solved = false;
    }
  }

  private initThree() {
    this.scene = new THREE.Scene();
    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(4, 4, 6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.rotateSpeed = 0.5;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(10, 20, 15);
    this.scene.add(light);
  }

  private createCube() {
    const colors = [0x009b48, 0x0045ad, 0xffffff, 0xffd500, 0xff5800, 0xb71234];
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const cubie = new THREE.Group();
          const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.92), blackMaterial);
          cubie.add(base);

          colors.forEach((color, i) => {
            const sticker = new THREE.Mesh(
                new THREE.PlaneGeometry(0.78, 0.78),
                new THREE.MeshStandardMaterial({ color, roughness: 1.0, metalness: 0.0 })
            );
            const offset = 0.465;
            if (i === 0) { sticker.position.x = offset; sticker.rotation.y = Math.PI/2; }
            if (i === 1) { sticker.position.x = -offset; sticker.rotation.y = -Math.PI/2; }
            if (i === 2) { sticker.position.y = offset; sticker.rotation.x = -Math.PI/2; }
            if (i === 3) { sticker.position.y = -offset; sticker.rotation.x = Math.PI/2; }
            if (i === 4) { sticker.position.z = -offset; sticker.rotation.y = Math.PI; }
            if (i === 5) { sticker.position.z = offset; }
            cubie.add(sticker);
          });

          cubie.position.set(x - 0.5, y - 0.5, z - 0.5);
          this.scene.add(cubie);
          this.cubies.push(cubie);
        }
      }
    }
  }

  private renderLoop() {
    requestAnimationFrame(this.renderLoop.bind(this));
    if (this.controls) this.controls.update();
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  private onPointerDown(e: MouseEvent) {
    if (this.scrambling || this.isLayerDragging || this.showMenu || this.solved) return;
    
    const rect = this.canvasContainer.getBoundingClientRect();
    this.startMousePos.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.startMousePos, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== this.scene) obj = obj.parent;
      this.selectedCubie = obj;
      this.selectedFaceNormal = intersects[0].face!.normal.clone().applyQuaternion(obj.quaternion);
      this.mouseDown = true;
      this.controls.enabled = false;
    }
  }

  private onPointerMove(e: MouseEvent) {
    if (!this.mouseDown || this.scrambling || this.showMenu) return;

    const rect = this.canvasContainer.getBoundingClientRect();
    const currentPos = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    if (!this.isLayerDragging) {
      const dist = currentPos.distanceTo(this.startMousePos);
      if (dist > 0.05) this.initLayerDrag(currentPos);
    } else {
      this.updateLayerDrag(currentPos);
    }
  }

  private initLayerDrag(currentPos: THREE.Vector2) {
    if (!this.selectedCubie) return;
    const normal = this.selectedFaceNormal;
    const pos = this.selectedCubie.position;
    const axes: Array<{ axis: 'x'|'y'|'z', layer: number, dir3D: THREE.Vector3 }> = [];
    
    if (Math.abs(normal.x) < 0.1) axes.push({ axis: 'x', layer: pos.x > 0 ? 1 : 0, dir3D: new THREE.Vector3(1,0,0) });
    if (Math.abs(normal.y) < 0.1) axes.push({ axis: 'y', layer: pos.y > 0 ? 1 : 0, dir3D: new THREE.Vector3(0,1,0) });
    if (Math.abs(normal.z) < 0.1) axes.push({ axis: 'z', layer: pos.z > 0 ? 1 : 0, dir3D: new THREE.Vector3(0,0,1) });

    let bestAxis = axes[0];
    let maxProj = -1;
    const dragVec = new THREE.Vector2().subVectors(currentPos, this.startMousePos).normalize();

    axes.forEach(a => {
        const p1 = this.getScreenPos(new THREE.Vector3().copy(pos));
        const p2 = this.getScreenPos(new THREE.Vector3().copy(pos).add(a.dir3D.clone().cross(normal)));
        const screenDir = new THREE.Vector2().subVectors(p2, p1).normalize();
        const proj = Math.abs(dragVec.dot(screenDir));
        if (proj > maxProj) {
            maxProj = proj;
            bestAxis = a;
            this.dragDirection = screenDir;
        }
    });

    this.axisName = bestAxis.axis;
    this.layerIndex = bestAxis.layer;
    this.isLayerDragging = true;
    this.dragPivot = new THREE.Object3D();
    this.scene.add(this.dragPivot);
    this.dragLayerCubies = this.cubies.filter(c => {
        const p = c.position;
        if (this.axisName === 'x') return Math.abs(p.x - (this.layerIndex - 0.5)) < 0.1;
        if (this.axisName === 'y') return Math.abs(p.y - (this.layerIndex - 0.5)) < 0.1;
        return Math.abs(p.z - (this.layerIndex - 0.5)) < 0.1;
    });
    this.dragLayerCubies.forEach(c => this.dragPivot.attach(c));
  }

  private updateLayerDrag(currentPos: THREE.Vector2) {
    const dragVec = new THREE.Vector2().subVectors(currentPos, this.startMousePos);
    this.currentDragAngle = dragVec.dot(this.dragDirection) * Math.PI * 2;
    if (this.axisName === 'x') this.dragPivot.rotation.x = this.currentDragAngle;
    if (this.axisName === 'y') this.dragPivot.rotation.y = this.currentDragAngle;
    if (this.axisName === 'z') this.dragPivot.rotation.z = this.currentDragAngle;
  }

  private onPointerUp() {
    this.mouseDown = false;
    this.controls.enabled = true;
    if (this.isLayerDragging) this.snapLayer();
  }

  private isSolved(): boolean {
    if (this.cubies.length === 0) return false;
    const raycaster = new THREE.Raycaster();
    const faces = [
      { dir: new THREE.Vector3(1, 0, 0) },
      { dir: new THREE.Vector3(-1, 0, 0) },
      { dir: new THREE.Vector3(0, 1, 0) },
      { dir: new THREE.Vector3(0, -1, 0) },
      { dir: new THREE.Vector3(0, 0, 1) },
      { dir: new THREE.Vector3(0, 0, -1) }
    ];

    for (const face of faces) {
      const colors = new Set<number>();
      const offsets = [-0.5, 0.5];
      for (const ox of offsets) {
        for (const oy of offsets) {
          const rayOrigin = face.dir.clone().multiplyScalar(2);
          if (face.dir.x !== 0) { rayOrigin.y += ox; rayOrigin.z += oy; }
          else if (face.dir.y !== 0) { rayOrigin.x += ox; rayOrigin.z += oy; }
          else { rayOrigin.x += ox; rayOrigin.y += oy; }
          raycaster.set(rayOrigin, face.dir.clone().negate());
          const intersects = raycaster.intersectObjects(this.scene.children, true);
          const sticker = intersects.find(i => i.object instanceof THREE.Mesh && (i.object.geometry as THREE.BufferGeometry).type === 'PlaneGeometry');
          if (sticker) colors.add(((sticker.object as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex());
        }
      }
      if (colors.size !== 1) return false;
    }
    return true;
  }

  private async checkSolved() {
    if (this.isSolved()) {
        this.solved = true;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isRunning = false;
    }
  }

  private async snapLayer() {
    const targetAngle = Math.round(this.currentDragAngle / (Math.PI / 2)) * (Math.PI / 2);
    const startAngle = this.currentDragAngle;
    const startTime = performance.now();
    const animate = (time: number) => {
        const t = Math.min((time - startTime) / 200, 1);
        const angle = startAngle + (targetAngle - startAngle) * (t * (2 - t));
        if (this.axisName === 'x') this.dragPivot.rotation.x = angle;
        if (this.axisName === 'y') this.dragPivot.rotation.y = angle;
        if (this.axisName === 'z') this.dragPivot.rotation.z = angle;
        if (t < 1) requestAnimationFrame(animate); else {
            this.dragPivot.updateMatrixWorld();
            this.dragLayerCubies.forEach(c => this.scene.attach(c));
            this.scene.remove(this.dragPivot);
            this.isLayerDragging = false;
            this.currentDragAngle = 0;
            if (!this.scrambling && targetAngle !== 0) {
              const solved = this.isSolved();
              if (!this.isRunning && !solved) this.startTimer();
              else if (solved) this.checkSolved();
              else this.solved = false;
            }
        }
    };
    requestAnimationFrame(animate);
  }

  private async animateRotation(axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean) {
    if (this.isLayerDragging) return;
    this.isLayerDragging = true;
    const pivot = new THREE.Object3D();
    this.scene.add(pivot);
    const layerCubies = this.cubies.filter(c => {
        const p = c.position;
        if (axis === 'x') return Math.abs(p.x - (layer - 0.5)) < 0.1;
        if (axis === 'y') return Math.abs(p.y - (layer - 0.5)) < 0.1;
        return Math.abs(p.z - (layer - 0.5)) < 0.1;
    });
    layerCubies.forEach(c => pivot.attach(c));
    const target = (clockwise ? -1 : 1) * Math.PI / 2;
    const start = performance.now();
    await new Promise(r => {
        const anim = (t: number) => {
            const p = Math.min((t - start) / 200, 1);
            const angle = p * target;
            if (axis === 'x') pivot.rotation.x = angle;
            if (axis === 'y') pivot.rotation.y = angle;
            if (axis === 'z') pivot.rotation.z = angle;
            if (p < 1) requestAnimationFrame(anim); else r(null);
        };
        requestAnimationFrame(anim);
    });
    pivot.updateMatrixWorld();
    layerCubies.forEach(c => this.scene.attach(c));
    this.scene.remove(pivot);
    this.isLayerDragging = false;
    if (!this.scrambling) {
      const solved = this.isSolved();
      if (!this.isRunning && !solved) this.startTimer();
      else if (solved) this.checkSolved();
      else this.solved = false;
    }
  }

  private getScreenPos(pos: THREE.Vector3): THREE.Vector2 {
    const v = pos.clone().project(this.camera);
    return new THREE.Vector2(v.x, v.y);
  }

  private async scramble() {
    if (this.scrambling || this.isLayerDragging) return;
    this.scrambling = true;
    this.solved = false;
    this.resetTimer();
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    for (let i = 0; i < 10; i++) {
        await this.animateRotation(axes[Math.floor(Math.random() * 3)], Math.floor(Math.random() * 2), Math.random() > 0.5);
    }
    this.scrambling = false;
  }

  private onWindowResize() {
    if (!this.canvasContainer) return;
    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private togglePause() {
    if (this.scrambling || (this.time === 0 && !this.isRunning) || this.solved) return;
    if (this.isRunning) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.isRunning = false;
    } else {
        this.isRunning = true;
        this.timerInterval = window.setInterval(() => this.time += 100, 100);
    }
  }

  private startTimer() {
    if (this.isRunning || this.solved) return;
    this.isRunning = true;
    this.timerInterval = window.setInterval(() => this.time += 100, 100);
  }

  private resetTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isRunning = false;
    this.time = 0;
  }

  private async resetCube() {
    if (this.scrambling || this.isLayerDragging) return;
    this.resetTimer();
    this.solved = false;
    this.cubies.forEach((cubie, index) => {
        const z = index % 2;
        const y = Math.floor(index / 2) % 2;
        const x = Math.floor(index / 4);
        cubie.position.set(x - 0.5, y - 0.5, z - 0.5);
        cubie.quaternion.set(0, 0, 0, 1);
    });
  }

  render() {
    const isPaused = this.time > 0 && !this.isRunning && !this.solved;

    return html`
      <div id="canvas-container" tabindex="0"></div>
      
      <div class="ui-top">
        <div class="stopwatch">
          <svg class="stopwatch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div class="timer ${this.isRunning ? 'running' : ''}">${(this.time / 1000).toFixed(1)}s</div>
        </div>
      </div>

      <!-- Overlays -->
      <div class="overlay ${isPaused ? 'active' : ''}">
        <div class="modal">
          <h2>Game Paused</h2>
          <p>The timer is currently suspended. Resume whenever you're ready to continue solving.</p>
          <button class="primary btn-full" @click=${() => this.togglePause()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            RESUME SESSION
          </button>
        </div>
      </div>

      <div class="overlay ${this.solved ? 'active' : ''}">
        <div class="modal">
          <h2 style="color: #4ade80">Solved!</h2>
          <p>Fantastic job! You've successfully restored the cube to its original state.</p>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-h); margin-bottom: 1.5rem;">
            ${(this.time / 1000).toFixed(1)}<span style="font-size: 1.25rem; color: var(--text); font-weight: 400">s</span>
          </div>
          <button class="primary btn-full" @click=${() => this.scramble()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            SCRAMBLE AGAIN
          </button>
          <button class="btn-full" @click=${() => this.solved = false}>CLOSE OVERLAY</button>
        </div>
      </div>

      <div class="overlay ${this.showMenu ? 'active' : ''}">
        <div class="modal" style="max-width: 550px">
          <h2>Game Controls</h2>
          <div class="shortcut-list">
            <div class="shortcut-item"><span>Left Layer</span> <span class="key">Q / A</span></div>
            <div class="shortcut-item"><span>Up Layer</span> <span class="key">W / S</span></div>
            <div class="shortcut-item"><span>Front Layer</span> <span class="key">E / D</span></div>
            <div class="shortcut-item"><span>Right Layer</span> <span class="key">R / F</span></div>
            <div class="shortcut-item"><span>Scramble</span> <span class="key">SPACE</span></div>
            <div class="shortcut-item"><span>New Cube</span> <span class="key">N</span></div>
            <div class="shortcut-item"><span>Pause</span> <span class="key">P</span></div>
            <div class="shortcut-item"><span>Help</span> <span class="key">H</span></div>
          </div>
          <p style="margin-top: 1rem; font-size: 0.85rem">Drag directly on the cube to rotate layers, or drag the background to orbit the view.</p>
          <button class="primary btn-full" @click=${() => this.showMenu = false}>GOT IT!</button>
        </div>
      </div>

      <div class="ui-bottom">
        <div class="control-group">
          <button class="primary" @click=${() => this.scramble()} ?disabled=${this.scrambling}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            <span>SCRAMBLE</span>
          </button>
          <button @click=${() => this.togglePause()} ?disabled=${this.time === 0 || this.solved}>
            ${this.isRunning ? 
              html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> <span>PAUSE</span>` : 
              html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>RESUME</span>`}
          </button>
          <button @click=${() => this.resetCube()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
            <span>NEW CUBE</span>
          </button>
          <button @click=${() => this.showMenu = true}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
            </svg>
            <span>HELP</span>
          </button>
        </div>
      </div>
    `;
  }
}
