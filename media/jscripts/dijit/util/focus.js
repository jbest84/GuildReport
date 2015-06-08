if(!dojo._hasResource["dijit.util.focus"]){
dojo._hasResource["dijit.util.focus"] = true;
dojo.provide("dijit.util.focus");

dijit.util.focus = new function(){
	// summary:
	//		This class is used to save the current focus / selection on the screen,
	//		and restore it later.   It's typically used for popups (menus and dialogs),
	//		but can also be used for a menubar or toolbar.   (For example, in the editor
	//		the user might type Ctrl-T to focus the toolbar, and then when he/she selects
	//		a menu choice, focus is returned to the editor window.)
	//
	//		Note that it doesn't deal with submenus off of an original menu;
	//		From this class's perspective it's all part of one big menu.
	//
	//		The widget must implement a close() callback, which will close dialogs or
	//		a context menu, and for a menubar, it will close the submenus and remove
	//		highlighting classes on the root node.


	/////////////////////////////////////////////////////////////
	// Keep track of currently focused and previously focused element

	var curFocus, prevFocus;	
	function onFocus(/*DomNode*/ node){
		if(node && node.tagName=="body"){
			node=null;
		}
		if(node !== curFocus){
			prevFocus = curFocus;
			curFocus = node;
			
			// Publish event that this node received focus.
			// Note that on IE this event comes late (up to 100ms late) so it may be out of order
			// w.r.t. other events.   Use sparingly.
			dojo.publish("focus", [node]);
		}
	}

	dojo.addOnLoad(function(){
		if(dojo.isIE){
			// TODO: to make this more deterministic should delay updating curFocus/prevFocus for 10ms?
			window.setInterval(function(){ onFocus(document.activeElement); }, 100);
		}else{
			dojo.body().addEventListener('focus', function(evt){ onFocus(evt.target); }, true);
		}
	});

	/////////////////////////////////////////////////////////////////
	// Main methods, called when a dialog/menu is opened/closed

	var isCollapsed = function(){
		// summary: return whether the current selection is empty
		var _window = dojo.global;
		var _document = dojo.doc;
		if(_document.selection){ // IE
			return _document.selection.createRange().text == "";
		}else if(_window.getSelection){
			var selection = _window.getSelection();
			if(dojo.isString(selection)){ // Safari
				return selection == "";
			}else{ // Mozilla/W3
				return selection.isCollapsed || selection.toString() == "";
			}
		}
	};

	var getBookmark = function(){
		// summary: Retrieves a bookmark that can be used with moveToBookmark to return to the same range
		var bookmark;
		var _document = dojo.doc;
		if(_document.selection){ // IE
			var range = _document.selection.createRange();
			if(_document.selection.type.toUpperCase()=='CONTROL'){
				if(range.length){
					bookmark=[];
					var i=0;
					while(i<range.length){
						bookmark.push(range.item(i++));
					}
				}else{
					bookmark = null;
				}
			}else{
				bookmark = range.getBookmark();
			}
		}else{
			var selection;
			//TODO: why a try/catch?  check for getSelection instead?
			try{selection = dojo.global.getSelection();}
			catch(e){/*squelch*/}
			if(selection){
				var range = selection.getRangeAt(0);
				bookmark = range.cloneRange();
			}else{
				console.debug("No idea how to store the current selection for this browser!");
			}
		}
		return bookmark;
	};

	var moveToBookmark = function(/*Object*/bookmark){
		// summary: Moves current selection to a bookmark
		// bookmark: this should be a returned object from dojo.html.selection.getBookmark()
		var _document = dojo.doc;
		if(_document.selection){ // IE
			if(dojo.isArray(bookmark)){
				var range= _document.body.createControlRange();
				var i=0;
				while(i<bookmark.length){
					range.addElement(bookmark[i++]);
				}
				range.select();
			}else{
				var range = _document.selection.createRange();
				range.moveToBookmark(bookmark);
				range.select();
			}
		}else{ //Moz/W3C
			var selection;
			//TODO: why a try/catch?  check for getSelection instead?
			try{selection = dojo.global.getSelection();}
			catch(e){/*squelch*/}
			if(selection && selection.removeAllRanges){
				selection.removeAllRanges();
				selection.addRange(bookmark);
			}else{
				console.debug("No idea how to restore selection for this browser!");
			}
		}
	};

	this.save = function(/*Widget*/menu, /*Window*/ openedForWindow){
		// summary:
		//	called when a popup appears (either a top level menu or a dialog),
		//	or when a toolbar/menubar receives focus
		//
		// menu:
		//	the menu that's being opened
		//
		// openedForWindow:
		//	iframe in which menu was opened
		//
		// returns:
		//	a handle to restore focus/selection

		return {
			// Node to return focus to
			focus: dojo.isDescendant(curFocus, menu.domNode) ? prevFocus : curFocus,
			
			// Previously selected text
			bookmark: 
				!dojo.withGlobal(openedForWindow||dojo.global, isCollapsed) ?
				dojo.withGlobal(openedForWindow||dojo.global, getBookmark) :
				null,
				
			openedForWindow: openedForWindow
		};
	};

	this.restore = function(/*Object*/ handle){
		// summary:
		//	notify the manager that menu is closed; it will return focus to
		//	the specified handle

		var restoreFocus = handle.focus,
			bookmark = handle.bookmark,
			openedForWindow = openedForWindow;
			
		// focus on element that was focused before menu stole the focus
		if(restoreFocus){
			restoreFocus.focus();
		}

		//do not need to restore if current selection is not empty
		//(use keyboard to select a menu item)
		if(bookmark && dojo.withGlobal(openedForWindow||dojo.global, isCollapsed)){
			if(openedForWindow){
				openedForWindow.focus();
			}
			try{
				dojo.withGlobal(openedForWindow||dojo.global, moveToBookmark, null, [bookmark]);
			}catch(e){
				/*squelch IE internal error, see http://trac.dojotoolkit.org/ticket/1984 */
			}
		}
	};
}();

}
