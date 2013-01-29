var getItemAttr = NotifyMap.getItemAttr;
var setItemAttr = NotifyMap.setItemAttr;

/**** Start install ****/
$(function(){
	showOptions();

	try{
		chrome.extension.sendMessage({'action': 'optionsLoaded'}, function(response){
			if(response.action=='requestAuth'){
				createInstallPopup(response.item);
				chrome.extension.sendMessage({'action': 'authRequested'});
			}
		});
	}catch(e){
		// refresh as sometimes the chrome library failed to load
		console.log('Error loading chrome library');
		if(document.URL.indexOf('#refresh')==-1){
			location.href = document.URL + '#refresh';
			location.reload();
		}
	}

	//remove invalid entries
	NotifyMap.removeTrash();

	//show error message if install failed
	if(document.URL.indexOf('error')!=-1){
		trace('Error installing item', 'red');
		location.href = '#';
	}

	loadNewModesBox();

	/** event listeners **/
	$('#itemsList').bind('sortupdate', function(event, ui){
		sortUpdated(ui.item.attr('id'));
	});
	$('#urlOkBtn').bind('click', function(){
		submitUrl($('#editItemUrlBox'), $('#editItemUrls'));
		return false;
	});
	$('#newUrlOkBtn').bind('click', function(){
		submitUrl($('#newItemUrlBox'), $('#newItemUrls'));
		return false;
	});
	$('#smartOptions input').change(function(){
		fillUrlPreview();
	});
	$('#newItemBasicUrl').keydown(function(e){
		if(e.keyCode==13){
			$(this).blur();
		}
	});
	$('#newItemBasicUrl').blur(function(){
		newBasicUrl($(this).val());
		discoverBtn($(this).val());
	});
	$('#testBtn').click(function(){
		testNotify();
		return false;
	});
	$('#downloadBtn').click(function(){
		downloadRow();
		return false;
	});
	$('#newItemName').blur(function(){
		try{
			submitName(newItemId, $(this).val());
		}catch(e){}
	});

	$('#hidePageAction').click(function(){
		var value = $(this).prop('checked');
		PrefManager.setOption('hidePageAction', value);

		if(Boolean(value)){
			chrome.windows.getAll({populate: true}, function(windows){
				for(var i in windows){
					var tabs = windows[i].tabs;
					for(var j in tabs){
						chrome.pageAction.hide(tabs[j].id);
					}
				}
			});
		}else{
			chrome.extension.sendMessage({action: 'refreshPageAction'});
		}
	});
	setCheckbox($('#hidePageAction'), PrefManager.getOption('checked'));
});
function setCheckbox(checkbox, value){
	if(value){
		checkbox.attr('checked', 'checked');
	}else{
		checkbox.removeAttr('checked');
	}
}
/*** start install ***/
function createInstallPopup(item){
	var modeItem = ModeManager.getMode(item.mode);
	var mode = item.mode;
	$('body').prepend('<div id=\'installDialog\' title=\'Install new no.tify item?\'><div id=\'dialogWrap\'><div id=\'dialogSimpleWrap\'></div></div></div>');
	$('#dialogSimpleWrap').append('<table id=\'dialogSimple\'><tr></tr></table>');
	$('#dialogSimple tr').append($('<input type=\'text\' id=\'installDialogName\' spellcheck=\'false\' />').val(item.name));
	$('#dialogSimple tr').append('<td><div id=\'dialogUrl\'></div></td>');
	$('#dialogUrl').text(stripToLength(stripUrl(item.url[0]), 40)).attr('title', item.url[0]);
	$('#dialogWrap').append($('<div id="advancedDialog"></div>')
			.append('<div id=\'dialogMode\' class=\'dialogAdvanced\'></div>')
			.append('<div id=\'dialogCol3\' class=\'dialogAdvanced\'></div>')
			.append('<div id=\'dialogCol4\' class=\'dialogAdvanced\'></div>')
			.hide()
			);
	$('#installDialogName').unbind('click');
	$('#installDialogName').blur(function(){
		var value = $(this).val();
		item.name = value;
	});
	$('#dialogMode').append($('<div class=\'advLabel\'></div>').text('mode '))
		.append($('<div class=\'advValue\'></div>').text(modeItem.name));
	if(modeItem.col3){
		$('#dialogCol3').append($('<div class=\'advLabel\'></div>').text(modeItem.col3+' '))
			.append($('<div class=\'advValue\' title=\''+item[modeItem.col3]+'\'></div>').text(stripToLength(item[modeItem.col3], 60)));
	}
	if(modeItem.col4){
		$('#dialogCol4').append($('<div class=\'advLabel\'></div>').text(modeItem.col4+' '))
			.append($('<div class=\'advValue\'  title=\''+item[modeItem.col4]+'\'></div>').text(stripToLength(item[modeItem.col4], 60)));
	}
	$('#installDialog').dialog({
		modal: true,
		width: 500,
		buttons: {
			'Install': function(){
				installItem(item);
				$('#newItemDialog').dialog('destroy');
				$('#installDialog').dialog('disable').remove();
			}, 'Deny': function(){
				$('#installDialog').dialog('disable').remove();
			}
		},
		position: ['center', 50]
	});
	$('#installDialog').parent().find('.ui-dialog-buttonpane')
		.prepend($('<div style=\'float: left;\'></div>').html(
			$('<button id=\'dialogMore\'>More</button>').click(function(event){
				for(var i in item.url){
					if(i != 0){
						$('#dialogUrl').append('<br />'+stripToLength(stripUrl(item.url[i]), 50-item.name.length));
					}
				}
			$('#advancedDialog').show();
			$(this).hide();
		})
		)
	);
}

function installItem(item){
	console.log('installing');
	var id = NotifyMap.addItem(item);
	if(id!==false){
		showOptions();
		trace('item installed successfully', 'green');
		$('#item_'+id).click();
	}
}

// Shows a message on the top of the page
function trace(content, color){
	var colorString = (color=='red') ? '#AA0000' : (color=='green') ? '#11772D' : '#333333';
	$('#trace').text(content);
	$('#trace').css('color', colorString);
}

function showOptions(){
	var notifyMap = NotifyMap.get();
	var list = $('#itemsList');
	list.html('');
	for(var i=0; i<notifyMap.length; i++){
		if(!notifyMap[i]){
			console.log('There is trash');
		}else{
			var item = notifyMap[i];
			var newRow = makeRow(i, item.name, item.url[0], item.enabled);
			if(newRow){
				list.append(newRow);
			}else{
				console.log('newRow is null');
			}
		}
	}
	$('#itemsList').append('<li id="addItem" class="listItem">add new item</li>');
	refreshUrlWidths();
	$('#addItem').click(function() {
		$('.listItem').removeClass('ui-selected');
		$('#basicEdit').hide();
		$(this).addClass('ui-selected');
		newItem();
	});
	setSortable();
}

function newItem(){
	console.log('Create new item');
	var notifyMap = NotifyMap.get();
	var size = notifyMap.length;
	createNewItemDialog(size);
}

function setSortable(){
	$('#itemsList').sortable({items: 'li:not(#addItem)', axis: 'y', opacity: '0.8', tolerance: 'pointer'});
	$('#itemsList').disableSelection();
}

function sortUpdated(dragId){
	console.log('sorted');
	dragId = Number(dragId.substr(5));
	var arr = $('#itemsList').sortable('toArray');
	var notifyMap = NotifyMap.get();
	var notifyMap2 = [];
	for(var i in arr){
		arr[i] = Number(arr[i].substr(5));
		notifyMap2[i] = notifyMap[arr[i]];
	}
	NotifyMap.save(notifyMap2);
	showOptions();
	$('#basicEdit').hide();
	$('#advancedEdit').hide();
}

function createNewItemDialog(id){
	loadNewItemDialog(id);
	$('#newItemDialog').dialog({modal: true, width: 500, buttons: {
		'Cancel': function(){
			$('.ui-selected').removeClass('ui-selected');
			$('#newItemDialog').dialog('destroy');
		}
		}, position: ['center', 50], title: 'Create new item'
	});
	$('#discoverLoad').hide();
	$('#basicNew').show();
	$('#advancedNew').hide();
	addCustomButton();
}

//create the custom button
function addCustomButton(){
	if($('#dialogCustom').size()) return;
	$('#newItemDialog').parent().find('.ui-dialog-buttonpane')
		.prepend($("<div style='float: left;'></div>").html(
			$("<button id='dialogCustom'>Custom</button>").click(function(event){
				customNewItem();
				$(this).hide();
			})
		)
	);
}
function loadCustomNewItem(){
	if(newItemId==-1) return;
	var name = getItemAttr(newItemId, 'name');
	$('#newItemName').val(name);
	$('#newItemUrls').html('');
	var urls = getItemAttr(newItemId, 'url');
	for(var i in urls){
		$('#newItemUrls').append("<option value='"+i+"'>"+urls[i]+"</option>");
	}
	$('#newItemUrls').append("<option value='"+urls.length+"'>&nbsp;&nbsp;- new url -</option>");
	$('#newItemUrlWrap').hide();
	$('#basicNew').hide();
	$('#advancedNew').show();
	var mode = getItemAttr(newItemId, 'mode');
	var modeItem = ModeManager.getMode(mode);
	if(modeItem.col3){
		$('#newCol3Wrap').show();
		var col = modeItem.col3;
		$('#newCol3Wrap .itemLabel').text(col);
		$('#newItemCol3').unbind('blur');
		$('#newItemCol3').blur(function(){
			setItemAttr(newItemId, col, $(this).val());
		});
		$('#newItemCol3').val(getItemAttr(newItemId, col));
	}else{
		$('#newCol3Wrap').hide();
	}
	if(modeItem.col4){
		$('#newCol4Wrap').show();
		var col = modeItem.col4;
		$('#newCol4Wrap .itemLabel').text(col);
		$('#newItemCol4').unbind('blur');
		$('#newItemCol4').blur(function(){
			setItemAttr(newItemId, col, $(this).val());
		});
		$('#newItemCol4').val(getItemAttr(newItemId, col));
	}else{
		$('#newCol4Wrap').hide();
	}
}
var newItemId = -1;
function customNewItem(){
	var notifyMap = NotifyMap.get();
	var size = notifyMap.length;
	newItemId = size;
	notifyMap[size] = {'name': '', 'url': [], 'mode': 0};
	NotifyMap.save(notifyMap);

	$('#addItem').before(makeNewRow(size));
	$('#item_'+size).click(); //select the row
	setSortable();

	loadCustomNewItem();

	//Add the buttons
	var buttons = {};
	buttons['Create'] = function(){
		$('.ui-selected').removeClass('ui-selected');
		$('#newItemDialog').dialog('destroy');
		prefetchItem(newItemId);
		newItemId = -1;
	}
	buttons['Cancel'] = function(){
		removeRow(size, false);
		$('.ui-selected').removeClass('ui-selected');
		$('#newItemDialog').dialog('destroy');
	}
	$('#newItemDialog').dialog('option', 'buttons', buttons);
}
function newBasicUrl(value){
	if(value.indexOf('://')==-1)
		value = 'http://'+value;
	$('#newItemBasicUrl').val(value);
	fillUrlPreview();
}
function fillUrlPreview(){
	var value = $('#newItemBasicUrl').val();
	var wildUrl = Discover.getWildUrl(value);
	if(!wildUrl) return;
	$('#newUrlPreview').text(wildUrl).show();
}
function clickNewUrl(){
	$('#newUrlPreview').hide();
	$('#newItemBasicUrl').focus();
}
function setDisabled(item, value){
	if(value) item.attr('disabled', 'disabled');
	else item.removeAttr('disabled');
}
function loadNewItemDialog(id){
	$('#newItemBasicUrl').val('http://');
	$('#newUrlPreview').text('').hide();
	$('#smartDisplay').text('').hide();
	$('#smartError').text('');
}
function prefetchItem(id){
	var notifyMap = NotifyMap.get();
	if(notifyMap[id].mode == 3){
		var url = notifyMap[id].nUrl;
		if(!getOldContents(url))
			storeGuid(url);
	}
}
function storeGuid(nUrl){
	console.log('Storing Guid');
	var ajax = new XMLHttpRequest();
	ajax.open('GET', nUrl, false);
	ajax.send();
	var rText = ajax.responseText;
	rText = rText.replace(/\n/g, '');
	rText = rText.replace(/\t/g, '');
	rText = rText.replace(/\r/g, '');
	var matches = rText.match(/<item(.*?)<\/item>/ig);
	var guid;
	if(!matches || matches.length==0){
		matches = rText.match(/<entry(.*?)<\/entry>/ig);
		var result = matches[1].match(/<id.*>(.*?)<\/id>/);
		if(result)
			guid = RegExp.$1;
	}else{
		var result = matches[1].match(/<guid.*>(.*?)<\/guid>/);
		if(!result || result.length==0){
			result = matches[1].match(/<title.*>(.*)<\/title>/);
		}
		if(result)
			guid = RegExp.$1;
	}
	console.log(guid);
	if(guid)
		writeToOld(nUrl, guid);
}
function getOldContents(index){
	var old;
	if(localStorage['oldContents']){
		old = JSON.parse(localStorage['oldContents']);
	}else{
		console.log('OldContents does not exist. ');
		return false;
	}
	return old[index];
}
function writeToOld(index, content){
	var old;
	if(localStorage['oldContents']){
		old = JSON.parse(localStorage['oldContents']);
	}else{
		console.log('OldContents does not exist. Creating new array. ');
		old = {};
	}
	old[index] = content;
	localStorage['oldContents'] = JSON.stringify(old);
}
function editOption(){
	var id = getSelectedId();
	if(id===false) return;
	basicEdit(id);
}
function basicEdit(id){
	$('#basicEdit').show();
	$('#advancedEdit').hide();
	var name = getItemAttr(id, 'name');
	$('#editItemName').val(name);
	$('#editItemName').unbind('blur');
	$('#editItemName').blur(function(){
		submitName(id, $(this).val());
	});
	var urls = getItemAttr(id, 'url');
	setDisabled($('#editItemUrls'), getItemAttr(id, 'mode')==1);
	$('#editItemUrls').html('');
	for(var i in urls){
		$('#editItemUrls').append("<option value='"+i+"'>"+urls[i]+"</option>");
	}
	if(getItemAttr(id, 'mode')!=1)
		$('#editItemUrls').append("<option value='"+urls.length+"'>&nbsp;&nbsp;- new url -</option>");
	$('#editItemUrlWrap').hide();
	$('#removeBtn').unbind('click');
	$('#removeBtn').click(function(){
		removeRow(id, true);
		return false;
	});
	$('#editItemAdvanced').unbind('click');
	$('#editItemAdvanced').click(function(){
		showAdvanced(id);
	});
}
function submitName(id, value){
	console.log('Submitting name change');
	$('#item_'+id+' .itemName').html(value);
	$('#item_'+id+' .itemUrl').text(stripUrl(getItemAttr(id, 'url')[0]));
	refreshUrlWidths();
	setItemAttr(id, 'name', value);
}
function refreshUrlWidths(){
	//adjusts the width of the urls in the list
	$('.itemWrap').each(function(){
		var w = $('.itemName', $(this)).width();
		$('.itemUrl', $(this)).width($(this).width()-w-30);
	});
}
function showAdvanced(id){
	if(id===false) id = getSelectedId();
	if(id===false) return;
	advancedEdit(id);
}
function loadModesBox(showExt){
	$('#editItemMode').html('');
	var modes = ModeManager.getModes();
	for(var i in modes){
		if(showExt || i!=1)
			$('#editItemMode').append("<option value='"+i+"'>"+modes[i].name+"</option>");
	}
}
function loadNewModesBox(){
	$('#newItemMode').html('');
	var modes = ModeManager.getModes();
	for(var i in modes){
		if(i!=1)
			$('#newItemMode').append("<option value='"+i+"'>"+modes[i].name+"</option>");
	}
	$('#newItemMode').unbind('change').change(function(){
		modeChanged(newItemId, $(this));
	});
}
function advancedEdit(id){
	$('#basicEdit').hide();
	$('#advancedEdit').show();
	var mode = getItemAttr(id, 'mode');
	$('#editItemMode').unbind('change').change(function(){
		modeChanged(id, $(this));
	});
	loadModesBox(mode==1);
	$('#editItemMode').val(mode);
	setDisabled($('#editItemMode'), mode==1);

	$('#testArea').text('');

	var modeItem = ModeManager.getMode(mode);
	if(modeItem.col3){
		$('#editCol3Wrap').show();
		var col = modeItem.col3;
		$('#editCol3Wrap .itemLabel').text(col);
		$('#editItemCol3').unbind('blur');
		$('#editItemCol3').blur(function(){
			setItemAttr(id, modeItem.col3, $(this).val());
		});
		$('#editItemCol3').val(getItemAttr(id, col));
		setDisabled($('#editItemCol3'), mode==1);
	}else{
		$('#editCol3Wrap').hide();
	}
	if(modeItem.col4){
		$('#editCol4Wrap').show();
		var col = modeItem.col4;
		$('#editCol4Wrap .itemLabel').text(col);
		$('#editItemCol4').unbind('blur');
		$('#editItemCol4').blur(function(){
			setItemAttr(id, modeItem.col4, $(this).val());
		});
		$('#editItemCol4').val(getItemAttr(id, col));
		if(mode==1)
			$('#editItemCol4').attr('disabled', 'disabled');
	}else{
		$('#editCol4Wrap').hide();
	}
}
function testNotify(){
	var id = getSelectedId();
	$('#testArea').text('');
	console.log('Testing');
	var url = getItemAttr(id, 'url')[0];
	chrome.extension.sendMessage({'action': 'getNotify', 'url': url}, function(response){
		if(response.status==4){
			$('#testArea').text(response.notify);
		}else{
			$('#testArea').text('Error: '+response.status);
		}
	});
}
function modeChanged(id, selectBox){
	var value = $(selectBox).val();
	console.log('Mode changed, id: '+id+', value: '+value);
	setItemAttr(id, 'mode', value);
	showAdvanced(id);
	loadCustomNewItem();
}
function submitUrl(input, selectBox){
	var id = getSelectedId();
	var select = selectBox.val();
	var boxVal = input.val();
	if(select==0){
		$('#item_'+id+' .itemUrl').text(stripUrl(boxVal));
		refreshUrlWidths();
	}
	input.val('');
	input.parent().hide();
	NotifyMap.setItemUrl(id, select, boxVal);
	editOption();
	loadCustomNewItem();
}
function removeUrl(selectBox){
	var select = selectBox.val();
	var id = getSelectedId();
	NotifyMap.removeItemUrl(id, select);
	editOption();
	showOptions();
	$('#item_'+id).click(); //select item
	loadCustomNewItem();
	selectBox.siblings('.itemUrlWrap').hide();
}
function urlSelect(selectBox){
	var select = selectBox.val();
	if(!select && select!==0)
		return;
	var urls = getItemAttr(getSelectedId(), 'url');
	var selectVal = urls[select];
	var wrap = selectBox.siblings('.itemUrlWrap');
	wrap.show();
	wrap.find('.editBox').val(selectVal);
	wrap.find('.editBox').focus();
	if(select<urls.length){
		$('#urlRemoveBtn, #newUrlRemoveBtn').show();
	}else{
		$('#urlRemoveBtn, #newUrlRemoveBtn').hide();
	}
}
function getSelectedId(){
	var element = $('#itemsList .ui-selected');
	var id = element.attr('id');
	if(id==undefined) return false;
	id = id.substr(5);
	return parseInt(id);
}
function makeRow(id, name, url, enabled){
	if(enabled == undefined){
		setItemAttr(id, 'enabled', true);
		enabled = true;
	}
	var checked = (enabled) ? 'checked' : '';
	var newRow = $('<li class="listItem" id="item_' + id + '"></li>');
	if(!name) name = '';
	var urlVal = stripUrl(url);
	newRow.html("<div class='itemWrap'><input type='checkbox' class='itemCheck' "+checked+"/><div class='itemName'>"+name+"</div><div class='itemUrl'>"+urlVal+"</div></div>");
	newRow.click(function(){
		selectItem(this);
	});
	newRow.find('.itemCheck').change(function(){
		checkEntry(id);
	});
	return newRow;
}
//sets the corresponding map item when checked on enabled
function checkEntry(id){
	var val = $('#item_'+id+' .itemCheck').prop('checked');
	setItemAttr(id, 'enabled', val);
}
function selectItem(obj){
	$('.listItem').removeClass('ui-selected');
	$(obj).addClass('ui-selected');
	editOption();
}
function downloadRow(){
	var id = getSelectedId();
	var notifyMap = NotifyMap.get();
	var item = notifyMap[id];
	var url = 'http://210.0.215.18/~maurice/notify/download.php';
	url += '?'+'name='+encodeURIComponent(item.name);
	url += '&'+'item='+encodeURIComponent(JSON.stringify(item));
	location.href = url;
}
function makeNewRow(id){
	return makeRow(id, '', '', true);
}
//Remove one notify item, specified by the id
//If conf is set to true, prompt the user for confirmation before removing
function removeRow(id, conf){
	if(!conf || confirm('Remove '+getItemAttr(id, 'name')+'?')){
		console.log('Removing row: '+id);
		// if(getItemAttr(id, 'mode')==1){
		// 	chrome.management.setEnabled(getItemAttr(id, 'extensionId'), false);
		// }
		$('#basicEdit').hide();
		$('#advancedEdit').hide();
		$('#item_'+id).remove();
		NotifyMap.removeItem(id);
		showOptions();
	}
}

/*** Auto-discovery ***/
var discoverCount = 0;
function discoverBtn(url){
	discoverCount = 4;
	$('#discoverLoad').show();
	$('#smartDisplay').html('').show();
	$('#smartError').text('');
	Discover.discover(url, function(obj){
		if(!obj) return;
		switch(obj.status){
			case 'finish':
				$('#discoverLoad').hide();
				break;
			case 'noURL':
				$('#discoverLoad').hide();
				$('#smartDisplay').hide();
				$('#smartError').text('Please enter URL first');
				break;
			case 'wildcard':
				$('#discoverLoad').hide();
				$('#smartDisplay').hide();
				$('#smartError').text('Wildcards (*) are not supported in basic mode');
				break;
		}
		if(!obj.item) return;
		var item = obj.item;
		var label = '';
		var hint = item.name;
		var detail = ModeManager.getMode(item.mode).name;
		var rating = obj.mode;

		switch(obj.mode){
			case 1: 
				label = 'Online directory - ';
				hint = item.name;
				detail = ModeManager.getMode(item.mode).name;
				break;
			case 2:
				label = '.notify - ';
				hint = item.name;
				detail = stripUrl(item.nUrl);
				break;
			case 3:
				label = 'Unread feed - ';
				hint = item.name;
				detail = stripUrl(item.nUrl);
				break;
			case 4:
				label = 'Content change - ';
				hint = stripUrl(url);
				detail = '';
				break;
		}

		var output = createItemAnchor(item, label, hint, detail);
		addToDiscoverList(output, rating);
	});
	$('#smartDisplay').singleSelectable({
		click: function(){
				   var buttons = {};
				   buttons['Create'] = function(){
					   getDiscoverItem().dblclick();
				   }
				   buttons['Cancel'] = function(){
					   $('.ui-selected').removeClass('ui-selected');
					   $('#newItemDialog').dialog('destroy');
				   }
				   $('#newItemDialog').dialog('option', 'buttons', buttons);
				   addCustomButton();
			   }
	});
}
function addToDiscoverList(item, priority){
	var output = $("<li class='priority_"+priority+"'></li>").html(item);
	var nodes = $('#smartDisplay').children();
	for(var i=0; i<nodes.length; i++){
		if(getPriority(nodes[i])>priority){
			$(nodes[i]).before(output);
			return;
		}
	}
	$('#smartDisplay').append(output);
}
function getPriority(node){
	if(!node) return 0;
	var clss = node.className;
	var pos = clss.indexOf('priority_');
	if(pos!=-1){
		var result = Number(clss.substr(pos+9, 1));
		return result;
	}else{
		return 0;
	}
}
function createItemAnchor(item, label, labelRight, details){
	var output = $('<a href="#" class="discoverItem">'+label+'<div class="discoverItemHint">'+labelRight+'</div><div class="singleSelectable-detail">'+details+'</div></a>');
	output.click(function (event) {
		event.stopPropagation();
		event.preventDefault();
	});
	output.dblclick(function() { 
		createInstallPopup(item);
		return false;
	});
	return output;
}

function getDiscoverItem(){
	return $('#smartDisplay .ui-selected a');
}
/*** end auto discovery ***/

