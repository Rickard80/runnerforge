const CROP_SIZE = 600;
const KEYBOARD_MOVES = Object.freeze({
  ArrowLeft: [-10, 0],
  ArrowRight: [10, 0],
  ArrowUp: [0, -10],
  ArrowDown: [0, 10]
});

/** Reusable portrait cropper. Dispatches portrait-ready with a square PNG data URL. */
export class RunnerPortraitEditor extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <dialog class="portrait-dialog" aria-labelledby="portrait-crop-title">
        <h2 id="portrait-crop-title">Fit character portrait</h2>
        <p class="muted" id="portrait-crop-instructions">Use Zoom to resize the portrait. Drag or use the arrow keys to position it in the mask.</p>
        <div class="crop-stage" tabindex="0" autofocus role="group" aria-label="Portrait crop preview" aria-describedby="portrait-crop-instructions">
          <canvas width="${CROP_SIZE}" height="${CROP_SIZE}" aria-hidden="true"></canvas>
        </div>
        <label class="zoom-row">Zoom <input type="range" min="1" max="4" step="0.01" value="1"></label>
        <div class="crop-actions">
          <button data-action="cancel">Cancel</button>
          <button class="primary" data-action="apply" disabled>Use portrait</button>
        </div>
      </dialog>`;
    this.dialog = this.querySelector('dialog');
    this.dialog.onclose = () => this.remove();
    this.canvas = this.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = this.querySelector('input');
    this.apply = this.querySelector('[data-action=apply]');
    this.zoom.oninput = () => this.draw();
    this.querySelector('[data-action=cancel]').onclick = () => this.dialog.close();
    this.apply.onclick = () => {
      const portrait = this.canvas.toDataURL('image/png');
      this.dialog.close();
      this.dispatchEvent(new CustomEvent('portrait-ready', { detail: portrait }));
    };
    this.bindCropStage();
  }

  disconnectedCallback() {
    this.cancelImageLoad?.();
    this.image = null;
  }

  open(portraitSource) {
    this.cancelImageLoad?.();
    this.dialog.showModal();
    const isFromFile = typeof portraitSource !== 'string';
    const url = isFromFile ? URL.createObjectURL(portraitSource) : portraitSource;
    const image = new Image();
    this.cancelImageLoad = () => {
      image.onload = null;
      image.onerror = null;
      if (isFromFile) URL.revokeObjectURL(url);
      this.cancelImageLoad = null;
    };
    image.onload = () => {
      this.cancelImageLoad();
      this.image = image;
      this.offsetX = 0;
      this.offsetY = 0;
      this.draw();
      this.apply.disabled = false;
    };
    image.onerror = () => {
      this.cancelImageLoad();
      alert('Unable to open this image.');
      this.dialog.close();
    };
    image.src = url;
  }

  bindCropStage() {
    const stage = this.querySelector('.crop-stage');
    let drag = null;
    stage.onpointerdown = eventObj => {
      if (!this.image || !eventObj.isPrimary || eventObj.button !== 0) return;
      drag = { id: eventObj.pointerId, x: eventObj.clientX, y: eventObj.clientY };
      stage.setPointerCapture(eventObj.pointerId)
    };
    stage.onpointermove = eventObj => {
      if (eventObj.pointerId !== drag?.id) return;
      const ratio = CROP_SIZE / stage.getBoundingClientRect().width;
      this.offsetX += (eventObj.clientX - drag.x) * ratio;
      this.offsetY += (eventObj.clientY - drag.y) * ratio;
      drag.x = eventObj.clientX;
      drag.y = eventObj.clientY;
      this.draw();
    };
    stage.onlostpointercapture = eventObj => {
      if (eventObj.pointerId === drag?.id) drag = null;
    };
    stage.onkeydown = eventObj => {
      const move = KEYBOARD_MOVES[eventObj.key];
      if (!this.image || !move) return;
      eventObj.preventDefault();
      this.offsetX += move[0];
      this.offsetY += move[1];
      this.draw();
    };
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
