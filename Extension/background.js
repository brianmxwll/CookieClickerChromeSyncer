var TIMESTAMP = 0;
var SAVE_STATE = 1;
var EMPTY_SAVE = [0, ''];

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
				sendResponse({});
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
			SetLocalStorage(false, EMPTY_SAVE[TIMESTAMP], EMPTY_SAVE[SAVE_STATE]);
			sendResponse({});
		} else if (request.action == 'sendtoprimary') {
			SendPrimary_Action(sendResponse, request);
			return true;
		} else {
			sendResponse({});
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
			primaryLoad = EMPTY_SAVE;
		} else {
			savedHeavenly = result.ChromeCookiesScore.heavenlyChips;
			savedCookies = result.ChromeCookiesScore.totalCookies;
			primaryLoad = result.ChromeCookiesScore.primaryLoad;
		}
		
		//We have the server score, are we primary AND instructed to load a new game? If so, load it.
		if (localStorage['ChromeCookiesIsPrimary'] == 'true') {
			//We are primary, do we need to load the game?
			if (primaryLoad[TIMESTAMP] > localStorage['ChromeCookiesTimestamp']) { //Compare the timestamps. If there is a newer game to load, do so.
				console.log('BackgroundThread: Game instructed to load from sync. Loading.');
				//Timestamp on server is newer, we should load that one.
				var newSave = primaryLoad[SAVE_STATE];
				
				//Before we send the response though, save our local setting to note that we already loaded this one.
				SetLocalStorage(null, primaryLoad[TIMESTAMP], primaryLoad[SAVE_STATE]);
				
				sendResponse({ loadsave:newSave });
				
				//We don't want to run anything below this. Halt!
				return;
			}
		}

		//Fallthrough. If we get here, we do not need to load a game at this time.
		
		//Build the potential new save.
		var thisSave = CcsSave(request.heavenlyCookies, request.cookies, request.save, primaryLoad);
	
		// Does the saved score have more heavenly chips than us? If so, that one is better.
		if (savedHeavenly < request.heavenlyCookies) {
			SaveNewScore(thisSave);
			console.log('BackgroundThread: Game saved, heavenly chip count is higher.');
		} else if (savedHeavenly == request.heavenlyCookies) {
			//If the heavenly count matches, decide based on cookies.
			if (savedCookies < request.cookies) {
				SaveNewScore(thisSave);
				console.log('BackgroundThread: Game saved, cookie count is higher.');
			} 
		} else {//Else, we don't save anything.
			console.log('BackgroundThread: Game not saved to Google, previous game has a better score');
		}
		sendResponse({ loadsave:'nope' });
	});
}

function Load_Action(sendResponse) {
	chrome.storage.sync.get('ChromeCookiesScore', function (obj) {
		if(IsEmptyResponse(obj)){
			sendResponse({ valid:false });
		} else {
			sendResponse({ valid:true, save:obj.ChromeCookiesScore.saveExport });
		}
	});
}

function IsPrimary_Action(sendResponse) {
	if (localStorage['ChromeCookiesIsPrimary'] == 'true') {
		sendResponse({ primary:true });
	} else {
		//Save blank
		SetLocalStorage(false, EMPTY_SAVE[TIMESTAMP], EMPTY_SAVE[SAVE_STATE]);
		sendResponse({ primary:false });
	}
}

function SetPrimary_Action(sendResponse) {
	chrome.storage.sync.get('ChromeCookiesScore', function (result) {
		if (IsEmptyResponse(result)) {
			primaryLoad = EMPTY_SAVE;
		} else {
			primaryLoad = result.ChromeCookiesScore.primaryLoad;
		}
		
		//We must save these in localStorage (not chrome.storage) to keep persistence. chrome.storage.local doesn't seem to last on refresh.
		SetLocalStorage(true, primaryLoad[TIMESTAMP], primaryLoad[SAVE_STATE]);

		sendResponse({ latest:primaryLoad });
	});
}

function SendPrimary_Action(sendResponse, request) {
	//No matter what the current saved game is, this one becomes the primary. Make it so!
	var thisSave = CcsSave(request.heavenlyCookies, request.cookies, request.save, request.primaryLoad);
	SaveNewScore(thisSave);
	console.log('BackgroundThread: Game saved as primary.', thisSave);
	
	if (localStorage['ChromeCookiesIsPrimary'] == 'true') { //Only record if we are primary as well. Don't want to load this game again.
		SetLocalStorage(null, request.primaryLoad[TIMESTAMP], request.primaryLoad[SAVE_STATE]);
		console.log('BackgroundThread: Local primary updated.');
	}

	sendResponse({});
}

//
// HELPERS
//
function CcsSave(chips, cookies, svExport, priLoad) {
	var save =
	{
		heavenlyChips: chips,
		totalCookies: cookies,
		saveExport: svExport,
		primaryLoad: priLoad
	};
	return save;
}

function SetLocalStorage(isPrimary, timestamp, lastLoad) {
	if (isPrimary != null) {
		localStorage['ChromeCookiesIsPrimary'] = isPrimary;
	}
	if (timestamp != null) {
		localStorage['ChromeCookiesTimestamp'] = timestamp;
	}
	if (lastLoad != null) {
		localStorage['ChromeCookiesLastLoad'] = lastLoad;
	}
}

function SaveNewScore(save) {
	//Save new score
	chrome.storage.sync.set({'ChromeCookiesScore': save });
}

function IsEmptyResponse(input) {
	return Object.getOwnPropertyNames(input).length === 0;
}