var url = document.URL;
if(url.indexOf(".notify")!=-1){
    if(getExtension(getFileName(url))===".notify" || url.indexOf(".notify.php")!=-1){
		installNotify();
    }
}

function getJSONText(text){
	var pos = text.indexOf("{");
	if(pos==-1){
		console.log("No JSON string found");
		return "";
	}
	var output = text.substr(pos);
	pos = output.indexOf("}");
	if(pos==-1){
		console.log("Illegal JSON string");
		return "";
	}
	output = output.substr(0, pos+1);
	console.log(output);
	return output;
}

function checkHTMLValid(){
	var head = document.getElementsByTagName("head")[0].innerHTML.length>0;
	var divs = document.getElementsByTagName("div").length>0;
	return head||divs;
}

function installNotify(item){
    console.log("installing notify");
	console.log(item);
	if(!item || item==""){
		var links = document.getElementsByTagName("a");
		if(links && links[0]){
			item = links[0].href;
		}else{
			item = document.body.innerText;
		}
		item = decodeURIComponent(item);
		item = getJSONText(item);
		console.log(item);
	}
	if(!item || item==""){
		console.log("This page is not designed for .notify installation or is corrupted");
		if(!checkHTMLValid()){
			location.href = "chrome-extension://cepkiiaikapljlmgjlipdnafoeojbepp/options.html#error";
		}
		return;
	}
    var obj = JSON.parse(item);
    console.log(obj);
    chrome.extension.sendMessage({"action": "register", "item": obj}, function(returnUrl){
		location.href = returnUrl;
    });
}

function getExtension(filename){
    var subName = filename.substr(filename.lastIndexOf('.'));
    return subName;
}

function getFileName(url){
    var sharp = url.indexOf("#");
    if(sharp==-1) sharp = url.length;
    var question = url.indexOf("?");
    if(question==-1) question = url.length;
    var end = (sharp<question) ? sharp : question;
    var subUrl = (end==-1) ? url : url.substr(0, end);
    var start = subUrl.lastIndexOf("/");
    if(start!=-1)
	return subUrl.substr(start+1);
    console.log("Error: No filename");
    return false;
}
