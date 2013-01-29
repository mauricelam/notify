var PrefManager = {};

(function(){
	var m = PrefManager;
	var defaults = {
		"hidePageAction": false
	};

	function getDefault(label){
		var output = defaults[label];
		if(output==undefined) return false;
		return output;
	}

	function getOptions(){
		var opt = localStorage["options"];
		if(!opt) return false;
		var options = JSON.parse(opt);
		if(!options) return false;
		return options;
	}

	m.setOption = function(label, value){
		var options = getOptions();
		if(!options) options = {};
		options[label] = value;
		localStorage["options"] = JSON.stringify(options);
		console.log("Options saved", label, value);
	}

	m.getOption = function(label){
		var options = getOptions();
		if(!options) return getDefault(label);
		return options[label];
	}

})();
