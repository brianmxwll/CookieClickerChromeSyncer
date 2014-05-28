Game.OldUpdateMenu = Game.UpdateMenu;

Game.UpdateMenu = function() {
	//Call the real one.
	Game.OldUpdateMenu(); 
	//If we are updating prefs, add the save.
	if (Game.onMenu == 'prefs') {
		cookieSaver.addLoadButton();
	}
};

Game.customSave.push(function() {
	
	var editorExtensionId = "kfpefnknagfhjhigfcalmagikllodadh";

	// Make a simple request:
	chrome.runtime.sendMessage(editorExtensionId, {openUrlInEditor: 'alertme'},
	  function(response) {
		
	  });
	
	
	//Get the current sync data.
	var cookieCount = "";
    chrome.storage.sync.get('ChromeCookiesScore', function (result) {
        score = result.ChromeCookiesScore;
        alert(score + "score");
    });
	
	//Is the score lower than ours? If so, push our new score to sync.
	if (score < Game.cookies) {
		chrome.storage.sync.set({'ChromeCookiesScore': Game.cookies });
		chrome.storage.sync.set({'ChromeCookiesValue': Game.WriteSave(1) });
	}
});

function load() {
    
} 

var cookieSaver = {
  addLoadButton: function() {
	var menu = document.getElementById('menu');
	if (menu != null) {
		var parent = menu.childNodes[2];
		if (parent != null) {
			var saveListing = parent.childNodes[1];
			if (saveListing != null) {
				var div = document.createElement('div');
				div.innerHTML = '<a class="option" onclick="Game.WriteSave();">Load From Google</a><label>Load the game from Google online storage.</label>';
				div.className = 'listing';
				
				parent.insertBefore(div, saveListing);
			} else { alert('Cant find save listing.'); };
		} else { alert('Cant find parent.'); }
	} else { alert('Cant find menu.'); }
  }
};


