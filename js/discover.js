/*global $ console */

var Discover = {};

(function(){

    var discoverCount = 0;
    Discover.getWildUrl = function(value){
        if(!checkUrl(value)) return false;
        if(!checkWildcard(value)) return false;
        var url = value.split('://');
        var protocol = url[0];
        url = url[1].split('/');
        var domain = url.shift();
        var rest = url.join('/');
        url = domain.split('.');
        var subdomain;
        if(url.length>2){
            subdomain = url.shift() + '.';
            domain = url.join('.');
        }else{
            subdomain = '';
            domain = url.join('.');
        }
        var wildUrl = '';
        var wProtocol = $('#wildProtocol').attr('checked');
        wildUrl += (wProtocol) ? '*://' : protocol + '://';
        var wSubdomain = $('#wildSubdomain').attr('checked');
        wildUrl += (wSubdomain) ? '*.' : subdomain;
        wildUrl += domain;
        var wBack = $('#wildBack').attr('checked');
        wildUrl += (wBack) ? '/*' : '/' + rest;
        return wildUrl;
    };

    Discover.discover = function(url, callback){
        if(!checkUrl(url)){ callback({status: 'noURL'}); return; }
        if(!checkWildcard(url)){ callback({status: 'wildcard'}); return; }
        discoverCount = 4;
        discoverOnline(url, function(items){
            if(items){
                for(var i in items){
                    var item = createItem(items[i].name, items[i].url, items[i].mode, items[i].col3, items[i].col4);
                    callback({mode: 1, item: item});
                }
            }
            finishDiscover(callback);
        });
        discoverNotify(url, function(items){
            if(items){
                callback({mode: 2, item: items[0]});
            }
            finishDiscover(callback);
        });
        discoverRSS(url, function(items){
            if(items){
                for(var i in items){
                    callback({mode: 3, item: items[i]});
                }
            }
            finishDiscover(callback);
        });
        discoverChanged(url, function(items){
            if(items){
                callback({mode: 4, item: items[0]});
            }
            finishDiscover(callback);
        });
    };

    function checkUrl(url){
        if(!url || url == 'http://'){
            return false;
        }
        return true;
    }

    function checkWildcard(url){
        if(url.indexOf('*')!=-1){
            return false;
        }
        return true;
    }

    function getUrlDom(url, method, callback){
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function(){
            if(ajax.readyState === 4){
                if(ajax.status === 405){
                    getUrlDom(url, 'GET', callback);
                    return;
                }
                var rText = ajax.responseText;
                var tempDiv = $('<div></div>');
                tempDiv.html(rText.replace(/<script(.|\s)*?\/script>/g, ''));
                callback(tempDiv);
            }
        };
        ajax.open(method, url, true);
        ajax.send();
    }

    function getNotifyName(url){
        var ajax = new XMLHttpRequest();
        ajax.open('GET', url, false);
        ajax.send();
        var rText = ajax.responseText;
        if(!rText) return 'untitled';
        try{
            var obj = JSON.parse(rText);
            var name = (obj.name) ? obj.name : 'untitled';
            return name;
        }catch(e){
            return 'untitled';
        }
    }

    function createItem(name, urls, mode, col3, col4){
        var modeItem = ModeManager.getMode(mode);
        if(!name) name = 'untitled';
        if(typeof (urls) == 'string')
            urls = JSON.parse(urls);
        var item = {'name': name, 'url': urls, 'mode': mode};
        var col3Label = modeItem.col3;
        if(col3 && col3Label)
            item[col3Label] = col3;
        var col4Label = modeItem.col4;
        if(col4 && col4Label)
            item[col4Label] = col4;
        return item;
    }
    function combineUrl(url, suffix){
        if(suffix.indexOf('://') > -1) return suffix;
        var arr = url.split('://');
        var protocol = arr.shift();
        arr = arr[0].split('/');
        if(arr[arr.length-1] === '') arr.pop();
        if(arr.length < 2){
            console.log('top level');
            url = arr[0];
        }else{
            var file = arr.pop();
            if(file.indexOf('.') > -1){
                url = arr.join('/');
            }else{
                url = arr.join('/') + '/' + file;
            }
        }
        var locator = url + '/' + suffix;
        if(suffix.indexOf('/') === 0){
            locator = arr[0] + suffix;
        }
        return protocol + '://' + locator;
    }

    function finishDiscover(callback){
        discoverCount--;
        if (discoverCount === 0){
            callback({status: 'finish'});
        }
    }

    var itemDirectory = 'http://projects.mauricelam.com/notify/directory/searchitem.php';
    function discoverOnline(url, callback){
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4){
                try {
                    if (ajax.status !== 200)
                        throw ('HTTP connection error: ' + ajax.status);

                    var rText = ajax.responseText;
                    var itemList = JSON.parse(rText);
                    if (itemList.length === 0)
                        throw 'Item list is empty';
                    callback(itemList);
                } catch (exception) {
                    // unable to parse response as JSON
                    callback(false);
                    console.log('unable to parse', ajax.responseText);
                }
            }
        };

        var ajaxUrl = itemDirectory + '?url=' + url;
        ajax.open('GET', ajaxUrl, true);
        ajax.send();
    }
    function discoverNotify(url, callback){
        getUrlDom(url, 'GET', function(tempDiv){
            var notifies = $('link[rel*="notify"]', tempDiv);
            if(notifies.size() > 0){
                var combinedUrl = combineUrl(url, notifies.attr('href'));
                var name = getNotifyName(combinedUrl);
                var item = createItem(name, [url], 0, combinedUrl, '');
                callback([item]);
            }else{
                callback(false);
            }
        });
    }
    function discoverRSS(url, callback){
        getUrlDom(url, 'GET', function(tempDiv){
            var notifies = $('link[rel*="alternate"][type*="application/rss+xml"]', tempDiv);
            var notif2 = $('link[rel*="alternate"][type*="application/atom+xml"]', tempDiv);
            var items = [];
            if(notifies.size() > 0 || notif2.size() > 0){
                var name = stripUrl(url);
                if(name.indexOf('/') > -1) name = name.substr(0, name.indexOf('/'));
                notifies.each(function(i){
                    if($(this).attr('title')) name = $(this).attr('title');
                    var combinedUrl = combineUrl(url, $(this).attr('href'));
                    items[i] = createItem(name, [Discover.getWildUrl(url)], 3, combinedUrl, '');
                });
                notif2.each(function(i){
                    if($(this).attr('title')) name = $(this).attr('title');
                    var combinedUrl = combineUrl(url, $(this).attr('href'));
                    items[i] = createItem(name, [Discover.getWildUrl(url)], 3, combinedUrl, '');
                });
            }else{
                callback(false);
                return;
            }
            callback(items);
        });
    }
    function discoverChanged(url, callback){
        if(url.indexOf('https://') === 0){
            callback([]);
            return;
        }
        var name = stripUrl(url);
        if(name.indexOf('/') > -1) name = name.substr(0, name.indexOf('/'));
        var item = createItem(name, [Discover.getWildUrl(url)], 5, '', '');
        callback([item]);
    }
})();
