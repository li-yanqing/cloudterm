
AutocompleteController = function(terminal){
	//hterm.Terminal
	this.term = terminal;
	

	this.minLen = 2;
	this.track = [];
	for (var i = 0; i < this.minLen; i++) {
		this.addTrack("");
	}
	
	//initialize search engine
	this.engine = new Bloodhound({
	  initialize: false,
	  local: [],
	  queryTokenizer: Bloodhound.tokenizers.whitespace,
	  datumTokenizer: Bloodhound.tokenizers.whitespace
	});
	

}

AutocompleteController.prototype.onTerminalReady = function(){
	//insert hidden text into cursor
//	this.input = $('<input type="text" class="typeahead"  />');
//	this.input.appendTo(this.term.cursorNode_);
//	this.input.hide();
//	this.input.on("change", function() {
//		  console.log( $( this ).text() );
//	});
	
	this.input = $(this.term.cursorNode_)

	
	
	
	//connect to jquery autocomplete
	this.input.autocomplete({
		lookup: function (query, done) {
	        // Do Ajax call or lookup locally, when done,
	        // call the callback and pass your results:
	        var result = {
	            suggestions: [
	                { "value": "United Arab Emirates", "data": "AE" },
	                { "value": "United Kingdom",       "data": "UK" },
	                { "value": "United States",        "data": "US" }
	            ]
	        };

	        done(result);
	    },
		onSelect: function (suggestion) {
			console.log('You selected: ' + suggestion.value + ', ' + suggestion.data);
		},
		orientation:'auto',
		width:150
	})

	
	//connect to typeahead
//	this.input.typeahead({
//		  minLength: 1,
//		  highlight: true
//		},
//		{
//		  name: 'my-dataset',
//		  source: this.searchInBloodhound
//		});
}

AutocompleteController.prototype.searchInjQuery = function(){
	return ['dog','dogs','dorse','dotest','do loooooooooong text'];

}


AutocompleteController.prototype.searchInBloodhound = function(query, syncResults, asyncResults){
//	console.log(query + " " + syncResults + " " + asyncResults);
	syncResults(['dog','dogs','dorse','dotest','do loooooooooong text']);
}


/**
 * return false to stop key event
 */
AutocompleteController.prototype.onKeyDown = function(key){
//	this.input.typeahead('val', 'dog');
//	this.input.typeahead('open');
	this.input.val('un');
	console.log(this.input.val());
	this.input.autocomplete('onFocus');
	this.input.autocomplete('moveUp');
	return true;
}

AutocompleteController.prototype.print = function(textFromServer){
//	console.log(textFromServer);
    if(textFromServer.length > this.minLen){
    	//remove control tokens 
    	var regex = /\x1b\[[0-9;]*[mGKH]/gi;
    	var noFormat = textFromServer.replace(regex, '')
    	noFormat = noFormat.replace('\x1b\]0;', '\n')
    	noFormat = noFormat.replace('\x07', ' ')
    	console.log("noFormat:" + noFormat);
        

		// separate text by space and non-word
		this.addDataToIndex(noFormat.split(/\s+/));
		this.addDataToIndex(noFormat.split(/\W+/));
	}

    var text = this.getLastRowText();
    this.addTrack(text);

    var isShowOptions = this.isShowOptions();
    console.log('isShowOptions: ' + isShowOptions);

    var arr = text.split(/\s+/);
    var keyword = arr[arr.length -1];
    console.log('keyword:' + keyword);

    if(isShowOptions){
        this.engine.search(keyword,function(data){
            console.log('local data:' + data);
        });
    }

}

AutocompleteController.prototype.addDataToIndex = function(tokens){
	var min = this.minLen;
	var engine = this.engine;
	tokens.forEach(function(t) {
		if(t.length > min)
			engine.add(t);
	})
}

AutocompleteController.prototype.isShowOptions = function(){
    var latestText = this.track[this.track.length -1 ].text;
    var hasMin = RegExp(' \\S{' + this.minLen + ',}$').test(latestText);

    if(hasMin) { 
        for (var i = 1; i < this.track.length; i++) {
            if( Math.abs(this.track[i].length - this.track[i-1].length) != 1 ){
                return false;
            }
        }
        return true;
    }
    return false;
}

AutocompleteController.prototype.addTrack = function(text){
	var column = this.term.getCursorColumn();
	var row = this.term.getCursorRow();
	this.track.push({'text':text, 'length':text.length, 'row':row, 'column':column});
	while(this.track.length > this.minLen)
		this.track.shift();
}

AutocompleteController.prototype.getLastRowText = function(){
	var num = this.term.getAbsoluteCursorRow();
    var lastRowNode = this.term.getRowNode(num);
    var text = lastRowNode.innerText;
    return text;
}
