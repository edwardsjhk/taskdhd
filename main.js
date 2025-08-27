    if (touch.pageY < box.top + box.height / 2) {
      list.insertBefore(placeholder, item);
      return;
    }
  }

  list.appendChild(placeholder);
}

function handleTouchEnd() {
  if (!currentDragItem) return;

  // Drop item into placeholder
  placeholder.parentNode.insertBefore(currentDragItem, placeholder);
  placeholder.remove();
  placeholder = null;

  // Reset styles
  currentDragItem.style.position = "";
  currentDragItem.style.top = "";
  currentDragItem.style.width = "";
  currentDragItem.style.zIndex = "";
  currentDragItem.classList.remove("dragging");
  currentDragItem = null;

  saveItems();
}

     

        function saveItems() {
            const items = [];
            document.querySelectorAll('.list-item').forEach(item => {
                items.push(item.textContent.replace('X', '').trim());
            });
            setCookie('listItems', JSON.stringify(items), 365);
        }

        function setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = name + '=' + value + ';expires=' + expires.toUTCString();
        }

        function getCookie(name) {
                    document.addEventListener('DOMContentLoaded', function() {
            const savedItems = getCookie('listItems');
            if (savedItems) {
                const items = JSON.parse(savedItems);
                items.forEach(item => createListItem(item));
            }
        });

        let touchStartY = 0;
        let currentDragItem = null;
        let currentDragItemRect = null;
        let itemHeight = 0;
        let items = [];

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

        document.getElementById('newItem').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addItem();
            }
        });

        function createListItem(text) {
            const list = document.getElementById('sortableList');
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = text + '<span class="delete-btn" onclick="deleteItem(this)">X</span>';
            
            li.addEventListener('touchstart', handleTouchStart, {passive: false});
            li.addEventListener('touchmove', handleTouchMove, {passive: false});
            li.addEventListener('touchend', handleTouchEnd);
            
            list.appendChild(li);
        }

        function deleteItem(element) {
            element.parentElement.remove();
            saveItems();
        }

    let placeholder = null;
let offsetY = 0;

function handleTouchStart(e) {
  if (e.target.classList.contains("delete-btn")) return;

  const touch = e.touches[0];
  currentDragItem = this;
  const rect = currentDragItem.getBoundingClientRect();

  offsetY = touch.pageY - rect.top;

  // Create placeholder
  placeholder = document.createElement("li");
  placeholder.className = "placeholder";
  placeholder.style.height = rect.height + "px";
  currentDragItem.parentNode.insertBefore(placeholder, currentDragItem);

  // Move item out of flow
  currentDragItem.style.position = "absolute";
  currentDragItem.style.width = rect.width + "px";
  currentDragItem.style.zIndex = 1000;
  currentDragItem.classList.add("dragging");

  moveAt(touch.pageY);
}

function moveAt(pageY) {
  currentDragItem.style.top = pageY - offsetY + "px";
}

function handleTouchMove(e) {
  if (!currentDragItem) return;
  e.preventDefault();

  const touch = e.touches[0];
  moveAt(touch.pageY);

  // Check where placeholder should go
  const list = document.getElementById("sortableList");
  const items = Array.from(list.querySelectorAll(".list-item:not(.dragging)"));

  for (let item of items) {
    const box = item.getBoundingClientRect();
const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }
        
const addBar = document.getElementById("addbar");

window.visualViewport.addEventListener("resize", () => {
  const viewportHeight = window.visualViewport.height;
  const totalHeight = window.innerHeight;

  // If viewport shrinks, keyboard is open
  if (viewportHeight < totalHeight) {
    addBar.style.bottom = (totalHeight - viewportHeight) + "px";
  } else {
    addBar.style.bottom = "0px";
  }
});

