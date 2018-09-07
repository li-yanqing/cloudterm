
AutocompleteController = function(terminal, cloudterm){
	//hterm.Terminal
	this.term = terminal;
	this.cloudterm = cloudterm;
	

	this.minLen = 3;
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
	var that = this;
	
	this.input = $(this.term.cursorNode_)
	
	//connect to jquery autocomplete
	this.input.autocomplete({
		lookup: function (query, done) {
			that.engine.search(query, function(data) {
				var result = { suggestions: [ ] };
				data.forEach(function(v){
					result.suggestions.push({'value':v, 'data':v});
				});
				console.log('local data:' + result);
				done(result);
			});
	    },
		onSelect: function (suggestion) {
//			console.log('You selected: ' + suggestion.value + ', ' + suggestion.data);
			that.changeKeyword2Selection(suggestion.value);
		},
		orientation:'auto',
		minChars: this.minLen,
		triggerSelectOnValidInput:false,
		width:180
	});
	
	this.input.on('blur.autocomplete', function () {
		// TODO Does it work?
		console.log("on blur");
	});

}


/**
 * return false to stop key event
 */
AutocompleteController.prototype.onKeyDown = function(key){
	var keys = {
	            ESC: "\x1b",
	            TAB: "\t",
	            RETURN: "\r",
	            LEFT: "\x1b[D",
	            UP: "\x1b[A",
	            RIGHT: "\x1b[C",
	            DOWN: "\x1b[B"
	        };
	 
	//mapping up down when suggestions are shown.
	if(this.input.autocomplete().visible){
		switch (key) {
		case keys.UP:
			this.input.autocomplete('moveUp');
			return false;
		case keys.ESC:
			this.input.autocomplete('hide');
			return false;
		case keys.DOWN:
			this.input.autocomplete('moveDown');
			return false;
		case keys.RETURN:
			if(this.input.autocomplete().selectedIndex == -1){
				//when no choice
				this.input.autocomplete('hide');
				return true;
			}else{
				this.input.autocomplete('select', this.input.autocomplete().selectedIndex);
			}
			return false;
		default:
			break;
		}
		
	}
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
//    console.log('isShowOptions: ' + isShowOptions);

    var arr = text.split(/\s+/);
    this.keywordToken = arr[arr.length -1];
//    console.log('keyword:' + keyword);

    if(isShowOptions){
    	this.input.val(this.keywordToken);
    	this.input.autocomplete('onFocus');
    }

}

AutocompleteController.prototype.changeKeyword2Selection = function(newvalue){
	// stop autocomplete for a while
	this.input.autocomplete('disable');
	// send backspace x keyword.length
	var len = this.keywordToken.length;
	for (var i = 0; i < len; i++) {
		this.cloudterm.onCommand('\x7f');
	}
	// input new value
	this.cloudterm.onCommand(newvalue);
	// re-enable autocomplete
	this.input.autocomplete('enable');
	
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
