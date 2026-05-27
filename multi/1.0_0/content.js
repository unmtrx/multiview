function isWebFrame(frame) {
  return /^https?:\/\//.test(frame && frame.url || '');
}

function sendToWebFrames(tabId, message, done) {
  chrome.webNavigation.getAllFrames({ tabId }, function(frames) {
    if (chrome.runtime.lastError || !Array.isArray(frames)) {
      done(false);
      return;
    }

    const frameIds = frames.filter(isWebFrame).map(frame => frame.frameId);
    if (!frameIds.length) {
      done(false);
      return;
    }

    let pending = frameIds.length;
    let okCount = 0;
    frameIds.forEach(frameId => {
      chrome.tabs.sendMessage(tabId, message, { frameId }, function(response) {
        if (!chrome.runtime.lastError && response && response.status === 'ok') {
          okCount++;
        }
        pending--;
        if (pending === 0) done(okCount > 0);
      });
    });
  });
}

chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  if (!request || request.action !== 'elementHiderStartPicker') return;
  if (!request.tabId || !['start-picker', 'start-word-picker'].includes(request.pickerAction)) {
    sendResponse({ status: 'error' });
    return;
  }

  sendToWebFrames(request.tabId, { action: request.pickerAction }, function(started) {
    sendResponse({ status: started ? 'ok' : 'error' });
  });
  return true;
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (!request || request.action !== 'multiviewPickerFinished' || !sender.tab || !sender.tab.id) return;
  sendToWebFrames(sender.tab.id, { action: 'stop-picker' }, function() {});
});
