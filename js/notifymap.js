var NotifyMap = {};

(function(){

    NotifyMap.setItemUrl = function(id, index, value){
        var notifyMap = NotifyMap.get();
        notifyMap[id]["url"][index] = value;
        NotifyMap.save(notifyMap);
    };
    
    NotifyMap.removeItemUrl = function(id, index){
        var notifyMap = NotifyMap.get();
        notifyMap[getSelectedId()].url.splice(index, 1);
        NotifyMap.save(notifyMap);
    };

    NotifyMap.get = function(){
        var map = localStorage["notifyMap"];
        if(!map) map = "[]";
        var notifyMap = JSON.parse(map);
        if(!notifyMap) notifyMap = [];
        return notifyMap;
    };

    NotifyMap.save = function(notifyMap){
        console.log("Saving options", notifyMap);
        localStorage["notifyMap"] = JSON.stringify(notifyMap);
    };

    /** removes invalid entries from notifyMap **/
    NotifyMap.removeTrash = function(){
        var notifyMap = NotifyMap.get();
        for(var i=0; i<notifyMap.length; i++){
            if(!notifyMap[i]){
                console.log("Removing trash");
                notifyMap.splice(i--, 1);
            }
        }
        NotifyMap.save(notifyMap);
    };

    NotifyMap.getItemAttr = function(id, attr){
        var notifyMap = NotifyMap.get();
        if(notifyMap[id][attr]!=undefined){
            return notifyMap[id][attr];
        }else{
            return "";
        }
    };

    NotifyMap.setItemAttr = function(id, attr, value){
        var notifyMap = NotifyMap.get();
        notifyMap[id][attr] = value;
        NotifyMap.save(notifyMap);
    };

    NotifyMap.swapItem = function(id, item){
        var notifyMap = NotifyMap.get();
        notifyMap[id] = item;
        NotifyMap.save(notifyMap);
    };

    NotifyMap.removeItem = function(id){
        var notifyMap = NotifyMap.get();
        notifyMap.splice(id, 1);
        NotifyMap.save(notifyMap);
        chrome.extension.sendMessage({action: "refreshPageAction"});
    };

    NotifyMap.addItem = function(item){
        var notifyMap = NotifyMap.get();
        if(!item.name){
            console.log("item is untitled");
            item.name = "untitled";
        }
        if(!item.url || item.url.length==0){
            console.log("ERROR: URL is undefined");
            return false;
        }
        if(!item.mode){
            console.log("ERROR: item mode is undefined");
            return false;
        }
        switch(item.mode){
            case 0:
                if(!item.nUrl) return false;
                break;
            case 1:
                if(!item.extensionId && item.extensionId!==0) return false
                break;
            case 2: 
                if(!item.nUrl){
                    console.log("ERROR: nUrl is undefined");
                    return false;
                }
                break;
            case 3: 
                if(!item.nUrl){
                    console.log("ERROR: nUrl is undefined");
                    return false;
                }
                break;
            case 4:
                if(!item.nUrl || !item.rx){
                    console.log("ERROR: nUrl is undefined");
                    return false;
                }
                break;
            case 5: 
                break;
        }
        for(var i in notifyMap){
            if(isItemEqual(item, notifyMap[i])){
                trace("item is already installed", "red");
                return false;
            }
        }
        item.enabled = true;
        var size = notifyMap.length;
        notifyMap[size] = item;
        NotifyMap.save(notifyMap);
        return size;
    };
    
    //Determine if two notify items are equal
    function isItemEqual(item1, item2){
        item1.url.sort();
        item2.url.sort();
        if(typeof item1 != "object" || typeof item2 != "object") return false;
        if(item1.mode != item2.mode) return false;
        if(item1.url.length != item2.url.length) return false;
        for(var i in item1.url){
            if(item1.url[i]!=item2.url[i])
                return false;
        }
        if(item1.nUrl != item2.nUrl) return false;
        if(item1.rx != item2.rx) return false;
        if(item1.extensionId != item2.extensionId) return false;
        return true;
    }
})();
