document.getElementById('twoFrames').addEventListener('click', function() {
  chrome.storage.local.set({ 'layout': 'two' }, function() {
    chrome.storage.local.get('layout', function(result) {
      //console.log(result.layout); // Should log 'two'
    });
  });
  window.close();
});

document.getElementById('fourFrames').addEventListener('click', function() {
  if(window.storage){
    window.storage.local.set({ 'layout': 'four' });
    window.close();
  }
});


function openMainPage(layout) {
  chrome.tabs.create({
    url: 'main.html?layout=' + layout
  });
}

document.getElementById('twoFrames').addEventListener('click', function() {
  openMainPage('two');
});

document.getElementById('threeFrames').addEventListener('click', function() {
  openMainPage('three'); // This matches the setupLayout('three') logic
});

document.getElementById('fourFrames').addEventListener('click', function() {
  openMainPage('four');
});