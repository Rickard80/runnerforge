const CROP_SIZE = 600;

/** Reusable portrait cropper. Dispatches portrait-ready with a square PNG data URL. */
export class RunnerPortraitEditor extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="portrait-dialog" role="dialog" aria-modal="true" aria-label="Adjust character portrait">
        <h2>Fit character portrait</h2>
        <p class="muted" id="portrait-crop-instructions">Use Zoom to resize the portrait. Drag or use the arrow keys to position it in the mask.</p>
        <div class="crop-stage" tabindex="0" role="group" aria-label="Portrait crop preview" aria-describedby="portrait-crop-instructions">
          <canvas width="${CROP_SIZE}" height="${CROP_SIZE}" aria-hidden="true"></canvas>
        </div>
        <label class="zoom-row">Zoom <input type="range" min="1" max="4" step="0.01" value="1"></label>
        <div class="crop-actions">
          <button data-action="cancel">Cancel</button>
          <button class="primary" data-action="apply" disabled>Use portrait</button>
        </div>
      </section>`;
    this.canvas = this.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = this.querySelector('input');
    this.apply = this.querySelector('[data-action=apply]');
    this.zoom.oninput = () => this.draw();
    const stage = this.querySelector('.crop-stage');
    let drag = null;
    stage.onpointerdown = e => {
      if (!this.image || !e.isPrimary || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      stage.setPointerCapture(e.pointerId)
    };
    stage.onpointermove = e => {
      if (e.pointerId !== drag?.id) return;
      const ratio = CROP_SIZE / stage.getBoundingClientRect().width;
      this.offsetX += (e.clientX - drag.x) * ratio;
      this.offsetY += (e.clientY - drag.y) * ratio;
      drag.x = e.clientX;
      drag.y = e.clientY;
      this.draw();
    };
    stage.onlostpointercapture = e => {
      if (e.pointerId === drag?.id) drag = null;
    };
    stage.onkeydown = e => {
      const moves = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
      const move = moves[e.key];
      if (!this.image || !move) return;
      e.preventDefault();
      this.offsetX += move[0];
      this.offsetY += move[1];
      this.draw();
    };
    this.querySelector('[data-action=cancel]').onclick = () => this.remove();
    this.apply.onclick = () => {
      this.dispatchEvent(new CustomEvent('portrait-ready', {
        detail: this.canvas.toDataURL('image/png')
      }));
      this.remove()
    };
    this.onkeydown = event => {
      if (event.key === 'Escape') this.remove();
    };
    stage.focus();
  }
  open(source) {
    const fromFile = typeof source !== 'string';
    const url = fromFile ? URL.createObjectURL(source) : source;
    const image = new Image();
    image.onload = () => {
      if (fromFile) URL.revokeObjectURL(url);
      this.image = image;
      this.offsetX = 0;
      this.offsetY = 0;
      this.draw();
      this.apply.disabled = false;
    };
    image.onerror = () => {
      if (fromFile) URL.revokeObjectURL(url);
      alert('Unable to open this image.');
      this.remove()
    };
    image.src = url;
  }
  draw() {
    if (!this.image) return;
    const { naturalWidth, naturalHeight } = this.image;
    const scale = CROP_SIZE / Math.min(naturalWidth, naturalHeight) * Number(this.zoom.value);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const maxX = Math.max(0, (width - CROP_SIZE) / 2);
    const maxY = Math.max(0, (height - CROP_SIZE) / 2);
    this.offsetX = Math.max(-maxX, Math.min(maxX, this.offsetX));
    this.offsetY = Math.max(-maxY, Math.min(maxY, this.offsetY));

    this.ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    this.ctx.drawImage(this.image, this.offsetX - maxX, this.offsetY - maxY, width, height);
  }
}
customElements.define('runner-portrait-editor', RunnerPortraitEditor);
