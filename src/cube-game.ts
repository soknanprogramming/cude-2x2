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
      height: 600px;
      position: relative;
      background: var(--game-bg, radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%));
      border-radius: 16px;
      overflow: hidden;
      touch-action: none;
      font-family: system-ui, -apple-system, sans-serif;
      transition: background 0.3s;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      outline: none;
    }
    .ui {
      position: absolute;
      top: 30px;
      left: 30px;
      pointer-events: none;
      color: var(--text-h);
      z-index: 10;
    }
    .controls {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      z-index: 10;
    }
    button {
      pointer-events: auto;
      padding: 10px 24px;
      background: var(--bg);
      color: var(--accent);
      border: 2px solid var(--accent-border);
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }
    button:hover {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .timer {
      font-size: 42px;
      font-weight: 200;
      margin-bottom: 5px;
      color: var(--accent);
    }
    
    .menu-overlay {
      position: absolute;
      inset: 0;
      background: var(--bg);
      opacity: 0.95;
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      color: var(--text);
      overflow-y: auto;
    }
    .menu-content {
      max-width: 600px;
      padding: 40px;
      text-align: center;
    }
    .menu-content h2 {
      font-size: 32px;
      margin-bottom: 20px;
      color: var(--accent);
    }
    .instruction-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: left;
      margin-bottom: 30px;
    }
    .instruction-section h3 {
      color: var(--accent);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--accent-border);
      padding-bottom: 5px;
    }
    .key-map {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .key-map b {
      background: var(--accent-bg);
      color: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .close-menu {
      margin-top: 20px;
      width: 100%;
      padding: 15px;
      background: var(--accent);
      color: white;
      border: none;
      font-size: 18px;
    }
    .solved-overlay {
      background: rgba(0, 200, 0, 0.2) !important;
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

    // Left Hand - Cube Control
    const key = e.key.toLowerCase();
    if (key === 'q') this.animateRotation('x', 0, true);
    if (key === 'a') this.animateRotation('x', 0, false);
    if (key === 'w') this.animateRotation('y', 1, true);
    if (key === 's') this.animateRotation('y', 1, false);
    if (key === 'e') this.animateRotation('z', 1, true);
    if (key === 'd') this.animateRotation('z', 1, false);
    if (key === 'r') this.animateRotation('x', 1, true);
    if (key === 'f') this.animateRotation('x', 1, false);

    // Right Hand - Game Shortcuts
    if (e.code === 'Space') { e.preventDefault(); this.scramble(); }
    if (key === 'n') this.resetCube();
    if (key === 'p') this.togglePause();
    if (key === 'g') this.solved = false;
    if (key === 'backspace' || key === 'delete') this.resetTimer();
    if (key === 'h') this.showMenu = !this.showMenu;
    if (key === 'escape') this.showMenu = false;
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
    // High-Contrast Professional Palette
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onPointerDown(e: MouseEvent) {
    if (this.scrambling || this.isLayerDragging || this.showMenu) return;
    
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
          if (sticker) {
            colors.add(((sticker.object as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex());
          }
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
    } else {
        this.solved = false;
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
        await this.animateRotation(
            axes[Math.floor(Math.random() * 3)],
            Math.floor(Math.random() * 2),
            Math.random() > 0.5
        );
    }
    this.scrambling = false;
  }

  private onWindowResize() {
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
      
      <div class="ui">
        <div class="timer">
          ${(this.time / 1000).toFixed(1)}s 
          ${isPaused ? '(PAUSED)' : ''} 
          ${this.solved ? '(SOLVED!)' : ''}
        </div>
      </div>

      ${isPaused ? html`
        <div class="menu-overlay" style="background: rgba(0,0,0,0.4)">
          <div class="menu-content">
            <h2 style="color: white; font-size: 48px;">PAUSED</h2>
            <button class="close-menu" @click=${() => this.togglePause()}>RESUME</button>
          </div>
        </div>
      ` : ''}

      ${this.solved ? html`
        <div class="menu-overlay solved-overlay">
          <div class="menu-content">
            <h2 style="color: #4ade80; font-size: 48px;">SOLVED!</h2>
            <p style="font-size: 24px; margin-bottom: 20px;">Time: ${(this.time / 1000).toFixed(1)}s</p>
            <button class="close-menu" style="background: #4ade80" @click=${() => this.scramble()}>SCRAMBLE AGAIN</button>
            <button class="close-menu" style="margin-top: 10px;" @click=${() => this.solved = false}>DISMISS</button>
          </div>
        </div>
      ` : ''}

      ${this.showMenu ? html`
        <div class="menu-overlay">
          <div class="menu-content">
            <h2>CONTROLS</h2>
            
            <div class="instruction-grid">
              <div class="instruction-section">
                <h3>Left Hand (Rotations)</h3>
                <div class="key-map"><span>Left Layer</span> <b>Q / A</b></div>
                <div class="key-map"><span>Up Layer</span> <b>W / S</b></div>
                <div class="key-map"><span>Front Layer</span> <b>E / D</b></div>
                <div class="key-map"><span>Right Layer</span> <b>R / F</b></div>
              </div>
              
              <div class="instruction-section">
                <h3>Right Hand (Shortcuts)</h3>
                <div class="key-map"><span>Scramble</span> <b>SPACE</b></div>
                <div class="key-map"><span>New Cube</span> <b>N</b></div>
                <div class="key-map"><span>Pause/Resume</span> <b>P</b></div>
                <div class="key-map"><span>Reset Timer</span> <b>DEL</b></div>
                <div class="key-map"><span>Dismiss Solved</span> <b>G</b></div>
                <div class="key-map"><span>Toggle Help</span> <b>H</b></div>
              </div>
            </div>

            <div class="instruction-section" style="text-align: center; opacity: 0.8; margin-top: 20px;">
              <p>You can also drag cube faces directly for tactile control.</p>
            </div>

            <button class="close-menu" @click=${() => this.showMenu = false}>GOT IT!</button>
          </div>
        </div>
      ` : ''}

      <div class="controls">
        <button @click=${() => this.scramble()} ?disabled=${this.scrambling}>SCRAMBLE</button>
        <button @click=${() => this.togglePause()} ?disabled=${this.time === 0 || this.solved}>
          ${this.isRunning ? 'PAUSE' : 'RESUME'}
        </button>
        <button @click=${() => this.resetCube()}>NEW CUBE</button>
        <button @click=${() => this.resetTimer()}>RESET TIMER</button>
        <button @click=${() => this.showMenu = true}>HELP</button>
      </div>
    `;
  }
}
