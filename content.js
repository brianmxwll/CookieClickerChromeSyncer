// The ID of the extension we want to talk to.
var editorExtensionId = "kfpefnknagfhjhigfcalmagikllodadh";

var lastSave = 0;

function LoadFromGoogle() {
	console.log('Load From Google!');
	var params = {
		action: 'load'
	};

	// Make a simple request:
	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			if (response.valid) {
				Game.LoadSave(response.save);
				console.log('Game loaded from Google.');
			} else {
				console.log('No game saved to Google storage.');
			}
	});
}

function ResetGoogle() {
	console.log('Reset from Google.');
	var params = {
		action: 'reset'
	};

	// Make a simple request:
	chrome.runtime.sendMessage(editorExtensionId, params,
		function(response) {
			console.log(response.response);
			console.log('Google save reset.');
	});
}

function AddLoadButton() {
	var menu = document.getElementById('menu');
	if (menu != null) {
		var parent = menu.childNodes[2];
		if (parent != null) {
			var saveListing = parent.childNodes[1];
			if (saveListing != null) {
				//Create the Load From Google button
				var loadGoogleDiv = document.createElement('div');
				loadGoogleDiv.innerHTML = '<a class="option" onclick="LoadFromGoogle();">Load From Google</a><label>Load the game from Google online storage.</label>';
				loadGoogleDiv.className = 'listing';
				
				//Create the Reset Google Score
				var resetGoogleDiv = document.createElement('div');
				resetGoogleDiv.innerHTML = '<a class="option" onclick="ResetGoogle();">Reset Google Score</a><label>Reset the score saved to Google online storage.</label>';
				resetGoogleDiv.className = 'listing';
				
				//Add the buttons.
				parent.insertBefore(loadGoogleDiv, saveListing);
				parent.insertBefore(resetGoogleDiv, saveListing);
				
				//Fix the save text.
				saveListing.getElementsByTagName('label')[0].innerHTML = 'Save manually (the game autosaves every 60 seconds). This also saves to google storage (as does autosave).';
				
			} else { alert('Cant find save listing.'); };
		} else { alert('Cant find parent.'); }
	} else { alert('Cant find menu.'); }
}

function MoveUpdateFunc() {
	Game.OldUpdateMenu = Game.UpdateMenu;

	Game.UpdateMenu = function() {
		//Call the real one.
		Game.OldUpdateMenu(); 
		//If we are updating prefs, add the save.
		if (Game.onMenu == 'prefs') {
			AddLoadButton();
		}
	};
}


function SetCustomSave() {
	Game.customSave.push(function() {
		console.log('Save function executing.');
		
		//If we have not saved in the last 5 seconds.
		if (Date.now() - lastSave > 5000) {
			console.log('Saving...');
			lastSave = Date.now();

			var params = {
				action: 'save',
				cookies: Game.cookies,
				save: Game.WriteSave(1)
			};

			// Make a simple request:
			chrome.runtime.sendMessage(editorExtensionId, params,
				function(response) {
					console.log("Game saved to Google!");
			});
		}
	});
}

function UpdateMenu() {
	if (Game.UpdateMenu == undefined) {
		setTimeout(UpdateMenu, 500);
	} else {
		MoveUpdateFunc();
	}
}

function CustomSave() {
	if (Game.customSave == undefined) {
		setTimeout(CustomSave, 500);
	} else {
		SetCustomSave();
	}
}


var waitThenRun = {
	UpdateMenu: function() {
		
	},
	
};

UpdateMenu();
CustomSave();



