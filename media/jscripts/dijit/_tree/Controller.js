if(!dojo._hasResource["dijit._tree.Controller"]){
dojo._hasResource["dijit._tree.Controller"] = true;
dojo.provide("dijit._tree.Controller");

dojo.require("dijit._Widget");
dojo.require("dijit.Tree");

dojo.declare(
	"dijit._tree.Controller",
	[dijit._Widget],
{
	// Summary: _tree.Controller performs all basic operations on Tree
	// Description:
	//	Controller is the component to operate on model.
	//	Tree/_tree.Node know how to modify themselves and show to user,
	//  but operating on the tree often involves higher-level extensible logic,
	//  like: database synchronization, node loading, reacting on clicks etc.
	//  That's why it is handled by separate controller.
	//  Controller processes expand/collapse and should be used if you
	//  modify a tree.

	// treeId: String
	//		id of Tree widget that I'm controlling
	treeId: "",

	postMixInProperties: function(){
		// setup to handle events from tree
		dojo.subscribe(this.treeId, this, "_listener");	
	},

	_listener: function(/*Object*/ message){
		// summary: dispatcher to handle events from tree
		var event = message.event;
		var eventHandler =  "on" + event.charAt(0).toUpperCase() + event.substr(1);
		if(this[eventHandler]){
			this[eventHandler](message);
		}
	},

	onBeforeTreeDestroy: function(message){
		dojo.unsubscribe(message.tree.id);
	},

	onExecute: function(/*Object*/ message){
		// summary: an execute event has occured

		message.node.tree.focusNode(message.node);
		
		// TODO: user guide: tell users to listen for execute events
		console.log("execute message for " + message.node);
	},

	onNext: function(/*Object*/ message){
		// summary: down arrow pressed; move to next visible node

		var returnWidget;

		// if this is an expanded folder, get the first child
		var nodeWidget = message.node;
		if (nodeWidget.isFolder && nodeWidget.isExpanded && nodeWidget.hasChildren()) {
			returnWidget = nodeWidget.getChildren()[0];			
		} else {
			// find a parent node with a sibling
			while (nodeWidget.isTreeNode) {
				returnWidget = nodeWidget.getNextSibling();
				if(returnWidget){
					break;
				}
				nodeWidget = nodeWidget.getParent();
			}	
		}

		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}	
	},

	onPrevious: function(/*Object*/ message){
		// summary: up arrow pressed; move to previous visible node

		var nodeWidget = message.node;
		var returnWidget = nodeWidget;

		// if younger siblings		
		var previousSibling = nodeWidget.getPreviousSibling();
		if (previousSibling) {
			nodeWidget = previousSibling;
			// if the previous nodeWidget is expanded, dive in deep
			while (nodeWidget.isFolder && nodeWidget.isExpanded && nodeWidget.hasChildren()) {
				returnWidget = nodeWidget;
				// move to the last child
				var children = nodeWidget.getChildren();
				nodeWidget = children[children.length-1];
			}
		} else {
			// if this is the first child, return the parent
			nodeWidget = nodeWidget.getParent();
		}

		if (nodeWidget && nodeWidget.isTreeNode) {
			returnWidget = nodeWidget;
		}

		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	onZoomIn: function(/*Object*/ message){
		// summary: right arrow pressed; go to child node
		var nodeWidget = message.node;
		var returnWidget = nodeWidget;

		// if not expanded, expand, else move to 1st child
		if (nodeWidget.isFolder && !nodeWidget.isExpanded) {
			this._expand(nodeWidget);
		}else if (nodeWidget.hasChildren()) {
			nodeWidget = nodeWidget.getChildren()[0];
		}

		if (nodeWidget && nodeWidget.isTreeNode) {
			returnWidget = nodeWidget;
		}

		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	onZoomOut: function(/*Object*/ message){
		// summary: left arrow pressed; go to parent

		var node = message.node;
		var returnWidget = node;

		// if not collapsed, collapse, else move to parent
		if (node.isFolder && node.isExpanded) {
			this._collapse(node);
		} else {
			node = node.getParent();
		}
		if (node && node.isTreeNode) {
			returnWidget = node;
		}

		if (returnWidget && returnWidget.isTreeNode) {
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	onFirst: function(/*Object*/ message){
		// summary: home pressed; go to first visible node

		var returnWidget = message.tree;

		if (returnWidget){
			returnWidget = returnWidget.getChildren()[0];
			if (returnWidget && returnWidget.isTreeNode){
				returnWidget.tree.focusNode(returnWidget);
				return returnWidget;
			}
		}
	},

	onLast: function(/*Object*/ message){
		// summary: end pressed; go to last visible node

		var returnWidget = message.node.tree;

		var lastChild = returnWidget;
		while(lastChild.isExpanded){
			var c = lastChild.getChildren();
			lastChild = c[c.length - 1];
			if (lastChild.isTreeNode){
				returnWidget = lastChild;
			}
		}

		if (returnWidget && returnWidget.isTreeNode){
			returnWidget.tree.focusNode(returnWidget);
			return returnWidget;
		}
	},

	onToggleOpen: function(/*Object*/ message){
		// summary: user clicked the +/- icon; expand or collapse my children.
		var node = message.node;
		if (node.isExpanded){
			this._collapse(node);
		} else {
			this._expand(node);
		}
	},

	_expand: function(node){
		if (node.isFolder){
			node.expand(); // skip trees or non-folders
			var t = node.tree;
			if (t.lastFocused){ t.focusNode(t.lastFocused); } // restore focus
		}
	},

	_collapse: function(node){
		if (node.isFolder){
			// are we collapsing a child that has the tab index?
			if (dojo.query("[tabindex=0]", node.domNode).length > 0){
				node.tree.focusNode(node);
			}
			node.collapse();
		}
	}
});



dojo.declare(
	"dijit._tree.DataController",
	dijit._tree.Controller,
{
	// summary
	//		Controller for tree that hooks up to dojo.data

	onAfterTreeCreate: function(message){
		// when a tree is created, we query against the store to get the top level nodes
		// in the tree
		var tree = message.tree;

		var _this = this;
		function onComplete(/*dojo.data.Item[]*/ items){
			var childParams=dojo.map(items,
				function(item){
					return {
						item: item,
						isFolder: _this.store.hasAttribute(item, _this.childrenAttr)
						};
				});
			tree.setChildren(childParams);
		}
		this.store.fetch({ query: this.query, onComplete: onComplete });
	},

	_expand: function(/*_TreeNode*/ node){
		var store = this.store;
		var getValue = this.store.getValue;

		switch(node.state){
			case "LOADING":
				// ignore clicks while we are in the process of loading data
				return;

			case "UNCHECKED":
				// need to load all the children, and then expand
				var parentItem = node.item;
				var childItems = store.getValues(parentItem, this.childrenAttr);

				// count how many items need to be loaded
				var _waitCount = 0;
				dojo.forEach(childItems, function(item){ if(!store.isItemLoaded(item)){ _waitCount++; } });

		       	if(_waitCount == 0){
		       		// all items are already loaded.  proceed..
		       		this._onLoadAllItems(node, childItems);
		       	}else{
		       		// still waiting for some or all of the items to load
		       		node.markProcessing();

					var _this = this;
					function onItem(item){
		   				if(--_waitCount == 0){
							// all nodes have been loaded, send them to the tree
							node.unmarkProcessing();
							_this._onLoadAllItems(node, childItems);
						}
					}
					dojo.forEach(childItems, function(item){
						if(!store.isItemLoaded(item)){
			       			store.loadItem({item: item, onItem: onItem});
			       		}
			       	});
		       	}
		       	break;

			default:
				// data is already loaded; just proceed
				dijit._tree.Controller.prototype._expand.apply(this, arguments);
				break;
		}
	},

	_onLoadAllItems: function(/*_TreeNode*/ node, /*dojo.data.Item[]*/ items){
		// sumary: callback when all the children of a given node have been loaded
		// TODO: should this be used when the top level nodes are loaded too?
		var childParams=dojo.map(items, function(item){
			return {
				item: item,
				isFolder: this.store.hasAttribute(item, this.childrenAttr)
			};
		}, this);
		node.setChildren(childParams);
		dijit._tree.Controller.prototype._expand.apply(this, arguments);
	},

	_collapse: function(/*_TreeNode*/ node){
		if(node.state == "LOADING"){
			// ignore clicks while we are in the process of loading data
			return;
		}
		dijit._tree.Controller.prototype._collapse.apply(this, arguments);
	}

});

}
