/** Reusable portrait cropper. Dispatches portrait-ready with a square PNG data URL. */
export class RunnerPortraitEditor extends HTMLElement {
  connectedCallback() {
    this.innerHTML =
      `<section class="portrait-dialog" role="dialog" aria-modal="true" aria-label="Adjust character portrait"><h2>Fit character portrait</h2><p class="muted">Drag to reposition, then zoom to fit the circular opening.</p><div class="crop-stage"><canvas width="600" height="600" aria-label="Portrait crop preview"></canvas></div><label class="zoom-row">Zoom <input type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom portrait"></label><div class="crop-actions"><button data-action="cancel">Cancel</button><button class="primary" data-action="apply">Use portrait</button></div></section>`;
    this.canvas = this.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = this.querySelector('input');
    this.zoom.oninput = () => this.draw();
    const stage = this.querySelector('.crop-stage');
    let drag = null;
    stage.onpointerdown = e => {
      drag = {
        x: e.clientX,
        y: e.clientY,
        ox: this.offsetX,
        oy: this.offsetY
      };
      stage.setPointerCapture(e.pointerId)
    };
    stage.onpointermove = e => {
      if (!drag) return;
      const ratio = 600 / stage.getBoundingClientRect().width;
      this.offsetX = drag.ox + (e.clientX - drag.x) * ratio;
      this.offsetY = drag.oy + (e.clientY - drag.y) * ratio;
      this.draw()
    };
    stage.onpointerup = () => drag = null;
    stage.onpointercancel = () => drag = null;
    this.querySelector('[data-action=cancel]').onclick = () => this.remove();
    this.querySelector('[data-action=apply]').onclick = () => {
      if (!this.image) return;
      const out = document.createElement('canvas');
      out.width = 600;
      out.height = 600;
      const c = out.getContext('2d');
      this.paint(c, false);
      this.dispatchEvent(new CustomEvent('portrait-ready', {
        detail: out.toDataURL('image/png')
      }));
      this.remove()
    };
    this.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.remove()
    });
    this.querySelector('[data-action=apply]').focus();
  }
  open(source) {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    this.image = new Image();
    this.image.onload = () => {
      this.offsetX = 0;
      this.offsetY = 0;
      this.draw();
      if (typeof source !== 'string') URL.revokeObjectURL(url)
    };
    this.image.onerror = () => {
      alert('Unable to open this image.');
      this.remove()
    };
    this.image.src = url;
  }
  paint(ctx, guide) {
    const size = 600;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#121a17';
    ctx.fillRect(0, 0, size, size);
    if (!this.image) return;
    const scale = Math.max(size / this.image.naturalWidth, size / this.image.naturalHeight) * Number(this.zoom.value);
    const w = this.image.naturalWidth * scale,
      h = this.image.naturalHeight * scale;
    const x = (size - w) / 2 + this.offsetX,
      y = (size - h) / 2 + this.offsetY;
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 300, 292, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.image, x, y, w, h);
    ctx.restore();
    if (guide) {
      ctx.save();
      ctx.fillStyle = '#0009';
      ctx.beginPath();
      ctx.rect(0, 0, size, size);
      ctx.arc(300, 300, 292, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
      ctx.strokeStyle = '#f0c33d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(300, 300, 292, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore()
    }
  }
  draw() {
    this.paint(this.ctx, true)
  }
}
customElements.define('runner-portrait-editor', RunnerPortraitEditor);