// Get the ID of the ChromeCookies extension. Need it for later.
var scriptTag = document.getElementById('chromeCookiesScript');
var editorExtensionId = scriptTag.getAttribute('extId');

var fetchingSave = false; //If true, customSave won't fire.

var lastSave = 0;
var isPrimary = false;

// Mostly self explanatory. Go to Google sync storage and retrieve the latest game.
function LoadFromGoogle() {
	var params = {
		action: 'load'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			if (response.valid) {
				Game.LoadSave(response.save);
				UserAlert('Game loaded from Google sync');
			} else {
				UserAlert('No game saved to Google sync');
			}
	});
}

// Go to Google sync storage and remove all previously saved items. 
function ResetGoogle() {
	var params = {
		action: 'reset'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			UserAlert('Game score on Google sync has been reset/deleted');
	});
}

// Waits until the game has defined the UpdateMenu function then runs MoveUpdateFunc().
function UpdateMenu() {
	if (Game.UpdateMenu == undefined) {
		setTimeout(UpdateMenu, 500);
	} else {
		MoveUpdateFunc();
	}
}

// Update the game's UpdateMenu method. Essentially adds a hook to the game when the prefs menu is displayed.
// When the game updates the prefs menu, we run the original function and then add our custom buttons on top of the menu.
function MoveUpdateFunc() {
	Game.OldUpdateMenu = Game.UpdateMenu;

	Game.UpdateMenu = function() {
		//Call the real one.
		Game.OldUpdateMenu(); 
		//If we are updating prefs, add our buttons.
		if (Game.onMenu == 'prefs') {
			AddChromeCookiesButtons();
		}
	};
}

// Adds various ChromeCookies buttons to the game menu.
function AddChromeCookiesButtons() {
	var menu = document.getElementById('menu');
	if (menu != null) {
		var parent = menu.childNodes[2];
		if (parent != null) {
			//Find the "Settings" div, we will be inserting before that one.
			for (var i = 0; i < parent.childNodes.length; i++) {
				if (parent.childNodes[i].innerHTML == 'Settings') {
					settingsDiv = parent.childNodes[i];
					break;
				}
			}
			
			//Create the title
			var titleDiv = document.createElement('div');
			titleDiv.innerHTML = 'Cookie Clicker, Chrome Syncer';
			titleDiv.className = 'title';
			
			//Create the Load From Google button
			var loadGoogleDiv = document.createElement('div');
			loadGoogleDiv.innerHTML = '<a class="option" onclick="LoadFromGoogle();">Load From Google</a><label>Load the game from Google online storage.</label>';
			loadGoogleDiv.className = 'listing';
			
			//Create the Reset Google Score
			var resetGoogleDiv = document.createElement('div');
			resetGoogleDiv.innerHTML = '<a class="option" onclick="ResetGoogle();">Reset Google Score</a><label>Reset the score saved to Google online storage.</label>';
			resetGoogleDiv.className = 'listing';
			
			//Set this browser as primary
			var makePrimaryDiv = document.createElement('div');
			if (isPrimary) {
				makePrimaryDiv.innerHTML = '<a class="option" onclick="RemovePrimary();">Remove Primary</a><label>This currently IS the primary browser.</label>';
			} else {
				makePrimaryDiv.innerHTML = '<a class="option" onclick="SetPrimary();">Set Primary</a><label>This currently is NOT the primary browser.</label>';
			}
			makePrimaryDiv.className = 'listing';
			
			// Create the "Send this game to primary" button
			var sendToPrimaryDiv = document.createElement('div');
			sendToPrimaryDiv.innerHTML = '<a class="option" onclick="SendToPrimary();">Send Game to Primary</a><label>Send this game to all browsers marked "primary" (see button above).</label>';
			sendToPrimaryDiv.className = 'listing';
			
			//Add the buttons.
			parent.insertBefore(titleDiv, settingsDiv);
			parent.insertBefore(loadGoogleDiv, settingsDiv);
			parent.insertBefore(resetGoogleDiv, settingsDiv);
			parent.insertBefore(makePrimaryDiv, settingsDiv);
			parent.insertBefore(sendToPrimaryDiv, settingsDiv);
			
			var saveListing = parent.childNodes[1];
			if (saveListing != null) {
				//Fix the save text.
				saveListing.getElementsByTagName('label')[0].innerHTML = 'Save manually (the game autosaves every 60 seconds). This also saves to google storage (as does autosave).';	
			} else { console.log('ChromeCookies: Cant find save listing.'); };
		} else { console.log('ChromeCookies: Cant find parent.'); }
	} else { console.log('ChromeCookies: Cant find menu.'); }
}

// Wait until the game has initialized  the customSave array which stores methods to be run after the vanilla save.
function CustomSave() {
	if (Game.customSave == undefined) {
		setTimeout(CustomSave, 500);
	} else {
		SetCustomSave();
	}
}

// Tell the game to run our save method after the normal one executes.
function SetCustomSave() {
	Game.customSave.push(function() {
		//Make sure we didn't cause this execution.
		if (!fetchingSave) {
			lastSave = Date.now();

			var params = {
				action: 'save',
				heavenlyCookies: Game.prestige['Heavenly chips'],
				cookies: Game.cookiesEarned + Game.cookiesReset,
				save: GetSave()
			};

			chrome.runtime.sendMessage(editorExtensionId, params,
				function(response) {
					if (response.loadsave != 'nope') {
						Game.LoadSave(response.loadsave);
						UserAlert('Game loaded from google for this primary browser');
					}
			});
		}
	});
}

function CheckPrimary() {
	var params = {
		action: 'isprimary'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			isPrimary = response.primary;
	});
}

function SetPrimary() {
	isPrimary = true;
	var params = {
		action: 'setprimary'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
		//Force the menu to redraw.
		Game.UpdateMenu();
		
		UserAlert('Set as primary');
	});
}

function RemovePrimary() {
	isPrimary = false;
	var params = {
		action: 'removeprimary'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
		//Force the menu to redraw.
		Game.UpdateMenu();
		
		UserAlert('Removed as primary');
	});
}

function SendToPrimary() {
	var exportSave = GetSave();
	
	var pl = [Date.now(), exportSave];
	
	var params = {
		action: 'sendtoprimary',
		heavenlyCookies: Game.prestige['Heavenly chips'],
		cookies: Game.cookiesEarned + Game.cookiesReset,
		save: exportSave,
		primaryLoad: pl
	};
	
	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
		//Force the menu to redraw.
		Game.UpdateMenu();
		
		UserAlert('Game sent to primary browsers');
	});
}

function UserAlert(text) {
	Game.Notify(text,'','',2);
}

function GetSave() {
	//Set a var to note that we are starting a save. When the save method trips our custom save method (again), this var 
	//prevents it from saving the game to google a second time.
	fetchingSave = true;
	var save = Game.WriteSave(1);
	fetchingSave = false;
	return save;
}

// Run on start.
CheckPrimary();
UpdateMenu();
CustomSave();



