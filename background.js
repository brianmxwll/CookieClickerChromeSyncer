chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
		console.log(request);
		if (request.action == "save") {
			//Get the current sync data.
			chrome.storage.sync.get('ChromeCookiesScore', function (result) {
				if (IsEmptyResponse(result)) {
					score = -1; //No score saved, any valid score should overwrite this.
				} else {
					score = result.ChromeCookiesScore[0];
				}
				
				//Is the score lower than ours? If so, push our new score to sync.
				if (score < request.cookies) {
					//Save new score
					chrome.storage.sync.set({'ChromeCookiesScore': [request.cookies, request.save] });
				} 
				sendResponse({ response:true });
			});
			return true;			
		} else if (request.action == 'load') {
			chrome.storage.sync.get('ChromeCookiesScore', function (obj) {
				if(IsEmptyResponse(obj)){
					sendResponse({ valid:false });
				} else {
					sendResponse({ valid:true, save:obj.ChromeCookiesScore[1] });
				}
			});
			return true;
		} else if (request.action == 'reset') {
			chrome.storage.sync.remove('ChromeCookiesScore', function (obj) {
				sendResponse({ response:true });
			});
		} else {
			sendResponse({ response:false });
		}
    }
);

function IsEmptyResponse(input) {
	return Object.getOwnPropertyNames(input).length === 0;
}