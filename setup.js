console.log('Setup.js init');

setTimeout(function() {
	var s = document.createElement('script');
	//console.log(chrome.storage.sync);
	s.src = chrome.extension.getURL('content.js');
	s.onload = function() {
		this.parentNode.removeChild(this);
	};
	(document.head||document.documentElement).appendChild(s);
	
	console.log('Content script injected.');
}, 1000);