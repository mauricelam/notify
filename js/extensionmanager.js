/**** Start register functions ****/
function registerExternalRequest(request, id){
	console.log("Try Registering");
	if(!extensionRegistered(id)){
		if(request.name && request.url){
			registerItem(request.name, request.url, id);
			console.log("registered");
		}
	}
}
function extensionRegistered(id){
	var notifyMap = NotifyMap.get();
	console.log(notifyMap);
	for(var i in notifyMap){
		if(notifyMap[i].mode==1){
			if(notifyMap[i].extensionId==id){
				console.log("extension already registered");
				return true;
			}
		}
	}
	return false;
}
function registerItem(name, url, extensionId){
	var item = {"name": name, "url": url, "mode": 1, "extensionId": extensionId};
	NotifyMap.addItem(item);
}
/**** End register functions ****/
