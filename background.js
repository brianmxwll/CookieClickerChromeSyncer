chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.openUrlInEditor)
      alert(request.openUrlInEditor);
  });