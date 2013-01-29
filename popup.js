/*global $ console chrome confirm */

var itemId = -1;
var itemName = '';
var possibleItems = [];
var loaded = false;
var active;
var initItemExist; // Stays the same for the life of the bubble
var nameChanged = false;

$(function(){
    active = getUrlComponent('active')=='true';
    initItemExist = active;
    // $("select").uniform();

    chrome.tabs.getSelected(null, function(tab){
        if(checkValidUrl(tab.url)){
            $('#wrap').show();
            getInstall(tab.url, tab.id);
            $('#addBtn').hide();
            if(active){
                $('.added').show();
                getCurrentItem(tab.url);
                loadEdit();
            }else{
                loadAdd();
            }
        }else{
            $('#addBtn').text('no.tify not available for this item');
            loaded = true;
        }
    });

    $('#doneBtn').click(function(){
        window.close();
    });

    $('#removeBtn').click(function(){
        NotifyMap.removeItem(itemId);
        window.close();
    });

    $('#notifyName').blur(function(){
        setItemName($(this).val());
    }).keyup(function(){
        nameChanged = true;
    });
    
    $('#selectType').change(function(){
        setItemType($(this).val());
    });
});

function addNewItem(index){
    $('.added').show();
    var item = possibleItems[index];
    itemId = NotifyMap.addItem(item);
    if(itemId === false){
        console.log('item install unsuccessful');
        return;
    }
    var name = (nameChanged) ? $('#notifyName').val() : item.name;
    setItemName(name);
    active = true;
    loadEdit();
    lightUpPageAction();
    $('#noAdd').remove();
}

function setItemType(index){
    if(index === 'noAdd'){
        return;
    }
    if(!active){
        addNewItem(index);
    }
    var item = possibleItems[index];
    var urls = NotifyMap.getItemAttr(itemId, 'url');
    console.log(nameChanged);
    var name = (initItemExist || nameChanged) ? NotifyMap.getItemAttr(itemId, 'name') : item.name;
    item.name = name;
    item.url = urls;
    item.enabled = true;
    NotifyMap.swapItem(itemId, item);
}

function setItemName(name){
    if(itemId === -1){
        console.log('item id is not defined');
        return;
    }
    $('#notifyName').val(name);
    NotifyMap.setItemAttr(itemId, 'name', name);
}

function loadAdd(){
    //$("#customBtn").text("custom").addClass("active").show();
    $('#selectType').append('<option value=\'noAdd\' id=\'noAdd\'>- Don\'t no.tify -</option>');
}

function loadEdit(){
    $('#customBtn').text('edit').addClass('active').show();
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
    console.log('Internal request received:', request.action);
    switch(request.action){
        case 'returnInstallItem':
            processInstallItems(request.results, request.url);
            break;
        default:
            console.log('Popup does not want this request', request.action);
            break;
    }
});

function getCurrentItem(url){
    chrome.extension.sendMessage({action: 'getCurrentItem', url: url}, function(item){
        processCurrentItem(item);
    });
}

function processCurrentItem(item){
    $('#selectType').removeAttr('disabled');
    $('#loading').remove();
    itemId = item.id;
    setItemName(item.item.name);
    var mode = ModeManager.getMode(item.item.mode).name;
    var len = possibleItems.length;
    possibleItems[len] = item.item;
    $('#selectType').prepend($('<option value="' + len + '">Current - ' + mode + '</option>'));
    $('#selectType').val(len);
    // $.uniform.update("select");
}

function getInstall(url, id){
    console.log('getting install items');
    chrome.extension.sendMessage({action: 'getInstallItems', url: url});
}

function processInstallItems(items, url){
    displayItems(items, url);
}

function discoverSort(a, b){
    return a.mode - b.mode;
}

function displayItems(items, url){
    $('#selectType').removeAttr('disabled');
    $('#loading').remove();
    items.sort(discoverSort);
    for(var i in items){
        var item = items[i].item;
        var label = 'Item - '; 
        var hint = item.name;
        switch(items[i].mode){
            case 1: 
                label = 'Online directory - ';
                hint = item.name;
                break;
            case 2:
                label = '.notify - ';
                hint = item.name;
                break;
            case 3:
                label = 'Unread feed - ';
                hint = item.name;
                break;
            case 4:
                label = 'Content change - ';
                hint = stripUrl(url);
                break;
        }
        var len = possibleItems.length;
        possibleItems[len] = item;
        var output = $('<option value="' + len + '"></option>').html(label + hint);
        $('#selectType').append(output);
    }
    // $.uniform.update("select");
    if(!active) setItemName(name);

    if(checkValidUrl(url)){
        $('#addBtn').text('add no.tify item').addClass('active');
    }
    loaded = true;
}

function getUrlComponent(name){
    var url = document.URL;
    var sharp = url.split('#');
    if(sharp.length<2) return false;
    var queries = sharp[1].split('&');
    for(var i in queries){
        var exp = queries[i].split('=');
        if(exp[0]==name){
            return exp[1];
        }
    }
    return false;
}

function checkValidUrl(url){
    if(url.indexOf('chrome') === 0){
        return false;
    }
    return true;
}

function lightUpPageAction(){
    chrome.tabs.getSelected(null, function(tab){
        PageAction.showActive(tab.id);
    });
}

function trace(msg, color){
    console.log(msg);
}
