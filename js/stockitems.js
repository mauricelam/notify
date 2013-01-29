(function(){
	var item_gmail = {"name":"Gmail","url":["*://mail.google.com*","*://www.gmail.com/"],"nUrl":"https://mail.google.com/mail/feed/atom/","rx":"<fullcount>(.*)</fullcount>","mode":4,"enabled":true};
	var item_google_reader = {"name":"Google Reader","url":["*://www.google.com/reader/*"],"mode":"4","nUrl":"http://www.google.com/reader/api/0/unread-count","rx":"reading-list</string><number name=\"count\">(\\d+)</number>","enabled":true};
	var item_hotmail = {"name":"Hotmail","url":["*://*mail.live.com*","*://www.hotmail.com*"],"mode":"4","nUrl":"http://mail.live.com/md/folder.aspx","rx":"<div class=\"PageTitle\"><span class=\"Bold\">.+ \\((\\d+)\\)<\\/span>","enabled":true};
	var item_ymail = {"name":"Yahoo Mail","url":["*://*mail.yahoo.com/*"],"mode":"4","nUrl":"http://wap.yahoo.com/w/ygo-mail","rx":"class=\"page-title\">.* \\((\\d+)\\)<\\/td>"};
	var item_aolmail = {"name":"AOL mail","url":["*://mail.aol.com*"],"mode":"4","rx":"<div class=\"sectionBar\"><span>Inbox\\((\\d+)\\)</span></div>","nUrl":"http://mail.aol.com/wap","enabled":true};

	var stockItems = [item_gmail, item_google_reader, item_hotmail, item_ymail, item_aolmail];
	$(function(){
		if(localStorage["nonfirst"] != "true"){
			for(var i in stockItems){
				NotifyMap.addItem(stockItems[i]);
			}
			var inextensions = Inextension.getItems();
			console.log(inextensions);
			for(var i in inextensions){
				NotifyMap.addItem(inextensions[i]);
			}
			localStorage["nonfirst"] = "true";
		}
	});
})();

function trace(msg){
	console.log(msg);
}
