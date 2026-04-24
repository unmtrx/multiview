function createIframeContainer(index) {
  var container = document.createElement('div');
  container.className = 'iframe-container';

  var iframe = document.createElement('iframe');
  iframe.id = 'iframe' + index;
  iframe.style.display = 'none'; 
  

  chrome.storage.local.get(['url' + index], function(result) {
    var url = result['url' + index];
    if (url) {
      iframe.src = url;
      iframe.style.display = url ? 'block' : 'none';
    }
  });

  var iframeButton = document.createElement('button');
  iframeButton.className = 'iframe-url-button';
  iframeButton.textContent = 'Set URL';
  iframeButton.addEventListener('click', function() {
    showUrlInputForm(index);
  });

  container.appendChild(iframe);
  container.appendChild(iframeButton);

  return container;
}

// Function to display URL input form with pre-populated URL
function showUrlInputForm(index) {
  var form = document.getElementById('urlInputForm');
  var input = document.getElementById('urlInput');

  // Fetch and set the stored URL for the current iframe
  chrome.storage.local.get(['url' + index], function(result) {
    if (result['url' + index]) {
      input.value = result['url' + index];
    } else {
      input.value = ''; // Clear the input if there's no stored URL
    }
  });

  form.style.display = 'block';
  setCurrentIframeIndex(index);
}


function createIframe(index) {
  var iframe = document.createElement('iframe');
  iframe.id = 'iframe' + index;

  // Load URL from storage
  chrome.storage.local.get(['url' + index], function(result) {
    if (result['url' + index]) {
      iframe.src = result['url' + index];
    }
  });

  // Create and add URL input form
  var form = document.createElement('div');
  form.className = 'urlInputForm';
  form.id = 'form' + index;
  form.innerHTML = '<input type="text" class="urlInput" placeholder="Enter URL">' +
    '<button onclick="setIframeURL(' + index + ')">Set URL</button>';
  iframe.appendChild(form);

  return iframe;
}

// Function to set and save URL for iframe
function setIframeURL(index) {
  var url = document.getElementById('form' + index).querySelector('.urlInput').value;
  document.getElementById('iframe' + index).src = url;

  // Save URL to storage
  var storageKey = 'url' + index;
  var storageObject = {};
  storageObject[storageKey] = url;
  chrome.storage.local.set(storageObject);

  // Hide the form
  document.getElementById('form' + index).style.display = 'none';
}


function setupLayout(layout) {
  var container = document.getElementById('container');
  container.innerHTML = '';  
  container.className = ''; // Clear old grid classes

  var count;
  if (layout === 'two') {
    count = 2;
    container.classList.add('grid-2');
  } else if (layout === 'three') {
    count = 3;
    container.classList.add('grid-3');
  } else {
    count = 4;
    container.classList.add('grid-4');
  }

  for (var i = 0; i < count; i++) {
    container.appendChild(createIframeContainer(i));
  }
}



// Function to set the current iframe index
var currentIframeIndex = 0;
function setCurrentIframeIndex(index) {
  currentIframeIndex = index;
}

function hideUrlInputForm() {
  document.getElementById('urlInputForm').style.display = 'none';
}

function setIframeUrl(href, deleteUrl){
    var url = document.getElementById('urlInput').value;

    // Check if the URL is not empty
    if (url.trim() !== '') {

      if(deleteUrl){
        url = '';
      }

      var iframeId = 'iframe' + currentIframeIndex;
      var iframe = document.getElementById(iframeId);

      // Set the iframe source and load the URL
      iframe.src = url;
      iframe.style.display = 'block';

      // Save the URL to local storage
      var storageKey = 'url' + currentIframeIndex;
      var storageObject = {};

      storageObject[storageKey] = url;

      chrome.storage.local.set(storageObject);
    }

    // Hide the URL input form
    hideUrlInputForm();
}

document.getElementById('setUrlButton')
  .addEventListener('click', setIframeUrl);


document.getElementById('cancelSetUrlButton')
  .addEventListener('click', hideUrlInputForm);


document.getElementById('clearSetUrlButton')
  .addEventListener('click', function(){
    setIframeUrl('',true);
  });

// Extract the layout parameter from the URL
const params = new URLSearchParams(window.location.search);
const layout = params.get('layout');
setupLayout(layout);

// Function to set and save URL for iframe
document.getElementById('setUrlButton').addEventListener('click', function() {
  var url = document.getElementById('urlInput').value;
  var iframeId = 'iframe' + currentIframeIndex;
  var iframe = document.getElementById(iframeId);

  // Set the iframe source and load the URL
  iframe.src = url.trim() !== '' ? url : 'about:blank';
  iframe.style.display = url.trim() !== '' ? 'block' : 'none';

  // Save the URL to local storage
  var storageKey = 'url' + currentIframeIndex;
  var storageObject = {};
  storageObject[storageKey] = url;
  chrome.storage.local.set(storageObject);

  // Hide the URL input form
  document.getElementById('urlInputForm').style.display = 'none';
});
