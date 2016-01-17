tabIndent = {
	version: '0.1.8',
	config: {
		tab: '\t',
		focusDelay: 500
	},
	events: {
		keydown: function(e) {
			var tab = tabIndent.config.tab;
			var tabWidth = tab.length;
			if (e.keyCode === 9) {
				e.preventDefault();
				var	currentStart = tabIndent.getSelectionStart(this),
					currentEnd = this.selectionEnd;
				if (e.shiftKey === false) {
					// Normal Tab Behaviour
					if (!tabIndent.isMultiLine(this)) {
						// Add tab before selection, maintain highlighted text selection
						tabWidth = tabIndent.createTab(this, currentStart, currentStart);
						tabIndent.setCursorPosition(this, currentStart, tabWidth);
					} else {
						// Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, indent it there.
						var	startIndices = tabIndent.findStartIndices(this),
							l = startIndices.length,
							newStart = undefined,
							newEnd = undefined,
							affectedRows = 0;

						while(l--) {
							var lowerBound = startIndices[l];
							if (startIndices[l+1] && currentStart != startIndices[l+1]) lowerBound = startIndices[l+1];

							if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
								tabIndent.elText(this, (tabIndent.elText(this).slice(0, startIndices[l]) + tab + tabIndent.elText(this).slice(startIndices[l])));

								newStart = startIndices[l];
								if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
								affectedRows++;
							}
						}

						this.selectionStart = newStart;
						this.selectionEnd = (newEnd !== 'end' ? newEnd + (tabWidth * affectedRows) : tabIndent.elText(this).length);
					}
				} else {
					// Shift-Tab Behaviour
					if (!tabIndent.isMultiLine(this)) {
						if (tabIndent.elText(this).substr(currentStart - tabWidth, tabWidth) == tab) {
							// If there's a tab before the selectionStart, remove it
							tabIndent.elText(this, (tabIndent.elText(this).substr(0, currentStart - tabWidth) + tabIndent.elText(this).substr(currentStart)));
							this.selectionStart = currentStart - tabWidth;
							this.selectionEnd = currentEnd - tabWidth;
						} else if (tabIndent.elText(this).substr(currentStart - 1, 1) == "\n" && tabIndent.elText(this).substr(currentStart, tabWidth) == tab) {
							// However, if the selection is at the start of the line, and the first character is a tab, remove it
							tabIndent.elText(this, (tabIndent.elText(this).substring(0, currentStart) + tabIndent.elText(this).substr(currentStart + tabWidth)));
							this.selectionStart = currentStart;
							this.selectionEnd = currentEnd - tabWidth;
						}
					} else {
						// Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, remove an indent from that row
						var	startIndices = tabIndent.findStartIndices(this),
							l = startIndices.length,
							newStart = undefined,
							newEnd = undefined,
							affectedRows = 0;

						while(l--) {
							var lowerBound = startIndices[l];
							if (startIndices[l+1] && currentStart != startIndices[l+1]) lowerBound = startIndices[l+1];

							if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
								if (tabIndent.elText(this).substr(startIndices[l], tabWidth) == tab) {
									// Remove a tab
									tabIndent.elText(this, (tabIndent.elText(this).slice(0, startIndices[l]) + tabIndent.elText(this).slice(startIndices[l] + tabWidth)));
									affectedRows++;
								} else {}	// Do nothing

								newStart = startIndices[l];
								if (!newEnd) newEnd = (startIndices[l+1] ? startIndices[l+1] - 1 : 'end');
							}
						}

						this.selectionStart = newStart;
						this.selectionEnd = (newEnd !== 'end' ? newEnd - (affectedRows * tabWidth) : tabIndent.elText(this).length);
					}
				}
			} else if (e.keyCode === 27) {	// Esc
				tabIndent.events.disable(e);
			} else if (e.keyCode === 13 && e.shiftKey === false) {	// Enter
				var	self = tabIndent,
					cursorPos = tabIndent.getSelectionStart(this),
					startIndices = self.findStartIndices(this),
					numStartIndices = startIndices.length,
					startIndex = 0,
					endIndex = 0,
					tabMatch = new RegExp("^" + tab.replace(tabIndent.getTabSymbol(this), tabIndent.getTabSymbol(this, true)).replace(/ /g, '\\s') + "+", 'g'),
					lineText = '';
					tabs = null;

				for(var x=0;x<numStartIndices;x++) {
					if (startIndices[x+1] && (cursorPos >= startIndices[x]) && (cursorPos < startIndices[x+1])) {
						startIndex = startIndices[x];
						endIndex = startIndices[x+1] - 1;
						break;
					} else {
						startIndex = startIndices[numStartIndices-1];
						endIndex = tabIndent.elText(this).length;
					}
				}

				lineText = tabIndent.elText(this).slice(startIndex, endIndex);
				tabs = lineText.match(tabMatch);
				if (tabs !== null) {
					e.preventDefault();
					var indentText = tabs[0];
					var indentWidth = indentText.length;
					var inLinePos = cursorPos - startIndex;
					if (indentWidth > inLinePos) {
						indentWidth = inLinePos;
						indentText = indentText.slice(0, inLinePos);
					}
					
					tabIndent.createEnter(this, cursorPos, indentText);

					tabIndent.setCursorNextLinePosition(this, cursorPos, indentWidth);
				}
			}
		},
		saveDivCursorPosition: function(e){
			tabIndent.cursorPosition = tabIndent.getCaretPosition(this);
			tabIndent.anchorNode = window.getSelection().anchorNode;
		},
		disable: function(e) {
			var events = this;

			// Temporarily suspend the main tabIndent event
			tabIndent.remove(e.target);
		},
		focus: function() {
			var	self = tabIndent,
				el = this,
				delayedRefocus = setTimeout(function() {
					var classes = (el.getAttribute('class') || '').split(' '),
					contains = classes.indexOf('tabIndent');

					el.addEventListener('keydown', self.events.keydown);

					el.style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAAAEgAAABIAEbJaz4AAAKZSURBVEjH7ZRfSFNRHMe/9+/+3G26tUn+ycywgURgUBAUJlIhWlEQEjN8yQcfolKJxJAefOjRCnT0IPYQ9iRa9FAYJiaUVP4twf7gzJzpnDbdzHt3z+3Fua3dO4Ne/f5ezjmc8+F7zvmeA2zrv0VFGlexAssFw1mG1pqqUL8npGY60Bw3ykYaOVjlrFXmEyw0AQj6g53UONQBO8DBzuiT2tUx+gR/mwACBQpIUoACBZoAZaOSiWwFIFs4oMMS9/boZVF8T8vtkbEofatiRKF9mXK6M7tTyyxRaPwWtJezIu9+9cNzxHk/n9938rz6IWpvgRdZd5/HcsvC9jadqk6Z0qkBiCaAF3UtX8cy6h1mwlnLhsuZuRvqABlyNJqb0q0ZWsb7uUVHlXAahWl1y3M2tVuQVR1Q0Pl0dwZ67KbZtGnX/ma++/FsCCY1ANlAxIuT2NZP3XB/GRKc9qKhKTYnd4auJbIqINEBDa5zoWWByoS1jocR+loKpKGJKqBLybN/OQN2Tmodv4jCtYIMYurnP5sLf+V5XK4DbFv4haaDCEABA/J88GdegD1I2+heY0Xj7M1itiMjP8srzutjXMbkIDZKCrAcfGOt8LwODimYnzzjLcHIx5VFwPekZrhVPYmxyVNAvZP8KV28SykClo6XF4/t9LpC2TTIteulJepJjD5nCjL8E56sMHt40NYYqE51ZnZIfmGXYBC68p/6v6UkApSI8Y2ejPVKhyE0PdLDPcg+Z003G0W7YUmmvo/WtjXgbiKAAQNGpjYRDOwWILx3dV16ZBsx3QsdYi4JNUw6uCvMbrUcWFAvPWznfH9/GQHR5xAbPuTumRFWvS+ZwDGyJFfidkxWk2oaIfTRk8RI0YqMAQBAL7YVrz/iUDx4QII4/QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxMi0xMi0wMVQwMDowNjo0My0wNTowMLKpTWYAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTItMTItMDFUMDA6MDY6NDMtMDU6MDDD9PXaAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAABJRU5ErkJggg==)";
					el.style.backgroundPosition = 'top right';
					el.style.backgroundRepeat = 'no-repeat';

					if (contains !== -1) classes.splice(contains, 1);
					classes.push('tabIndent-rendered');
					el.setAttribute('class', classes.join(' '));

					el.removeEventListener('focus', self.events.focus);

					if (el.nodeName === 'BODY')
						el.removeEventListener('click', self.events.focus);
				}, tabIndent.config.focusDelay);

			// If they were just tabbing through the input, let them continue unimpeded
			el.addEventListener('blur', function b() {
				clearTimeout(delayedRefocus);
				el.removeEventListener('blur', b);
			});
		}
	},
	render: function(el) {
		var self = this;

		//if (el.nodeName === 'TEXTAREA') {
		if (el.nodeName) {
			el.addEventListener('focus', self.events.focus);

			if (el.nodeName === 'BODY')
				el.addEventListener('click', self.events.focus);

			el.addEventListener('keydown', self.events.saveDivCursorPosition);
			//el.addEventListener('keyup', self.events.saveDivCursorPosition);
			//el.addEventListener('mousedown', self.events.saveDivCursorPosition);
			el.addEventListener('mouseup', self.events.saveDivCursorPosition);

			el.addEventListener('blur', function b(e) {
				self.events.disable(e);
			});
		}
	},
	renderAll: function() {
		// Find all elements with the tabIndent class
		var textareas = document.getElementsByTagName('textarea'),
			t = textareas.length,
			contains = -1,
			classes = [],
			el = undefined;

		while(t--) {
			classes = (textareas[t].getAttribute('class') || '').split(' ');
			contains = classes.indexOf('tabIndent');

			if (contains !== -1) {
				el = textareas[t];
				this.render(el);
			}
			contains = -1;
			classes = [];
			el = undefined;
		}
	},
	remove: function(el) {
		if (el.nodeName === 'TEXTAREA') {
			var classes = (el.getAttribute('class') || '').split(' '),
				contains = classes.indexOf('tabIndent-rendered');

			if (contains !== -1) {
				el.removeEventListener('keydown', this.events.keydown);
				el.style.backgroundImage = '';

				classes.splice(contains, 1);
				classes.push('tabIndent');
				el.setAttribute('class', (classes.length > 1 ? classes.join(' ') : classes[0]));
			}
		}
	},
	removeAll: function() {
		// Find all elements with the tabIndent class
		var textareas = document.getElementsByTagName('textarea'),
			t = textareas.length,
			contains = -1,
			classes = [],
			el = undefined;

		while(t--) {
			classes = (textareas[t].getAttribute('class') || '').split(' ');
			contains = classes.indexOf('tabIndent-rendered');

			if (contains !== -1) {
				el = textareas[t];
				this.remove(el);
			}
			contains = -1;
			classes = [];
			el = undefined;
		}
	},
	createEnter: function(el, enterPos, indentText) {
		var text = tabIndent.elText(this);
		if(el.nodeName === 'TEXTAREA')
			tabIndent.elText(this, (text.slice(0, enterPos) + '\n' + indentText + text.slice(enterPos)));
		else {
			tabIndent.elText(this, (text.slice(0, enterPos)));
			tabIndent.insertBrInDiv();
			tabIndent.insertTextAfterBrInDiv(indentText + '\u00A0' + text.slice(enterPos));
		}
	},
	createTab: function (el, from, to) {
		var text = tabIndent.elText(el);
		var tab = '';
		if(el.nodeName === 'TEXTAREA')
			tab = tabIndent.config.tab;
		else 
			tab = tabIndent.config.tab + (from == 0 ? ' ' : '');

		tabIndent.elText(this, (text.slice(0, from) + tab + text.slice(to)));
		return tab.length;
	},
	insertAfter: function (referenceNode, newNode) {
		referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	},
	insertBrInDiv: function(){
  	tabIndent.insertAfter(tabIndent.anchorNode, document.createElement("br"));
	},
	insertTextAfterBrInDiv: function(text){
  	tabIndent.insertAfter(tabIndent.anchorNode.nextSibling, document.createTextNode(text));
	},
	elText: function(el, setText) {
		var propName = '';

		if(el.nodeName === 'TEXTAREA')
			propName = 'value';
		else{
			el = tabIndent.anchorNode;
			propName = 'textContent';
		}
		
		if(setText)
			el[propName] = setText;

		return el[propName];
	},
	getTabSymbol: function(el, withSlash){
		if(el.nodeName === 'TEXTAREA')
			return withSlash ? '\\t' : '\t';
		else
			return withSlash ? '\\u00A0' : '\u00A0';
	},
	setCursorNextLinePosition: function(el, cursorPos, indentWidth){
		if(el.nodeName === 'TEXTAREA') {
			el.selectionStart = cursorPos + indentWidth + 1;
			el.selectionEnd = el.selectionStart;
		}
		else {
			tabIndent.setCaretPosition(el, tabIndent.anchorNode.nextSibling.nextSibling, indentWidth);
		}
	},
	setCursorPosition: function(el, cursorPos, indentWidth){
		if(el.nodeName === 'TEXTAREA') {
			el.selectionStart = cursorPos + indentWidth;
			el.selectionEnd = cursorPos + indentWidth;
		}
		else {
			tabIndent.setCaretPosition(el, tabIndent.anchorNode, cursorPos + indentWidth);
		}
	},
	getSelectionStart: function(el){
		if(el.nodeName === 'TEXTAREA')
			return el.selectionStart;
		else
			return tabIndent.cursorPosition;
	},
	getCaretPosition: function(editableDiv) {
		//Get from: http://stackoverflow.com/a/3976125
		var caretPos = 0,
		  sel, range;
		if (window.getSelection) {
		  sel = window.getSelection();
		  if (sel.rangeCount) {
		    range = sel.getRangeAt(0);
		    if (range.commonAncestorContainer.parentNode == editableDiv ||
						range.commonAncestorContainer.parentNode.parentNode == editableDiv) {
		      caretPos = range.endOffset;
		    }
		  }
		} else if (document.selection && document.selection.createRange) {
		  range = document.selection.createRange();
		  if (range.parentElement() == editableDiv) {
		    var tempEl = document.createElement("span");
		    editableDiv.insertBefore(tempEl, editableDiv.firstChild);
		    var tempRange = range.duplicate();
		    tempRange.moveToElementText(tempEl);
		    tempRange.setEndPoint("EndToEnd", range);
		    caretPos = tempRange.text.length;
		  }
		}
		return caretPos;
	},
	setCaretPosition: function(editableDiv, node, position){
		position = position ? position : 0;
		var range = document.createRange();
		var sel = window.getSelection();
		range.setStart(node, position);
		range.setEnd(node, position);
		//range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	},
	isMultiLine: function(el) {
		// Extract the selection
		var	snippet = tabIndent.elText(el).slice(el.selectionStart, el.selectionEnd),
			nlRegex = new RegExp(/\n/);

		if (nlRegex.test(snippet)) return true;
		else return false;
	},
	findStartIndices: function(el) {
		var	text = tabIndent.elText(el),
			startIndices = [],
			offset = 0;

		while(text.match(/\n/) && text.match(/\n/).length > 0) {
			offset = (startIndices.length > 0 ? startIndices[startIndices.length - 1] : 0);
			var lineEnd = text.search("\n");
			startIndices.push(lineEnd + offset + 1);
			text = text.substring(lineEnd + 1);
		}
		startIndices.unshift(0);

		return startIndices;
	}
}
