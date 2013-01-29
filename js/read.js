var Reader = {};

(function(){
	var m = Reader;

	m.read = function(url){
		var notifyMap = NotifyMap.get();
		for(var i in notifyMap){
			var mode = notifyMap[i].mode;
			if(mode==3 || mode==5){
				for(var j in notifyMap[i].url){
					if(Core.matchUrl(notifyMap[i].url[j], url)){
						console.log("read: "+url);
						if(mode==3) storeGuid(notifyMap[i].nUrl);
						if(mode==5) storeHash(url);
					}
				}
			}
		}
	}
	function storeHash(url){
		console.log("Storing hash: "+url);
		var ajax = new XMLHttpRequest();
		ajax.open("GET", url, false);
		ajax.send();
		var content = ajax.responseText;
		var hash = md5(content);
		writeToOld(url, hash);
	}
	function storeGuid(nUrl){
		console.log("Storing Guid");
		var ajax = new XMLHttpRequest();
		ajax.open("GET", nUrl, false);
		ajax.send();
		var rText = ajax.responseText;
		rText = rText.replace(/\n/g, "");
		rText = rText.replace(/\t/g, "");
		rText = rText.replace(/\r/g, "");
		var matches = rText.match(/<item(.*?)<\/item>/ig);
		var guid;
		if(!matches || matches.length==0){
			matches = rText.match(/<entry(.*?)<\/entry>/ig);
			var result = matches[0].match(/<id.*>(.*?)<\/id>/);
			if(result)
				guid = RegExp.$1;
		}else{
			var result = matches[0].match(/<guid.*>(.*?)<\/guid>/);
			if(!result || result.length==0){
				result = matches[0].match(/<title.*>(.*)<\/title>/);
			}
			if(result)
				guid = RegExp.$1;
		}
		console.log(guid);
		if(guid)
			writeToOld(nUrl, guid);
	}
	function writeToOld(index, content){
		var old;
		if(localStorage["oldContents"]){
			old = JSON.parse(localStorage["oldContents"]);
		}else{
			console.log("OldContents does not exist. Creating new array. ");
			old = {};
		}
		old[index] = content;
		localStorage["oldContents"] = JSON.stringify(old);
		console.log("oldContents:", old);
	}
})();
