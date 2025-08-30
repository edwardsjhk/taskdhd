// === Load saved items ===
document.addEventListener('DOMContentLoaded', function () {
  const savedItems = getCookie('listItems');
  if (savedItems) {
    const items = JSON.parse(savedItems);
    items.forEach(item => createListItem(item));
  }
});

// === State for drag & long-press ===
let currentDragItem = null;
let placeholder = null;
let offsetY = 0;

let touchStartX = 0;
let touchStartY = 0;
let longPressTimer = null;
let longPressTriggered = false;

const LONG_PRESS_DELAY = 500;          // ms press to trigger menu
const DRAG_THRESHOLD_PX = 8;           // px move before we start dragging

// === Add new item ===
function addItem() {
  const input = document.getElementById('newItem');
  const text = input.value.trim();
  if (text) {
    createListItem(text);
    input.value = '';
    saveItems();
    input.blur();
  }
}

document.getElementById('newItem').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') addItem();
});

// === Create list item ===
function createListItem(text) {
  const list = document.getElementById('sortableList');
  const li = document.createElement('li');
  li.className = 'list-item';
  li.setAttribute('tabindex', '0');
  li.innerHTML = `
    <span class="item-text"></span>
    <span class="delete-btn" onclick="deleteItem(this)">X</span>
  `;
  li.querySelector('.item-text').textContent = text;

  // Touch for drag + long-press
  li.addEventListener('touchstart', handleTouchStart, { passive: true });
  li.addEventListener('touchmove', handleTouchMove, { passive: false });
  li.addEventListener('touchend', handleTouchEnd);

  // Right-click context menu (desktop)
  li.addEventListener('contextmenu', handleContextMenu);

  list.appendChild(li);
}

// === Delete item ===
function deleteItem(element) {
  element.parentElement.remove();
  saveItems();
}

// === Drag helpers ===
function startDrag(li, touch) {
  currentDragItem = li;

  const rect = li.getBoundingClientRect();
  offsetY = touch.pageY - rect.top;

  // Create placeholder
  placeholder = document.createElement('li');
  placeholder.className = 'placeholder';
  placeholder.style.height = rect.height + 'px';
  li.parentNode.insertBefore(placeholder, li);

  // Take item out of flow
  li.style.position = 'absolute';
  li.style.width = rect.width + 'px';
  li.style.zIndex = 1000;
  li.classList.add('dragging');

  moveAt(touch.pageY);
}

function moveAt(pageY) {
  if (!currentDragItem) return;
  currentDragItem.style.top = pageY - offsetY + 'px';
}

function dropDrag() {
  if (!currentDragItem) return;

  // Drop into placeholder
  placeholder.parentNode.insertBefore(currentDragItem, placeholder);
  placeholder.remove();
  placeholder = null;

  // Reset styles
  currentDragItem.style.position = '';
  currentDragItem.style.top = '';
  currentDragItem.style.width = '';
  currentDragItem.style.zIndex = '';
  currentDragItem.classList.remove('dragging');
  currentDragItem = null;

  saveItems();
}

// === Touch handlers (drag vs long-press) ===
function handleTouchStart(e) {
  if (e.target.classList.contains('delete-btn')) return;
  if (this.dataset.editing === 'true') return; // don't drag while renaming

  const touch = e.touches[0];
  touchStartX = touch.pageX;
  touchStartY = touch.pageY;
  longPressTriggered = false;

  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    showContextMenu(touchStartX, touchStartY, this);
  }, LONG_PRESS_DELAY);
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  const dx = Math.abs(touch.pageX - touchStartX);
  const dy = Math.abs(touch.pageY - touchStartY);
  const moved = dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX;

  // If finger moves, cancel long-press menu
  if (moved && longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  // Start drag only after threshold movement and not already dragging and not editing
  if (moved && !currentDragItem && this.dataset.editing !== 'true') {
    startDrag(this, touch);
  }

  if (currentDragItem) {
    e.preventDefault(); // allow us to move without page scrolling
    moveAt(touch.pageY);

    // Reorder placeholder position
    const list = document.getElementById('sortableList');
    const siblings = Array.from(list.querySelectorAll('.list-item:not(.dragging)'));

    for (let item of siblings) {
      const box = item.getBoundingClientRect();
      if (touch.pageY < box.top + box.height / 2) {
        list.insertBefore(placeholder, item);
        return;
      }
    }
    list.appendChild(placeholder);
  }
}

function handleTouchEnd() {
  clearTimeout(longPressTimer);
  longPressTimer = null;

  if (currentDragItem) {
    dropDrag();
  }
  // If long-press triggered, the menu is already shown; nothing else to do here.
}

// === Inline rename ===
function enterRenameMode(li) {
  if (!li || li.dataset.editing === 'true') return;

  // Hide context menu if open
  hideContextMenu();

  li.dataset.editing = 'true';

  const textSpan = li.querySelector('.item-text');
  const oldText = textSpan ? textSpan.textContent : li.textContent.replace('X', '').trim();

  // Build input
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldText;
  input.className = 'rename-input';
  input.setAttribute('aria-label', 'Rename item');
  input.style.minWidth = '4ch';

  // Place input right after text and hide text while editing
  if (textSpan) {
    textSpan.style.display = 'none';
    textSpan.after(input);
  } else {
    li.insertBefore(input, li.querySelector('.delete-btn'));
  }

  // Focus & place cursor at end
  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);

  const finish = (commit) => {
    if (li.dataset.editing !== 'true') return;
    let newText = input.value.trim();
    if (!commit || newText === '') newText = oldText;

    if (textSpan) {
      textSpan.textContent = newText;
      textSpan.style.display = '';
    }
    input.remove();
    li.dataset.editing = 'false';
    saveItems();
  };

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
    else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
  });

  input.addEventListener('blur', () => finish(true));
}

// === Context menu (right-click and long-press) ===
let ctxMenuEl = null;
let ctxTargetLi = null;

function ensureContextMenu() {
  if (ctxMenuEl) return;
  ctxMenuEl = document.createElement('div');
  ctxMenuEl.id = 'miniContextMenu';
  ctxMenuEl.style.position = 'absolute';
  ctxMenuEl.style.display = 'none';
  ctxMenuEl.style.padding = '8px 10px';
  ctxMenuEl.style.border = '1px solid rgba(0,0,0,0.15)';
  ctxMenuEl.style.borderRadius = '10px';
  ctxMenuEl.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
  ctxMenuEl.style.background = 'white';
  ctxMenuEl.style.fontSize = '14px';
  ctxMenuEl.style.userSelect = 'none';
  ctxMenuEl.style.zIndex = '9999';
  ctxMenuEl.style.minWidth = '120px';
  ctxMenuEl.style.cursor = 'default';

  const btn = document.createElement('div');
  btn.textContent = 'Rename';
  btn.style.padding = '6px 8px';
  btn.style.borderRadius = '8px';

  btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(0,0,0,0.06)'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const target = ctxTargetLi;
    hideContextMenu();
    if (target) enterRenameMode(target);
  });

  ctxMenuEl.appendChild(btn);
  document.body.appendChild(ctxMenuEl);

  // Global dismiss
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('scroll', hideContextMenu, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });
}

function showContextMenu(x, y, li) {
  ensureContextMenu();
  ctxTargetLi = li;

  // Position (keep inside viewport)
  const margin = 8;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  ctxMenuEl.style.display = 'block';
  const rect = ctxMenuEl.getBoundingClientRect();
  let left = x;
  let top = y;

  if (left + rect.width + margin > vw) left = vw - rect.width - margin;
  if (top + rect.height + margin > vh) top = vh - rect.height - margin;

  ctxMenuEl.style.left = left + 'px';
  ctxMenuEl.style.top = top + 'px';
}

function hideContextMenu() {
  if (!ctxMenuEl) return;
  ctxMenuEl.style.display = 'none';
  ctxTargetLi = null;
}

function handleContextMenu(e) {
  if (e.target.classList.contains('delete-btn')) return;
  e.preventDefault();
  showContextMenu(e.pageX, e.pageY, this);
}

// === Save / Load helpers ===
function saveItems() {
  const items = [];
  document.querySelectorAll('.list-item').forEach(li => {
    const span = li.querySelector('.item-text');
    if (span) items.push(span.textContent.trim());
    else items.push(li.textContent.replace('X', '').trim());
  });
  setCookie('listItems', JSON.stringify(items), 365);
}

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// === Keyboard-aware reposition for add bar ===
(function () {
  const addBar = document.getElementById('addBar');
  if (!addBar) return;

  const setShift = (px) => {
    document.documentElement.style.setProperty('--keyboard-shift', px ? `-${px}px` : '0px');
    document.documentElement.style.setProperty('--bottom-inset', px ? `${px}px` : '0px');
  };

  const reposition = () => {
    const vv = window.visualViewport;
    if (!vv) {
      setShift(0);
      return;
    }
    const keyboard = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
    setShift(keyboard > 40 ? keyboard : 0);
  };

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', reposition);
    vv.addEventListener('scroll', reposition);
  }
  window.addEventListener('orientationchange', () => setTimeout(reposition, 0));
  window.addEventListener('resize', reposition);
  document.addEventListener('focusin', reposition);
  document.addEventListener('focusout', () => setTimeout(reposition, 0));

  reposition();
})();
