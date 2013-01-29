/*global $ chrome console */

var autoDiscovery = true;

var pendingInstall = false;

$(function(){
    PageAction.refresh();
});

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab){
    var item = Core.getUrlItem(tab.url);
    if(item){
        PageAction.showActive(id);
    }else{
        PageAction.showInactive(id);
    }
});

chrome.extension.onMessageExternal.addListener(
    function(message, sender, sendResponse){
        console.log('External message received: ' + message.action);
        switch(message.action){
            case 'register':
                registerExternalRequest(message, sender.id);
                break;
            case 'getNotify':
                Core.getNotifyNumber(message.url, function(obj){
                    console.log('Reply to ' + message.url + ':', obj);
                    sendResponse(obj);
                });
                return true;
            case 'ping':
                sendResponse('pong');
                break;
        }
    }
);

chrome.extension.onMessage.addListener(function(message, sender, sendResponse){
    console.log('Internal message received: ' + message.action);
    switch(message.action){
        case 'read':
            Reader.read(message.readUrl);
            break;
        case 'register':
            var returnUrl = registerRequest(message.item);
            sendResponse(returnUrl);
            break;
        case 'getNotify':
            Core.getNotifyNumber(message.url, function(obj){
                console.log('Reply:', obj);
                sendResponse(obj);
            });
            break;
        case 'optionsLoaded':
            if(pendingInstall){
                sendResponse({'action': 'requestAuth', 'item': pendingInstall});
            }
            break;
        case 'authRequested':
            pendingInstall = false;
            break;
        case 'getInstallItems':
            if(!message.url){
                console.log('no URL to install');
                return;
            }
            discoverResults = [];
            Discover.discover(message.url, function(obj){
                discoverCallback(obj, message.url);
            });
            break;
        case 'getCurrentItem':
            if(!message.url){
                console.log('no URL to install');
                return;
            }
            var result = Core.getFullItem(message.url);
            sendResponse(result);
            break;
        case 'refreshPageAction':
            PageAction.refresh();
            break;
        default:
            console.log('no one wants this message');
    }
});

/*** page action install ***/

var discoverResults = [];
function discoverCallback(obj, url){
    if(!obj) return;
    switch(obj.status){
        case 'finish':
            findInstallItem(url);
            break;
        case 'noURL':
            break;
        case 'wildcard':
            break;
    }
    if(!obj.item) return;
    discoverResults[discoverResults.length] = obj;
}

function findInstallItem(url){
    chrome.extension.sendMessage({action: 'returnInstallItem', results: discoverResults, url: url});
}
/*** end page action install ***/

/**** Start .notify install request ****/
function registerRequest(item){
    console.log('Register internal item');
    if(item.mode === 1){
        console.log('Extension install mode');
        return 'https://chrome.google.com/extensions/detail/' + item.extensionId + '?hl=en';
    }else{
        //store it in memory, get it after the options page is loaded
        pendingInstall = item;
        return chrome.extension.getURL('options.html');
    }
}
/**** End .notify install request ****/
