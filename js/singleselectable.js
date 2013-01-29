(function($){
	$.fn.singleSelectable = function(options, params){
		if(options==undefined || typeof options=="object"){
			var obj = this;
			obj.delegate("li", "click", function(){
				$(".ui-selected", obj).removeClass("ui-selected");
				$(".singleSelectable-detail", obj).hide();
				$(this).addClass("ui-selected");
				$(".singleSelectable-detail", $(this)).show();
				if(options.click) options.click();
			});
		}else{
			switch(options){
				case "addItems":
					if(typeof params == "object"){
						for(var i in params){
							this.append(params[i]);
						}
					}
					break;
				case "addItem":
					this.append(params);
					break;
			}
			console.log(options);
		}
	}
})(jQuery);
