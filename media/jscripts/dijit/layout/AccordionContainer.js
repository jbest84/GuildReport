if(!dojo._hasResource["dijit.layout.AccordionContainer"]){
dojo._hasResource["dijit.layout.AccordionContainer"] = true;
dojo.provide("dijit.layout.AccordionContainer");

dojo.require("dojo.fx");

dojo.require("dijit.layout.StackContainer");

dojo.declare(
	"dijit.layout.AccordionContainer",
	dijit.layout.StackContainer,
	{
		// summary: 
		//		Holds a set of panes where every pane's title is visible, but only one pane's content is visible at a time,
		//		and switching between panes is visualized by sliding the other panes up/down.
		// usage:
		// 	<div dojoType="dijit.layout.AccordionContainer">
		// 		<div dojoType="dijit.layout.AccordionPane" title="pane 1">
		// 			<div dojoType="dijit.layout.ContentPane">...</div>
		//  	</div>
		// 		<div dojoType="dijit.layout.AccordionPane" title="pane 2">
		//			<p>This is some text</p>
		// 		...
		// 	</div>

		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: 250,

		_verticalSpace: 0,

		startup: function(){
			dijit.layout.StackContainer.prototype.startup.apply(this, arguments);
			if(this.selectedChildWidget){
				var style = this.selectedChildWidget.containerNode.style;
				style.display = "";
				style.overflow = "auto";
				this.selectedChildWidget._setSelectedState(true);
			}else{
				this.getChildren()[0].focusNode.setAttribute("tabIndex","0");
			}
		},

		layout: function(){
			// summary
			//		Set the height of the open pane based on what room remains
			// get cumulative height of all the title bars, and figure out which pane is open
			var totalCollapsedHeight = 0;
			var openPane = this.selectedChildWidget;
			dojo.forEach(this.getChildren(), function(child){
				totalCollapsedHeight += child.getTitleHeight();
			});
			var mySize = this._contentBox;
			this._verticalSpace = (mySize.h - totalCollapsedHeight);
			if(openPane){
				openPane.containerNode.style.height = this._verticalSpace + "px";
				if(openPane.resize){
					openPane.resize({h: this.verticalSpace});
				}
			}
		},

		_setupChild: function(/*Widget*/ page){
			// Summary: prepare the given child
			return page;
		},

		_transition: function(/*Widget?*/newWidget, /*Widget?*/oldWidget){
//TODO: should be able to replace this with calls to slideIn/slideOut
			var animations = [];
			var paneHeight = this._verticalSpace;
			if(newWidget){
				newWidget.setSelected(true);
				var newContents = newWidget.containerNode;
				newContents.style.display = "";
				dojo.forEach(newWidget.getChildren(), function(widget){
					if(widget.resize){
						widget.resize({h: paneHeight});
					}
				});

				animations.push(dojo.animateProperty({ 
					node: newContents, 
					duration: this.duration,
					properties: {
						height: { start: "1", end: paneHeight }
					},
					onEnd: function(){
						newContents.style.overflow = "auto";
					}
				}));
			}
			if(oldWidget){
				oldWidget.setSelected(false);
				var oldContents = oldWidget.containerNode;
				oldContents.style.overflow = "hidden";
				animations.push(dojo.animateProperty({ 
					node: oldContents,
					duration: this.duration,
					properties: {
						height: { start: paneHeight, end: "1" } 
					},
					onEnd: function(){
						oldContents.style.display = "none";
					}
				}));
			}

			dojo.fx.combine(animations).play();
		},

		// note: we are treating the container as controller here
		processKey: function(/*Event*/ evt){
			if(this.disabled || evt.altKey || evt.shiftKey || evt.ctrlKey){ return; }
			var forward = true;
			switch(evt.keyCode){				
				case dojo.keys.LEFT_ARROW:
				case dojo.keys.UP_ARROW:
					forward=false;
				case dojo.keys.RIGHT_ARROW:
				case dojo.keys.DOWN_ARROW:
					// find currently focused button in children array
					var children = this.getChildren();
					var current = dojo.indexOf(children, evt._dijitWidget);
					// pick next button to focus on
					var offset = forward ? 1 : children.length - 1;
					var next = children[ (current + offset) % children.length ];
					dojo.stopEvent(evt);
					next._onTitleClick();
					break;
			default:
				return;
			}
		}
	}
);

dojo.declare(
	"dijit.layout.AccordionPane",
	[dijit.layout._LayoutWidget, dijit._Templated],
{
	// summary
	//		AccordionPane is a box with a title that contains another widget (often a ContentPane).
	//		It's a widget used internally by AccordionContainer.

	// title: String
	//		title to print on top of AccordionPane
	title: "",

	// selected: Boolean
	//	if true, this is the open pane
	selected: false,

	templateString:"<div class='dijitAccordionPane'\n\t><div dojoAttachPoint='titleNode;focusNode' dojoAttachEvent='onklick:_onTitleClick;onkeypress:_onKeyPress'\n\t\tclass='title' wairole=\"tab\"\n\t\t><div class='arrow'></div\n\t\t><div class='arrowTextUp' waiRole=\"presentation\">&#9650;&#9650;</div\n\t\t><div class='arrowTextDown' waiRole=\"presentation\">&#9660;&#9660;</div\n\t\t><span dojoAttachPoint='titleTextNode'>${title}</span></div\n\t><div><div dojoAttachPoint='containerNode' style='overflow: hidden; height: 1px; display: none'\n\t\tclass='body' waiRole=\"tabpanel\"\n\t></div></div>\n</div>\n",

	postCreate: function(){
		dijit.layout.AccordionPane.superclass.postCreate.apply(this, arguments);
		dojo.addClass(this.domNode, this["class"]);
		dojo.setSelectable(this.titleNode, false);
		this.setSelected(this.selected);
	},

	getTitleHeight: function(){
		// summary: returns the height of the title dom node
		return dojo.marginBox(this.titleNode).h;	// Integer
	},

	_onTitleClick: function(){
		// summary: callback when someone clicks my title
		var parent = this.getParent();
//		parent.selectChild(parent.selectedChildWidget == this ? null : this);
		parent.selectChild(this);
		this.focusNode.focus();
	},

	_onKeyPress: function(/*Event*/ evt){
		evt._dijitWidget = this;
		return this.getParent().processKey(evt);
	},
	
	_setSelectedState: function(/*Boolean*/ isSelected){
		this.selected = isSelected;
		(isSelected ? dojo.addClass : dojo.removeClass)(this.domNode, "dijitAccordionPane-selected");
		this.focusNode.setAttribute("tabIndex",(isSelected)? "0":"-1");
	},
	
	setSelected: function(/*Boolean*/ isSelected){
		// summary: change the selected state on this pane
		this._setSelectedState(isSelected);
		if(isSelected){ this.onSelected(); }
	},

	onSelected: function(){
		// summary: called when this pane is selected
	}
});

}
