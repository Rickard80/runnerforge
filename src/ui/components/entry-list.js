import { ENTRY_LIST } from '../../domain/data/rules.js';

const DROP_POSITION = Object.freeze({ Before: 'before', After: 'after' });
const DRAG_THRESHOLD = 6;

export class RunnerEntryList extends HTMLElement {
  connectedCallback() {
    if (this.controller || this.children.length < 2) return;
    this.rows = Array.from(this.children);
    this.controller = new AbortController();
    this.listen('pointerdown', eventObj => this.startDrag(eventObj));
    this.listen('pointermove', eventObj => this.moveDrag(eventObj));
    this.listen('pointerup', eventObj => this.dropEntry(eventObj));
    this.listen('pointercancel', eventObj => this.cancelDrag(eventObj));
    this.listen('lostpointercapture', eventObj => this.cancelDrag(eventObj));
    this.listen('click', eventObj => this.handleClick(eventObj));
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.finishDrag();
    this.controller = undefined;
    this.rows = undefined;
    this.suppressClick = false;
  }

  listen(eventStr, callback) {
    this.addEventListener(eventStr, callback, { signal: this.controller.signal });
  }

  moveEntry(from, to) {
    if (from === to) return;
    this.dispatchEvent(new CustomEvent('entry-move', {
      detail: { key: this.dataset.reorderList, from, to },
      bubbles: true
    }));
  }

  startDrag(eventObj) {
    const handle = eventObj.target.closest('.reorder-handle');
    if (!handle || !eventObj.isPrimary || eventObj.button !== 0 || this.drag) return;
    const from = entryIndex(handle);
    this.drag = { id: eventObj.pointerId, from, to: from, startX: eventObj.clientX, startY: eventObj.clientY };
    this.suppressClick = false;
    handle.setPointerCapture(eventObj.pointerId);
  }

  moveDrag(eventObj) {
    const drag = this.drag;
    if (eventObj.pointerId !== drag?.id) return;
    drag.x = eventObj.clientX;
    drag.y = eventObj.clientY;
    if (!this.suppressClick) {
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < DRAG_THRESHOLD) return;
      this.suppressClick = true;
      this.rows[drag.from].querySelector('details').open = false;
      this.rows[drag.from].classList.add('entry-dragging');
    }
    this.updateTarget();
    this.scheduleScroll();
  }

  dropEntry(eventObj) {
    const drag = this.drag;
    if (eventObj.pointerId !== drag?.id) return;
    if (this.suppressClick) {
      drag.x = eventObj.clientX;
      drag.y = eventObj.clientY;
      this.updateTarget();
    }
    this.finishDrag();
    this.moveEntry(drag.from, drag.to);
  }

  cancelDrag(eventObj) {
    if (eventObj.pointerId === this.drag?.id) this.finishDrag();
  }

  finishDrag() {
    if (!this.drag) return;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    this.setMarker(null);
    this.rows[this.drag.from].classList.remove('entry-dragging');
    this.drag = null;
  }

  handleClick(eventObj) {
    if (eventObj.target.closest('.reorder-handle') && this.suppressClick && eventObj.detail > 0) {
      eventObj.preventDefault();
      this.suppressClick = false;
    }
    const button = eventObj.target.closest('[data-move]');
    if (!button) return;
    const from = entryIndex(button);
    this.moveEntry(from, from + Number(button.dataset.move));
  }

  updateTarget() {
    const { drag, rows } = this;
    const { left, right } = this.getBoundingClientRect();
    const isWithinList = drag.x >= left && drag.x <= right;
    const next = this.findInsertionIndex();
    const slot = next < 0 ? rows.length : next;
    drag.to = isWithinList ? slot - Number(slot > drag.from) : drag.from;
    const target = drag.to === drag.from ? null : rows[Math.min(slot, rows.length - 1)];
    this.setMarker(target, next < 0 ? DROP_POSITION.After : DROP_POSITION.Before);
  }

  findInsertionIndex() {
    const { drag, rows } = this;
    const isGrid = this.dataset.reorderList === ENTRY_LIST.Knowledge && rows[0].offsetTop === rows[1].offsetTop;
    return rows.findIndex(rowObj => {
      const { top, bottom, left, width, height } = rowObj.getBoundingClientRect();
      if (isGrid && drag.y >= top && drag.y < bottom) return drag.x < left + width / 2;
      return drag.y < top + height / 2;
    });
  }

  setMarker(targetObj, positionStr) {
    if (targetObj === this.marker && (!targetObj || targetObj.dataset.dropPosition === positionStr)) return;
    this.marker?.removeAttribute('data-drop-position');
    this.marker = targetObj;
    if (targetObj) targetObj.dataset.dropPosition = positionStr;
  }

  scheduleScroll() {
    this.frame ??= requestAnimationFrame(() => this.scrollDuringDrag());
  }

  scrollDuringDrag() {
    this.frame = undefined;
    if (!this.isConnected || !this.drag) return;
    const distance = this.scrollDistance();
    if (!distance) return;

    const previousScroll = window.scrollY;
    window.scrollBy(0, Math.max(-18, Math.min(18, distance / 3)));
    if (window.scrollY === previousScroll) return;
    this.updateTarget();
    this.scheduleScroll();
  }

  scrollDistance() {
    const { x, y } = this.drag;
    const edge = 60;
    const bottomEdge = window.innerHeight - edge;
    const { left, right, top, bottom } = this.getBoundingClientRect();
    if (x < left || x > right) return 0;
    if (y > bottomEdge && bottom > bottomEdge) return y - bottomEdge;
    if (y < edge && top < edge) return y - edge;
    return 0;
  }
}

function entryIndex(elementObj) {
  return Number(elementObj.closest('[data-entry-index]').dataset.entryIndex);
}

customElements.define('runner-entry-list', RunnerEntryList);
