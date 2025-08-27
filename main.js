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

       let touchOffsetY = 0;

function handleTouchStart(e) {
    if (e.target.className === 'delete-btn') return;

    e.preventDefault();
    const touch = e.touches[0];
    currentDragItem = this;
    currentDragItemRect = this.getBoundingClientRect();
    itemHeight = currentDragItemRect.height;

    touchOffsetY = touch.pageY - currentDragItemRect.top; // Record offset within item

    currentDragItem.classList.add('dragging');
    items = Array.from(document.querySelectorAll('.list-item:not(.dragging)'));
}

function handleTouchMove(e) {
    if (!currentDragItem) return;
    e.preventDefault();

    const touch = e.touches[0];
    const translateY = touch.pageY - currentDragItemRect.top - touchOffsetY;
    currentDragItem.style.transform = `translateY(${translateY}px)`;

    const currentY = touch.pageY;
    let closestItem = null;
    let closestDistance = Number.NEGATIVE_INFINITY;

    items.forEach(item => {
        const box = item.getBoundingClientRect();
        const boxCenterY = box.top + box.height / 2;
        const distance = currentY - boxCenterY;

        if (distance < 0 && distance > closestDistance) {
            closestDistance = distance;
            closestItem = item;
        }
    });

    if (closestItem) {
        currentDragItem.parentNode.insertBefore(currentDragItem, closestItem);
    } else {
        currentDragItem.parentNode.appendChild(currentDragItem);
    }
}

        function handleTouchEnd() {
            if (!currentDragItem) return;
            
            currentDragItem.style.transform = '';
            currentDragItem.classList.remove('dragging');
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
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }
