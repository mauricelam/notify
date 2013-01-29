/**** start read function ****/
var url = document.URL;
chrome.extension.sendMessage({"action": "read", "readUrl": url});
/**** end read function ****/

/*function stripUseless(word){
    return stripAfter(word, " -");
}

function stripAfter(word, ch){
    if(!word) return "";
    var pos = word.indexOf(ch);
    if(pos !== -1){
	word.substr(0, pos);
    }
	return word;
}*/
