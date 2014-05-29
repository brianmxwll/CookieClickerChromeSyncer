chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        console.log("gotsomething");
		sendResponse({farewell: "goodbye"});
    }
);

chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		console.log("gotsomething");
		sendResponse({farewell: "goodbye"});
});