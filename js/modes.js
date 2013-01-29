var ModeManager = {};

(function(){
	var m = ModeManager;
	var modes = [
		{name: ".notify", col3: "nUrl", exec: notifyOfficial},
		{name: "Extension", col3: "extensionId", exec: notifyExtension},
		{name: "Atom/RSS total", col3: "nUrl", exec: notifyRssFull},
		{name: "Atom/RSS unread", col3: "nUrl", exec: notifyRssUnread},
		{name: "RegExp", col3: "nUrl", col4: "rx", exec: notifyRegexp},
		{name: "Content changed", exec: notifyChanged}
	];

	m.getModes = function(){
		return modes;
	}

	m.getMode = function(mode){
		return modes[mode];
	}

	/*** built-in notify functions (semi-private) ***/
	function notifyRssFull(url, item, callback){
		console.log("Mode: RSS Total");
		var ajax = new XMLHttpRequest();
		ajax.open("GET", item.nUrl, true);
		ajax.onreadystatechange = function(){
		if(ajax.readyState==4){
			if(ajax.status!=200){
				callback.apply(this, [{"notify": 0, "mode": 2, "status": 1}]);
				return;
			}
			var rText = ajax.responseText;
			rText = rText.replace(/\n/g, "");
			var matches = rText.match(/<item(.*?)<\/item>/ig);
			if(matches.length==0){
				matches = rText.match(/<entry(.*?)<\/entry>/ig);
			}
			callback.apply(this, [{"notify": matches.length, "mode": 2, "status": 4}]);
		}
		}
		ajax.send();
	}
	function notifyExtension(url, item, callback){
		console.log("Mode: extension");
		var internal = Inextension.getNotify(item.extensionId);
		if(internal===false){
			chrome.extension.sendMessage(item.extensionId, {"action": "getNotify"}, function(response){
				console.log("Response received");
				if(typeof response.notify == "object"){
					callback.apply(this, [response.notify]);
				}else{
					callback.apply(this, [{"notify": response.notify, "mode": 1, "status": 4}]);
				}
			});
		}else{
			console.log("Using inextension");
			if(typeof internal == "object"){
				callback.apply(this, [internal]);
			}else{
				callback.apply(this, [{"notify": internal, "mode": 1, "status": 4}]);
			}
		}
	}
	function notifyRegexp(url, item, callback){
		console.log("Mode: RegExp");
		var ajax = new XMLHttpRequest();
		ajax.open("GET", item.nUrl, true);
		ajax.onreadystatechange = function(){
		if(ajax.readyState==4){
			if(ajax.status!=200){
			callback.apply(this, [{"notify": 0, "mode": 4, "status": 1}]);
			return;
			}
			var rText = ajax.responseText;
			rText = rText.replace(/\n/g, "");
			rText = rText.replace(/\r/g, "");
			rText = rText.replace(/\t/g, "");
			var rx = new RegExp(item.rx, "i");
			var result = rText.match(rx);
			if(result && result.length>0){
				var num = parseInt(RegExp.$1);
				if(isNaN(num))
					callback.apply(this, [{"notify": 0, "mode": 4, "status": 2}]);
				else
					callback.apply(this, [{"notify": num, "mode": 4, "status": 4}]);
			}else{
				callback.apply(this, [{"notify": 0, "mode": 4, "status": 2}]);
			}
		}
		}
		ajax.send();
	}
	function notifyOfficial(url, item, callback){
		console.log("Mode: .notify");
		var ajax = new XMLHttpRequest();
		ajax.open("GET", item.nUrl, true);
		ajax.onreadystatechange = function(){
			if(ajax.readyState==4){
				if(ajax.status!=200){
					callback.apply(this, [{"notify": 0, "mode": 0, "status": 1}]);
					return;
				}
				var rText = ajax.responseText;
				var responseObj;
				try{
					responseObj = JSON.parse(rText);
				}catch(e){
					callback.apply(this, [{"notify": 0, "mode": 0, "status": 2}]);
					return;
				}
				var result = Number(responseObj.notify);
				var name = responseObj.name;
				if(!name) name = "";
				callback.apply(this, [{"notify": result, "mode": 0, "status": 4}, name]);
			}
		}
		ajax.send();
	}
	function notifyRssUnread(url, item, callback){
		console.log("Mode: RSS Unread");
		var oldContent = getOldContent(item.nUrl);
		var ajax = new XMLHttpRequest();
		ajax.open("GET", item.nUrl, true);
		ajax.onreadystatechange = function(){
			if(ajax.readyState==4){
				if(ajax.status!=200){
					callback.apply(this, [{"notify": 0, "mode": 3, "status": 1}]);
					return;
				}
				var rText = ajax.responseText;
				rText = rText.replace(/\n/g, "");
				rText = rText.replace(/\t/g, "");
				rText = rText.replace(/\r/g, "");
				var atom = false;
				var matches = rText.match(/<item(.*?)<\/item>/ig);
				if(!matches || matches.length==0){
					matches = rText.match(/<entry(.*?)<\/entry>/ig);
					atom = true;
				}
				if(!matches || matches.length==0){
					callback.apply(this, [{"notify": 0, "mode": 3, "status": 2}]);
					return;
				}
				var counter = 0;
				var result;
				for(var i in matches){
					if(atom){
						result = matches[i].match(/<id.*>(.*?)<\/id>/);
					}else{
						result = matches[i].match(/<guid.*>(.*?)<\/guid>/);
						if(!result || result.length==0){
							result = matches[i].match(/<title.*>(.*)<\/title>/);
						}
					}
					var guid = RegExp.$1;
					if(oldContent && oldContent!==guid){
						counter++;
					}else{
						break;
					}
				}
				callback.apply(this, [{"notify": counter, "mode": 3, "status": 4}]);
			}
		}
		ajax.send();
	}
	function notifyChanged(url, item, callback){
		console.log("Mode: Content Changed");
		var oldContent = getOldContent(url);
		//A bit quirky. A new status code may be better
		if(!oldContent) callback.apply(this, [{"notify": 1, "mode": 5, "status": 4}]);
		var ajax = new XMLHttpRequest();
		ajax.open("GET", url, true);
		ajax.onreadystatechange = function(){
		if(ajax.readyState==4 && ajax.status==200){
			if(ajax.status!=200){
				callback.apply(this, [{"notify": 0, "mode": 5, "status": 1}]);
				return;
			}
			var rText = ajax.responseText;
			var hash = md5(rText);
			var result = (hash==oldContent) ? 0 : 1;
			callback.apply(this, [{"notify": result, "mode": 5, "status": 4}]);
		}
		}
		ajax.send();
	}
	/*** end built in notify functions ***/

	function getOldContent(url){
		var con = localStorage["oldContents"];
		if(!con) return false;
		var content = JSON.parse(con);
		if(!content) return false;
		return content[url];
	}
})();
