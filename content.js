// The ID of the ChromeCookies extension.
var editorExtensionId = "kfpefnknagfhjhigfcalmagikllodadh";

var lastSave = 0;
var isPrimary = false;

// Mostly self explanatory. Go to Google sync storage and retrieve the latest game.
function LoadFromGoogle() {
	console.log('ChromeCookies: Loading from Google.');
	var params = {
		action: 'load'
	};

	// Make a simple request:
	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			if (response.valid) {
				Game.LoadSave(response.save);
				console.log('ChromeCookies: Game loaded from Google.');
				UserAlert('Game loaded from Google sync');
			} else {
				console.log('ChromeCookies: No game saved to Google storage.');
				UserAlert('No game saved to Google sync.');
			}
	});
}

// Go to Google sync storage and remove all previously saved items. 
function ResetGoogle() {
	console.log('ChromeCookies: Resetting Google storage save.');
	var params = {
		action: 'reset'
	};

	// Make a simple request:
	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			console.log('Google save reset.');
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
			titleDiv.innerHTML = 'ChromeCookies';
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
				//Was here
				
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
		//If we have not saved in the last 5 seconds.
		if (Date.now() - lastSave > 5000) {
			console.log('ChromeCookies: Save executing.');
			lastSave = Date.now();

			var params = {
				action: 'save',
				heavenlyCookies: Game.prestige['Heavenly chips'],
				cookies: Game.cookiesEarned + Game.cookiesReset,
				save: Game.WriteSave(1)
			};

			// Make a simple request:
			chrome.runtime.sendMessage(editorExtensionId, params,
				function(response) {
					console.log("ChromeCookies: Game saved to Google!");
			});
		} else {
			console.log('ChromeCookies: Save not executed, one has been executed within last 5 seconds.');
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
		//No response action required, insert here if needed.
	});
	
	//Force the menu to redraw.
	Game.UpdateMenu();
	
	UserAlert('Set as primary');
}

function RemovePrimary() {
	isPrimary = false;
	var params = {
		action: 'removeprimary'
	};

	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
		//No response action required, insert here if needed.
	});
	
	//Force the menu to redraw.
	Game.UpdateMenu();
	
	UserAlert('Removed as primary');
}

function SendToPrimary() {
	var exportSave = Game.WriteSave(1);
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

// Run on start.
CheckPrimary();
UpdateMenu();
CustomSave();



