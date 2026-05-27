if (window.self !== window.top) {
    const hideScrollbarStyle = document.createElement('style');
    hideScrollbarStyle.innerHTML = `
        /* Target the root elements of the injected website */
        html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
        }
        
        html, body, * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
        }
    `;
    
    // Inject the CSS into the website
    if (document.head) {
        document.head.appendChild(hideScrollbarStyle);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.head.appendChild(hideScrollbarStyle);
        });
    }
}

(function() {
  const RULES_KEY = 'elementHiderSelectorRules';
  const UI_ID = 'multiview-element-hider';
  let pickerActive = false;
  let highlighter = null;
  let selectedElement = null;
  let observer = null;

  function isInsideMultiViewFrame() {
    if (window.self === window.top) return false;
    const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
    const extensionUrl = `${extensionOrigin}/`;
    const ancestors = window.location.ancestorOrigins ? Array.from(window.location.ancestorOrigins) : [];
    return document.referrer.startsWith(extensionUrl) || ancestors.includes(extensionOrigin);
  }

  if (!isInsideMultiViewFrame()) return;

  function onReady(callback) {
    if (document.body) {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    }
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function cssString(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function htmlAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function generateSelector(el) {
    if (!el || !(el instanceof Element)) return '';

    if (el.id) {
      const idSelector = `#${cssEscape(el.id)}`;
      try {
        if (document.querySelectorAll(idSelector).length === 1) return idSelector;
      } catch (e) {}
    }

    if (el.getAttribute('data-testid')) {
      return `[data-testid="${cssString(el.getAttribute('data-testid'))}"]`;
    }

    const path = [];
    let current = el;
    while (current && current.tagName && current.tagName !== 'BODY') {
      let selector = current.tagName.toLowerCase();
      const classes = Array.from(current.classList || []).filter(name => !name.includes(':'));
      if (classes.length) selector += `.${classes.map(cssEscape).join('.')}`;

      let sibling = current;
      let count = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.tagName === current.tagName) count++;
      }
      if (count > 1) selector += `:nth-of-type(${count})`;

      path.unshift(selector);
      try {
        if (document.querySelectorAll(path.join(' > ')).length === 1) {
          return path.join(' > ');
        }
      } catch (e) {}

      current = current.parentElement;
    }

    return path.join(' > ');
  }

  function injectPickerStyles() {
    if (document.getElementById(`${UI_ID}-styles`)) return;
    const style = document.createElement('style');
    style.id = `${UI_ID}-styles`;
    style.textContent = `
      #${UI_ID}-highlighter {
        position: fixed !important;
        z-index: 2147483646 !important;
        pointer-events: none !important;
        box-sizing: border-box !important;
        border: 2px solid #35d7ff !important;
        background-color: rgba(53, 215, 255, 0.22) !important;
      }
      #${UI_ID}-dialog {
        position: fixed !important;
        z-index: 2147483647 !important;
        top: 20px !important;
        right: 20px !important;
        width: 350px !important;
        padding: 15px !important;
        box-sizing: content-box !important;
        background: linear-gradient(180deg, rgba(16, 27, 45, 0.98), rgba(9, 17, 30, 0.99)) !important;
        border: 1px solid rgba(112, 214, 255, 0.18) !important;
        border-radius: 8px !important;
        box-shadow: 0 18px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(112, 214, 255, 0.05) !important;
        color: #f4f8ff !important;
        font: 14px Roboto, Arial, sans-serif !important;
      }
      #${UI_ID}-dialog * {
        font-family: Roboto, Arial, sans-serif !important;
      }
      #${UI_ID}-dialog h3 {
        margin: 0 0 10px !important;
        color: #f4f8ff !important;
        font-size: 16px !important;
      }
      #${UI_ID}-dialog label {
        display: block !important;
        margin-bottom: 5px !important;
        color: #91a7bf !important;
        font-weight: 500 !important;
      }
      #${UI_ID}-dialog .selector-input {
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 10px !important;
        padding: 8px !important;
        background: rgba(5, 10, 20, 0.72) !important;
        border: 1px solid rgba(112, 214, 255, 0.18) !important;
        border-radius: 4px !important;
        color: #f4f8ff !important;
        font-family: monospace !important;
        outline: none !important;
      }
      #${UI_ID}-dialog .parents-nav {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 5px !important;
        margin-bottom: 10px !important;
      }
      #${UI_ID}-dialog .parent-btn,
      #${UI_ID}-dialog .actions button {
        cursor: pointer !important;
        border: 1px solid rgba(112, 214, 255, 0.18) !important;
        border-radius: 4px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        color: #f4f8ff !important;
      }
      #${UI_ID}-dialog .parent-btn {
        padding: 3px 8px !important;
        color: #91a7bf !important;
      }
      #${UI_ID}-dialog .parent-btn:hover,
      #${UI_ID}-dialog .actions button:hover {
        background: rgba(53, 215, 255, 0.12) !important;
        color: #7be8ff !important;
      }
      #${UI_ID}-dialog .parent-btn.active,
      #${UI_ID}-dialog .save-btn {
        background: linear-gradient(135deg, #35d7ff, #1788ff) !important;
        border-color: transparent !important;
        color: #03111f !important;
      }
      #${UI_ID}-dialog .match-count {
        margin-bottom: 15px !important;
        color: #91a7bf !important;
        font-size: 12px !important;
      }
      #${UI_ID}-dialog .actions {
        display: flex !important;
        justify-content: flex-end !important;
        gap: 10px !important;
      }
      #${UI_ID}-dialog .actions button {
        padding: 8px 15px !important;
      }
      .${UI_ID}-preview {
        position: fixed !important;
        z-index: 2147483645 !important;
        pointer-events: none !important;
        box-sizing: border-box !important;
        border: 2px solid #ff5d73 !important;
        background-color: rgba(255, 93, 115, 0.25) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function cleanupPicker(notify) {
    pickerActive = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onPickerMouseMove);
    document.removeEventListener('click', onPickerClick, true);
    document.removeEventListener('keydown', onPickerKeyDown, true);
    document.getElementById(`${UI_ID}-highlighter`)?.remove();
    document.getElementById(`${UI_ID}-dialog`)?.remove();
    document.querySelectorAll(`.${UI_ID}-preview`).forEach(el => el.remove());
    highlighter = null;
    selectedElement = null;
    if (notify) chrome.runtime.sendMessage({ action: 'multiviewPickerFinished' });
  }

  function startPicker() {
    onReady(() => {
      if (pickerActive) return;
      cleanupPicker(false);
      pickerActive = true;
      injectPickerStyles();
      document.body.style.cursor = 'crosshair';
      highlighter = document.createElement('div');
      highlighter.id = `${UI_ID}-highlighter`;
      document.body.appendChild(highlighter);
      document.addEventListener('mousemove', onPickerMouseMove);
      document.addEventListener('click', onPickerClick, true);
      document.addEventListener('keydown', onPickerKeyDown, true);
    });
  }

  function onPickerMouseMove(event) {
    if (!pickerActive || event.target.closest(`#${UI_ID}-dialog`)) return;
    const rect = event.target.getBoundingClientRect();
    Object.assign(highlighter.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
  }

  function onPickerClick(event) {
    if (!pickerActive || event.target.closest(`#${UI_ID}-dialog`)) return;
    event.preventDefault();
    event.stopPropagation();
    pickerActive = false;
    selectedElement = event.target;
    showDialog(selectedElement);
  }

  function onPickerKeyDown(event) {
    if (event.key === 'Escape') cleanupPicker(true);
  }

  function showDialog(element) {
    injectPickerStyles();
    document.getElementById(`${UI_ID}-dialog`)?.remove();
    const dialog = document.createElement('div');
    dialog.id = `${UI_ID}-dialog`;
    document.body.appendChild(dialog);

    let currentElement = element;
    function render() {
      const selector = generateSelector(currentElement);
      const buttons = [];
      let temp = currentElement;
      for (let i = 0; i < 5 && temp && temp.parentElement && temp.tagName !== 'BODY'; i++) {
        buttons.push(`<button class="parent-btn ${temp === currentElement ? 'active' : ''}" data-level="${i}">${temp.tagName.toLowerCase()}</button>`);
        temp = temp.parentElement;
      }
      dialog.innerHTML = `
        <h3>Create a Hiding Rule</h3>
        <label>CSS Selector:</label>
        <input type="text" class="selector-input" value="${htmlAttr(selector)}">
        <label>Select Element Level:</label>
        <div class="parents-nav">${buttons.join('')}</div>
        <div class="match-count"></div>
        <div class="actions">
          <button class="cancel-btn">Cancel</button>
          <button class="save-btn">Save Rule</button>
        </div>
      `;
      updatePreview(dialog);
    }

    dialog.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.target.classList.contains('cancel-btn')) cleanupPicker(true);
      if (event.target.classList.contains('save-btn')) {
        saveSelector(dialog.querySelector('.selector-input').value);
        cleanupPicker(true);
      }
      if (event.target.classList.contains('parent-btn')) {
        let next = element;
        const level = parseInt(event.target.dataset.level, 10);
        for (let i = 0; i < level && next.parentElement; i++) next = next.parentElement;
        currentElement = next;
        render();
      }
    });

    dialog.addEventListener('input', event => {
      if (event.target.classList.contains('selector-input')) updatePreview(dialog);
    });

    render();
  }

  function updatePreview(dialog) {
    const input = dialog.querySelector('.selector-input');
    const count = dialog.querySelector('.match-count');
    document.querySelectorAll(`.${UI_ID}-preview`).forEach(el => el.remove());
    try {
      const matches = Array.from(document.querySelectorAll(input.value))
        .filter(el => !el.closest(`#${UI_ID}-dialog`));
      count.textContent = `${matches.length} element(s) found.`;
      matches.forEach(match => {
        const rect = match.getBoundingClientRect();
        const preview = document.createElement('div');
        preview.className = `${UI_ID}-preview`;
        document.body.appendChild(preview);
        Object.assign(preview.style, {
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`
        });
      });
    } catch (e) {
      count.textContent = 'Invalid selector.';
    }
  }

  function saveSelector(selector) {
    const cleanSelector = String(selector || '').trim();
    if (!cleanSelector) return;
    chrome.storage.local.get({ [RULES_KEY]: [] }, result => {
      const rules = Array.isArray(result[RULES_KEY]) ? result[RULES_KEY] : [];
      if (!rules.includes(cleanSelector)) rules.push(cleanSelector);
      chrome.storage.local.set({ [RULES_KEY]: rules }, applyRules);
    });
  }

  function applyRules() {
    chrome.storage.local.get({ [RULES_KEY]: [] }, result => {
      const rules = Array.isArray(result[RULES_KEY]) ? result[RULES_KEY] : [];
      rules.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(element => {
            if (!element.closest(`#${UI_ID}-dialog`)) element.style.setProperty('display', 'none', 'important');
          });
        } catch (e) {}
      });
    });
  }

  function initHider() {
    applyRules();
    if (observer) observer.disconnect();
    observer = new MutationObserver(applyRules);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start-picker') {
      startPicker();
      sendResponse({ status: 'ok' });
      return true;
    }
    if (request.action === 'stop-picker') {
      cleanupPicker(false);
      sendResponse({ status: 'ok' });
      return true;
    }
    return false;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[RULES_KEY]) applyRules();
  });

  onReady(initHider);
})();

chrome.storage.local.get('layout', function(data) {
  if (data.layout) {
    var layout = data.layout;
    var container = document.createElement('div');
    container.style.display = 'flex';
    container.style.width = '100%';
    container.style.height = '100%';

    if (layout === 'two') {
      createIframe(container, '50%', '100%');
      createIframe(container, '50%', '100%');
    } else if (layout === 'four') {
      container.style.flexWrap = 'wrap';
      for (var i = 0; i < 4; i++) {
        createIframe(container, '50%', '50%');
      }
    }

    document.body.appendChild(container);
  }
});

function createIframe(container, width, height) {
  var iframe = document.createElement('iframe');
  iframe.style.width = width;
  iframe.style.height = height;
  // Add more styling and functionality as needed
  container.appendChild(iframe);
}

// Function to prompt for a URL and load it into the iframe
function setIframeURL(iframe) {
  var url = prompt("Enter a URL to load:");
  if (url) {
    iframe.src = url;
  }
}

// Adding event listeners to iframes for setting URLs
document.querySelectorAll('iframe').forEach(iframe => {
  iframe.addEventListener('dblclick', function() {
    setIframeURL(iframe);
  });
});

// Function to make an iframe resizable
function makeResizable(iframe) {
  iframe.addEventListener('mousedown', function(e) {
    e.preventDefault();
    window.addEventListener('mousemove', resizeIframe, false);
    window.addEventListener('mouseup', stopResize, false);

    function resizeIframe(moveEvent) {
      iframe.style.width = moveEvent.clientX + 'px';
      iframe.style.height = moveEvent.clientY + 'px';
    }

    function stopResize() {
      window.removeEventListener('mousemove', resizeIframe, false);
      window.removeEventListener('mouseup', stopResize, false);
    }
  });
}

// Apply the resizable feature to each iframe
document.querySelectorAll('iframe').forEach(iframe => {
  makeResizable(iframe);
});
