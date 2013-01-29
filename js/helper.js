function stripToLength(text, length){
	if(!text) return "";
	if(text.length>length){
		text = text.substr(0, length-3);
		return text+"...";
	}
	return text;
}
const uselessHead = ["http://", "*://", "www."];
function stripUrl(text){
	if(!text) return "";
	for(var i in uselessHead){
		var pos = text.indexOf(uselessHead[i]);
		if(pos===0) text = text.substr(uselessHead[i].length);
	}
	if(text.substr(text.length-1)=="/")
		text = text.substr(0, text.length-1);
	return text;
}
