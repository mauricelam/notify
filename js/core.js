var Core = {};

(function(){
	var m = Core;

	m.getUrlItem = function(url){
		return m.getFullItem(url).item;
	}

	m.getFullItem = function(url){
		var notifyMap = NotifyMap.get();
		for(var i in notifyMap){
			if(Boolean(notifyMap[i].enabled)){
				for(var j in notifyMap[i].url){
					if(m.matchUrl(notifyMap[i].url[j], url)){
						return {id: i, item: notifyMap[i]};
					}
				}
			}
		}
		return false;
	}

	m.getNotifyNumber = function(url, callback){
		var item = m.getUrlItem(url);
		if(item!==false && item!=undefined){
			getNotifyNumberFromItem(url, item, callback);
		}else{
			callback.apply(this, [{"notify": 0, "mode": false, "status": 0}]);
		}
	}

	m.matchUrl = function(reg, url){
		var regex = convert2RegExp(reg);
		var result = url.match(regex);
		if(!result){
			return false;
		}
		return result.length>0;
	}

	function getNotifyNumberFromItem(url, item, callback){
		var modeItem = ModeManager.getMode(item.mode);
		modeItem.exec(url, item, callback);
	}
})();
