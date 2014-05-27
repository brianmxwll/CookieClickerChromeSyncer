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
	//alert('saved');
});

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


