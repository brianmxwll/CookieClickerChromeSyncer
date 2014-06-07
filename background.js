var TIMESTAMP = 0;
var SAVE_STATE = 1;

//Static values
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
			localStorage['ChromeCookiesIsPrimary'] = false;
			localStorage['ChromeCookiesTimeStamp'] = EMPTY_SAVE[TIMESTAMP];
			localStorage['ChromeCookiesLastLoad'] = EMPTY_SAVE[SAVE_STATE];
			sendResponse({ response:true });
		} else if (request.action == 'sendtoprimary') {
			SendPrimary_Action(sendResponse, request);
			return true;
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
			primaryLoad = EMPTY_SAVE;
		} else {
			savedHeavenly = result.ChromeCookiesScore.heavenlyChips;
			savedCookies = result.ChromeCookiesScore.totalCookies;
			primaryLoad = result.ChromeCookiesScore.primaryLoad;
		}
		
		//We have the server score, are we primary AND instructed to load a new game? If so, load it.
		if (localStorage['ChromeCookiesIsPrimary'] == 'true') { //Only record if we are primary as well. Don't want to load this game again.
			//We are primary, do we need to load the game?
			if (primaryLoad[TIMESTAMP] > localStorage['ChromeCookiesTimeStamp']) {
				console.log('BackgroundThread: Game instructed to load from sync. Loading.');
				//Timestamp on server is newer, we should load that one.
				var newSave = primaryLoad[SAVE_STATE];
				
				//Before we send the response though, save our local setting to note that we already loaded this one.
				localStorage['ChromeCookiesTimeStamp'] = primaryLoad[TIMESTAMP];
				localStorage['ChromeCookiesLastLoad'] = primaryLoad[SAVE_STATE];
				
				sendResponse({ response:true, loadsave:newSave });
				
				//We don't want to run anything below this. Halt!
				return;
			}
		}
		
		chrome.storage.local.get('ChromeCookiesIsPrimary', function(localResult) {
			if (!IsEmptyResponse(localResult)) {
				if (localResult.ChromeCookiesIsPrimary.isPrimary) { //Nothing saved yet. Store false as a default.
					
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
			sendResponse({ response:true, loadsave:'nope' });
		});
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
	chrome.storage.local.get('ChromeCookiesIsPrimary', function(result) {
		if (IsEmptyResponse(result)) { //Nothing saved yet. Store false as a default.
			isPrimary = false
			var save = CcipSave(false, EMPTY_SAVE);
			chrome.storage.local.set({'ChromeCookiesIsPrimary': save });
		} else {
			isPrimary = result.ChromeCookiesIsPrimary.isPrimary;
		}
		sendResponse({ valid:true, primary:isPrimary });
	});
}

function SetPrimary_Action(sendResponse) {
	chrome.storage.sync.get('ChromeCookiesScore', function (result) {
		if (IsEmptyResponse(result)) {
			primaryLoad = EMPTY_SAVE;
		} else {
			primaryLoad = result.ChromeCookiesScore.primaryLoad;
		}
		
		//We must save these in localStorage (not chrome.storage) to keep persistence. chrome.storage.local doesn't seem to last on refresh.
		localStorage['ChromeCookiesIsPrimary'] = true;
		localStorage['ChromeCookiesTimeStamp'] = primaryLoad[TIMESTAMP];
		localStorage['ChromeCookiesLastLoad'] = primaryLoad[SAVE_STATE];

		sendResponse({ response:true, latest:primaryLoad });
	});
}

function SendPrimary_Action(sendResponse, request) {
	//No matter what the current saved game is, this one becomes the primary. Make it so!
	var thisSave = CcsSave(request.heavenlyCookies, request.cookies, request.save, request.primaryLoad);
	SaveNewScore(thisSave);
	console.log('BackgroundThread: Game saved as primary.');
	
	if (localStorage['ChromeCookiesIsPrimary'] == 'true') { //Only record if we are primary as well. Don't want to load this game again.
		localStorage['ChromeCookiesTimeStamp'] = request.primaryLoad[TIMESTAMP];
		localStorage['ChromeCookiesLastLoad'] = request.primaryLoad[SAVE_STATE];
		console.log('BackgroundThread: Local primary updated.');
	}

	sendResponse({ response:true });
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

function CcipSave(primary, load) {
	//Load is an array, length of two. Slot 0 = timestamp, slot 1 = the saved game.
	var save = 
	{
		isPrimary: primary,
		primaryLoad: load
	};
}

function SaveNewScore(save) {
	//Save new score
	chrome.storage.sync.set({'ChromeCookiesScore': save });
}

function IsEmptyResponse(input) {
	return Object.getOwnPropertyNames(input).length === 0;
}