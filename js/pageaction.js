var PageAction = {};
var alwaysShowIcon = true;

(function(){
	var m = PageAction;

	m.showActive = function(tabId){
		setIcon(tabId, "images/page_active.png");
		chrome.pageAction.setPopup({tabId: tabId, popup: "popup.html#active=true"});
		chrome.pageAction.setTitle({tabId: tabId, title: "Edit no.tify item"});
		showIcon(tabId);
	}
	m.showInactive = function(tabId){
		setIcon(tabId, "images/page_inactive.png");
		chrome.pageAction.setPopup({tabId: tabId, popup: "popup.html#active=false"});
		chrome.pageAction.setTitle({tabId: tabId, title: "Add to no.tify"});
		showIcon(tabId);
	}
	m.refresh = function(){
		chrome.windows.getAll({populate: true}, function(windows){
			for(var i in windows){
				for(var j in windows[i].tabs){
					if(!windows[i].tabs) break;
					var tab = windows[i].tabs[j];
					var item = Core.getUrlItem(tab.url);
					if(item){
						m.showActive(tab.id);
					}else if(alwaysShowIcon){
						m.showInactive(tab.id);
					}
				}
			}
		});
	}
	function setIcon(tabId, path){
		chrome.pageAction.setIcon({tabId: tabId, path: path});
	}
	function showIcon(tabId){
		if(!PrefManager.getOption("hidePageAction")){
			//supplying tab ID is recommended because it avoids time gap bugs
			if(tabId===0 || tabId){
				chrome.pageAction.show(tabId);
			}else{
				chrome.tabs.getSelected(null, function(tab){
					chrome.pageAction.show(tab.id);
				});
			}
		}
	}
})();
