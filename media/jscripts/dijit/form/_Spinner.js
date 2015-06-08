if(!dojo._hasResource["dijit.form._Spinner"]){
dojo._hasResource["dijit.form._Spinner"] = true;
dojo.provide("dijit.form._Spinner");

dojo.require("dijit.form.ValidationTextbox");
dojo.require("dijit.util.typematic");
dojo.require("dijit.util.sniff");

dojo.declare(
	"dijit.form._Spinner",
	dijit.form.RangeBoundTextbox,
	{

		// summary: Mixin for validation widgets with a spinner
		// description: This class basically (conceptually) extends dijit.form.ValidationTextbox.
		//	It modifies the template to have up/down arrows, and provides related handling code.

		// defaultTimeout: Number
		//      number of milliseconds before a held key or button becomes typematic
		defaultTimeout: 500,

		// timeoutChangeRate: Number
		//      fraction of time used to change the typematic timer between events
		//      1.0 means that each typematic event fires at defaultTimeout intervals
		//      < 1.0 means that each typematic event fires at an increasing faster rate
		timeoutChangeRate: 0.90,

		// smallDelta: Number
		//      adjust the value by this much when spinning using the arrow keys/buttons
		smallDelta: 1,
		// largeDelta: Number
		//      adjust the value by this much when spinning using the PgUp/Dn keys
		largeDelta: 10,

		templateString:"<div class=\"dijit dijitInline dijitLeft dijitSpinner\" baseClass=\"dijitSpinner\"\n\tid=\"${id}\" name=\"${name}\"\n\tdojoAttachEvent=\"onmouseover:_onMouse;onmouseout:_onMouse;\"\n\twaiRole=\"presentation\"\n><table cellspacing=\"0\"  waiRole=\"presentation\">\n\t<tr>\n\t\t<td rowspan=\"2\" class=\"dijitReset dijitStretch dijitSpinnerInput\">\n\t\t\t<input dojoAttachPoint=\"textbox;focusNode\" type=\"${type}\" dojoAttachEvent=\"onblur;onfocus;onkeyup;\"\n\t\t\t\tvalue=\"${value}\" name=\"${name}\" size=\"${size}\" maxlength=\"${maxlength}\"\n\t\t\t\twaiRole=\"spinbutton\" autocomplete=\"off\" tabIndex=\"${tabIndex}\"\n\t\t\t></td>\n\t\t<td class=\"dijitReset dijitRight dijitButtonNode dijitUpArrowButton\" \n\t\t\t\tdojoAttachPoint=\"upArrowNode\"\n\t\t\t\tdojoAttachEvent=\"onmousedown:_handleUpArrowEvent;onmouseup:_handleUpArrowEvent;onmouseover:_handleUpArrowEvent;onmouseout:_handleUpArrowEvent;\"\n\t\t\t\tbaseClass=\"dijitSpinnerUpArrow\"\n\t\t\t><div class=\"dijitA11yUpArrow\">&#9650;</div></td>\n\t</tr><tr>\n\t\t<td class=\"dijitReset dijitRight dijitButtonNode dijitDownArrowButton\" \n\t\t\t\tdojoAttachPoint=\"downArrowNode\"\n\t\t\t\tdojoAttachEvent=\"onmousedown:_handleDownArrowEvent;onmouseup:_handleDownArrowEvent;onmouseover:_handleDownArrowEvent;onmouseout:_handleDownArrowEvent;\"\n\t\t\t\tbaseClass=\"dijitSpinnerDownArrow\"\n\t\t\t><div class=\"dijitA11yDownArrow\">&#9660;</div></td>\n\t</tr>\n</table></div>\n\n",

		adjust: function(/* Object */ val, /*Number*/ delta){
			// summary: user replaceable function used to adjust a primitive value(Number/Date/...) by the delta amount specified
			// the val is adjusted in a way that makes sense to the object type
			return val;
		},

		_handleUpArrowEvent : function(/*Event*/ e){
			this._onMouse(e, this.upArrowNode);
		},

		_handleDownArrowEvent : function(/*Event*/ e){
			this._onMouse(e, this.downArrowNode);
		},


		_arrowPressed: function(/*Node*/ nodePressed, /*Number*/ direction){
			if(this.disabled){ return; }
			dojo.addClass(nodePressed, "dijitSpinnerButtonActive");
			this.setValue(this.adjust(this.getValue(), direction*this.smallDelta));
		},

		_arrowReleased: function(/*Node*/ node){
			if(this.disabled){ return; }
			this._wheelTimer = null;
			this.textbox.focus();
			dojo.removeClass(node, "dijitSpinnerButtonActive");
		},

		_typematicCallback: function(/*Number*/ count, /*DOMNode*/ node, /*Event*/ evt){
			if(node == this.textbox){ node = (evt.keyCode == dojo.keys.UP_ARROW) ? this.upArrowNode : this.downArrowNode; }
			if(count == -1){ this._arrowReleased(node); }
			else{ this._arrowPressed(node, (node == this.upArrowNode) ? 1 : -1); }
		},

		_wheelTimer: null,
		_mouseWheeled: function(/*Event*/ evt){
			dojo.stopEvent(evt);
			var scrollAmount = 0;
			if(typeof evt.wheelDelta == 'number'){ // IE
				scrollAmount = evt.wheelDelta;
			}else if(typeof evt.detail == 'number'){ // Mozilla+Firefox
				scrollAmount = -evt.detail;
			}
			if(scrollAmount > 0){
				var node = this.upArrowNode;
				var dir = +1;
			}else if(scrollAmount < 0){
				var node = this.downArrowNode;
				var dir = -1;
			}else{ return; }
			this._arrowPressed(node, dir);
			if(this._wheelTimer != null){
				clearTimeout(this._wheelTimer);
			}
			var _this = this;
			this._wheelTimer = setTimeout(function(){_this._arrowReleased(node);}, 50);
		},

		postCreate: function(){
			dijit.form._Spinner.superclass.postCreate.apply(this, arguments);

			// textbox and domNode get the same style but the css separates the 2 using !important
			if(this.srcNodeRef){
				dojo.style(this.textbox, "cssText", this.srcNodeRef.style.cssText);
				this.textbox.className += " " + this.srcNodeRef.className;
			}

			// extra listeners
			this.connect(this.textbox, dojo.isIE ? "onmousewheel" : 'DOMMouseScroll', "_mouseWheeled");
			dijit.util.typematic.addListener(this.upArrowNode, this.textbox, {keyCode:dojo.keys.UP_ARROW,ctrlKey:false,altKey:false,shiftKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout);
			dijit.util.typematic.addListener(this.downArrowNode, this.textbox, {keyCode:dojo.keys.DOWN_ARROW,ctrlKey:false,altKey:false,shiftKey:false}, this, "_typematicCallback", this.timeoutChangeRate, this.defaultTimeout);

			this._setDisabled(this.disabled == true);
		}
});

}