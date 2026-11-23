export class RunnerEntryList extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    const list = this;
    const key = list.dataset.reorderList;
    this.controller = new AbortController();
    const listen = (event, callback) => list.addEventListener(event, callback, { signal: this.controller.signal });
    const rows = Array.from(list.children);
    if (rows.length < 2) return;

    let drag;
    let marker;
    let frame;
    let suppressClick = false;

    const updateTarget = () => {
      const grid = key === 'knowledge' && rows[0].offsetTop === rows[1].offsetTop;
      const next = rows.findIndex(row => {
        const { top, bottom, left, width, height } = row.getBoundingClientRect();
        if (grid && drag.y >= top && drag.y < bottom) return drag.x < left + width / 2;
        return drag.y < top + height / 2;
      });
      const slot = next < 0 ? rows.length : next;
      const { left, right } = list.getBoundingClientRect();
      const withinList = drag.x >= left && drag.x <= right;
      drag.to = withinList ? slot - Number(slot > drag.from) : drag.from;
      const target = drag.to === drag.from ? null : rows[Math.min(slot, rows.length - 1)];
      const position = next < 0 ? 'after' : 'before';
      if (target === marker && (!marker || marker.dataset.dropPosition === position)) return;
      marker?.removeAttribute('data-drop-position');
      marker = target;
      if (marker) marker.dataset.dropPosition = position;
    };

    const finish = () => {
      if (!drag) return;
      cancelAnimationFrame(frame);
      frame = undefined;
      marker?.removeAttribute('data-drop-position');
      marker = null;
      rows[drag.from].classList.remove('entry-dragging');
      drag = null;
    };

    this.finishDrag = finish;

    const scroll = () => {
      frame = undefined;
      if (!list.isConnected) return finish();
      const edge = 60;
      const bottomEdge = window.innerHeight - edge;
      const { left, right, top, bottom } = list.getBoundingClientRect();
      if (drag.x < left || drag.x > right) return;
      let distance = 0;
      if (drag.y < edge && top < edge) distance = drag.y - edge;
      if (drag.y > bottomEdge && bottom > bottomEdge) distance = drag.y - bottomEdge;
      if (!distance) return;
      const previousScroll = window.scrollY;
      window.scrollBy(0, Math.max(-18, Math.min(18, distance / 3)));
      if (window.scrollY === previousScroll) return;
      updateTarget();
      frame = requestAnimationFrame(scroll);
    };

    listen('pointerdown', event => {
      const handle = event.target.closest('.reorder-handle');
      if (!handle || !event.isPrimary || event.button !== 0 || drag) return;
      const from = Number(handle.closest('[data-entry-index]').dataset.entryIndex);
      drag = { id: event.pointerId, from, to: from, startX: event.clientX, startY: event.clientY };
      suppressClick = false;
      handle.setPointerCapture(event.pointerId);
    });
    listen('pointermove', event => {
      if (event.pointerId !== drag?.id) return;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!suppressClick) {
        if (Math.hypot(event.clientX - drag.startX, drag.y - drag.startY) < 6) return;
        suppressClick = true;
        rows[drag.from].querySelector('details').open = false;
        rows[drag.from].classList.add('entry-dragging');
      }
      updateTarget();
      frame ??= requestAnimationFrame(scroll);
    });
    listen('pointerup', event => {
      if (event.pointerId !== drag?.id) return;
      if (suppressClick) {
        drag.x = event.clientX;
        drag.y = event.clientY;
        updateTarget();
      }
      const { from, to } = drag;
      finish();
      this.moveEntry(from, to);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      listen(type, event => {
        if (event.pointerId === drag?.id) finish();
      });
    }
    listen('click', event => {
      if (event.target.closest('.reorder-handle') && suppressClick && event.detail > 0) {
        event.preventDefault();
        suppressClick = false;
      }
      const button = event.target.closest('[data-move]');
      if (button) {
        const from = Number(button.closest('[data-entry-index]').dataset.entryIndex);
        this.moveEntry(from, from + Number(button.dataset.move));
      }
    });
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.finishDrag?.();
    this.controller = undefined;
    this.finishDrag = undefined;
  }

  moveEntry(from, to) {
    if (from === to) return;
    this.dispatchEvent(new CustomEvent('entry-move', {
      detail: { key: this.dataset.reorderList, from, to },
      bubbles: true
    }));
  }
}

customElements.define('runner-entry-list', RunnerEntryList);
