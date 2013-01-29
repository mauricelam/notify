var Inextension = {}; //Internal Extensions

(function(){
	var m = Inextension;
	m.obj = {};

	m.getNotify = function(exId){
		for(var i in m.obj){
			if(i == exId){
				return m.obj[i].getNotify();
			}
		}
		return false;
	}

	m.exist = function(exId){
		for(var i in m.obj){
			if(i == exId){
				return true;
			}
		}
		return false;
	}

	m.getItems = function(){
		var output = new Array();
		for(var i in m.obj){
			var item = m.obj[i];
			output[output.length] = {"name":item.getName(),"url":item.getUrl(),"mode":1,"extensionId":i,"enabled":true};
		}
		return output;
	}
})();

(function(){
	Inextension.obj["bkphpfcmkibhopledhgacljcmmdadlij"] = {};
	var m = Inextension.obj["bkphpfcmkibhopledhgacljcmmdadlij"];

	var name = "Facebook"; //Name of the site of notification
    var url = ["*://*.facebook.com*"]; //Array of URLs applicable for the notification
    
    /**
    * Modify the function below to return the notification number of the site.
    */
	m.getNotify = function(){
		try{
			var ajax = new XMLHttpRequest();
			ajax.open("GET", "http://www.facebook.com/", false);
			ajax.send();
			var rText = ajax.responseText;
			rText = rText.match(/<div id="jewelCase">(.*)<div class="clearfix"/g)[0];
			var matches = rText.match(/<span class="jewelCount"(.*?)<\/a>/g);
			var counter = 0;
			for(var i in matches){
				var num = matches[i].match(/[\d]+/)[0];
				counter += parseFloat(num);
			}
			return counter;
		}catch(e){
			console.log("Error AJAX-ing");
			return {"notify": 0, "mode": 1, "status": 1};
		}
	}

    /**
    * Getter functions below. Do not modify them. 
    */
    m.getName = function(){ return name; }
    m.getUrl = function(){ return url; }
})();
