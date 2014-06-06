var HEAVENLY_CHIPS = 0;
var TOTAL_COOKIES = 1;
var SAVE_EXPORT = 2;
var PRIMARY_LOAD = 3; //Instructing "primary" games to load this game.

// Establish the background listener. This method will receive all messages sent from the page (save, load, reset).
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
		console.log('BackgroundThread request received: '+ request.action, request);
		if (request.action == "save") {
			Save_Action(sendResponse, request);
			return true;			
		} else if (request.action == 'load') {
			//Load whatever is saved to Google storage.
			Load_Action(sendResponse);
			return true;
		} else if (request.action == 'reset') {
			chrome.storage.sync.remove('ChromeCookiesScore', function (obj) {
				sendResponse({ response:true });
			});
		} else if (request.action == 'isprimary') {
			// Find out if this instance is marked as a primary one.
			IsPrimary_Action(sendResponse);
			return true;
		} else if (request.action == 'setprimary') {
			//If we are setting primary, find out what was last broadcast as the primary score. Set this value as if we saved it.
			//This means that only scores saved AFTER this will be loaded by us.
			SetPrimary_Action(sendResponse);
			return true;
		} else if (request.action == 'removeprimary') {
			chrome.storage.local.set({'ChromeCookiesIsPrimary': [false, ''] });
			sendResponse({ response:true });
		} else {
			sendResponse({ response:false });
		}
    }
);

//
// ACTIONS - Primarily used to keep message response code readable.
//

function Save_Action(sendResponse, request) {
	//Get the current sync data.
	chrome.storage.sync.get('ChromeCookiesScore', function (result) {
		if (IsEmptyResponse(result)) {
			savedHeavenly = 0;
			savedCookies = -1; //No score saved, any valid score should overwrite this.
			primaryLoad = [0, '']; //0 timestamp, empty contents.
		} else {
			savedHeavenly = result.ChromeCookiesScore[HEAVENLY_CHIPS];
			savedCookies = result.ChromeCookiesScore[TOTAL_COOKIES];
			primaryLoad = result.ChromeCookiesScore[PRIMARY_LOAD];
		}
		
		
		// Does the saved score have more heavenly chips than us? If so, that one is better.
		if (savedHeavenly < request.heavenlyCookies) {
			SaveNewScore(request);
			console.log('BackgroundThread: Game saved, heavenly chip count is higher.');
		} else if (savedHeavenly == request.heavenlyCookies) {
			//If the heavenly count matches, decide based on cookies.
			if (savedCookies < request.cookies) {
				SaveNewScore(request);
				console.log('BackgroundThread: Game saved, cookie count is higher.');
			} 
		} else {//Else, we don't save anything.
			console.log('BackgroundThread: Game not saved to Google, previous game has a better score');
		}
		sendResponse({ response:true });
	});
}

function Load_Action(sendResponse) {
	chrome.storage.sync.get('ChromeCookiesScore', function (obj) {
		if(IsEmptyResponse(obj)){
			sendResponse({ valid:false });
		} else {
			sendResponse({ valid:true, save:obj.ChromeCookiesScore[SAVE_EXPORT] });
		}
	});
}

function IsPrimary_Action(sendResponse) {
	chrome.storage.local.get('ChromeCookiesIsPrimary', function(result) {
		if (IsEmptyResponse(result)) { //Nothing saved yet. Store false as a default.
			isPrimary = false
			chrome.storage.local.set({'ChromeCookiesIsPrimary': [false, ''] });
		} else {
			isPrimary = result.ChromeCookiesIsPrimary[0];
		}
		sendResponse({ valid:true, primary:isPrimary });
	});
}

function SetPrimary_Action(sendResponse) {
	chrome.storage.sync.get('ChromeCookiesScore', function (result) {
		if (IsEmptyResponse(result)) {
			primaryLoad = [0, '']; //0 timestamp, empty contents.
		} else {
			primaryLoad = result.ChromeCookiesScore[PRIMARY_LOAD];
		}
		chrome.storage.local.set({'ChromeCookiesIsPrimary': [true, primaryLoad] });
		sendResponse({ response:true, latest:primaryLoad });
	});
}

//
// HELPERS
//
function SaveNewScore(request) {
	//Save new score
	chrome.storage.sync.set({'ChromeCookiesScore': [request.heavenlyCookies, request.cookies, request.save] });
}

function IsEmptyResponse(input) {
	return Object.getOwnPropertyNames(input).length === 0;
}