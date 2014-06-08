//After one second, inject our script onto the page. The one second may or may not be required, but gives the page some time to initialize.
setTimeout(function() {
	var s = document.createElement('script');
	s.id = 'chromeCookiesScript';
	s.setAttribute('extId', chrome.runtime.id);
	s.src = chrome.extension.getURL('content.js');
	s.onload = function() {
		this.parentNode.removeChild(this);
	};
	(document.head||document.documentElement).appendChild(s);
	console.log(chrome.runtime.id);
}, 1000);