chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
		console.log(request);
		if (request.action == "save") {
			//Get the current sync data.
			chrome.storage.sync.get('ChromeCookiesScore', function (result) {
				if (IsEmptyResponse(result)) {
					savedHeavenly = 0;
					savedCookies = -1; //No score saved, any valid score should overwrite this.
				} else {
					savedHeavenly = result.ChromeCookiesScore[0];
					savedCookies = result.ChromeCookiesScore[1];
				}
				
				// Does the saved score have more heavenly chips than us? If so, that one is better.
				if (savedHeavenly < request.heavenlyCookies) {
					SaveNewScore(request);
				} else if (savedHeavenly == request.heavenlyCookies) {
					//If the heavenly count matches, decide based on cookies.
					if (savedCookies < request.cookies) {
						SaveNewScore(request);
					} 
				} //Else, we don't save anything.
					
				sendResponse({ response:true });
			});
			return true;			
		} else if (request.action == 'load') {
			chrome.storage.sync.get('ChromeCookiesScore', function (obj) {
				if(IsEmptyResponse(obj)){
					sendResponse({ valid:false });
				} else {
					sendResponse({ valid:true, save:obj.ChromeCookiesScore[2] });
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

function SaveNewScore(request) {
	//Save new score
	chrome.storage.sync.set({'ChromeCookiesScore': [request.heavenlyCookies, request.cookies, request.save] });
}

function IsEmptyResponse(input) {
	return Object.getOwnPropertyNames(input).length === 0;
}