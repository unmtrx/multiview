// Add this at the very top of content.js
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
