/**
 * @author Bramus!
 * @copyright Copyright © 2007, Bram Van Damme
 * @version 0.1
 *
 * v 0.2 - 2007.06.22 - added Undo Levels + a few extra comments (should be fully commented now)
 * v 0.1 - 2007.06.19 - initial build
 */

/* Import plugin specific language pack */
// tinyMCE.importPluginLanguagePack('bramus_classeslist', 'en');

var TinyMCE_bramusClassesPlugin = {

	/**
	 * Returns information about the plugin as a name/value array.
	 * The current keys are longname, author, authorurl, infourl and version.
	 *
	 * @returns Name/value array containing information about the plugin.
	 * @type Array 
	 */
	 
	getInfo : function() {
		return {
			longname 	: 'Plugin to support the adding of classes to elements (or their parent element)',
			author 		: 'Bramus!',
			authorurl	: 'http://www.bram.us/',
			infourl		: 'http://www.bram.us/projects/tinymce-plugins/',
			version		: "0.2"
		};
	},
	
	/**
	 * Gets executed when a TinyMCE editor instance is initialized.
	 *
	 * @param {TinyMCE_Control} Initialized TinyMCE editor control instance. 
	 */
	initInstance : function(inst) {
		// inst.addShortcut('ctrl', 'w', 'lang_wcLink_desc', 'wcLink');
	},

	/**
	 * Returns the HTML code for a specific control or empty string if this plugin doesn't have that control.
	 * A control can be a button, select list or any other HTML item to present in the TinyMCE user interface.
	 * The variable {$editor_id} will be replaced with the current editor instance id and {$pluginurl} will be replaced
	 * with the URL of the plugin. Language variables such as {$lang_somekey} will also be replaced with contents from
	 * the language packs.
	 *
	 * @param {string} cn Editor control/button name to get HTML for.
	 * @return HTML code for a specific control or empty string.
	 * @type string
	 */
	getControlHTML : function(control_name) {
		switch (control_name) {
			case "bramus_classeslist":
				return (this._buildParamsFromEditor());
			break;
		}

		return "";
	},
	
	_defaultSelect				: '<select name="bramusClassesSelect" id="bramusClassesSelect_{$editor_id}" onchange="javascript:tinyMCE.execInstanceCommand(\'{$editor_id}\', \'bramus_classeslist\', false, this);" style="width: 80px;"><option value="">[ no class ]</option></select>',
	
	_coreArray					: null,
		
	_buildParamsFromEditor		: function() {
		
		// save your energy : _coreArray already built (TIP: plugin getControlHTML is loaded multiple times when using multiple instances, yet the plugin is only loaded once!)
		if (this._coreArray	!= null) { return this._defaultSelect; }
		
		// get the param from the init
		var elmsAndClassesString = tinyMCE.getParam("bramus_classeslist", false);
		
		// param is there and is not null : start parsing!
		if (elmsAndClassesString && elmsAndClassesString != null) {
			
			// create new arrays
			this._coreArray			= new Array();
			
			// split out each "elem::parentelem[class1,class2]" entry
			elmsAndClassesArray 				= elmsAndClassesString.split(';');
			
			// loop those entries
			for (var i = 0; i < elmsAndClassesArray.length; i++) {
				
				// check if syntax is correct and get data from the entry
				var elmAndClassesString 	= elmsAndClassesArray[i];
				var elmAndClassesArray		= elmAndClassesString.match(/(.*)::(.*)\[(.*)\]/);
				
				// got less than 4 matches : invalid entry!
				if (elmAndClassesArray.length < 4) {
					
					// nothing
					
				// found 4 matches : valid entry!
				} else{
										
					// get elementNodeName, parentElementNodeName, elementClasses and push them on the arrayz!
					this._coreArray.push(new Array(elmAndClassesArray[1], elmAndClassesArray[2], elmAndClassesArray[3].split(',')));
				}
			}

		}
		
		// got hits? Return a disabled select
		if (this._coreArray.length !== 0) {
			return this._defaultSelect;
			
		// no hits : don't even bother showing me!
		} else {
			return '';
		}
	},
	
	_prevNode					: null,

	/**
	 * Gets called ones the cursor/selection in a TinyMCE instance changes. This is useful to enable/disable
	 * button controls depending on where the user are and what they have selected. This method gets executed
	 * alot and should be as performance tuned as possible.
	 *
	 * @param {string} editor_id TinyMCE editor instance id that was changed.
	 * @param {HTMLNode} node Current node location, where the cursor is in the DOM tree.
	 * @param {int} undo_index The current undo index, if this is -1 custom undo/redo is disabled.
	 * @param {int} undo_levels The current undo levels, if this is -1 custom undo/redo is disabled.
	 * @param {boolean} visual_aid Is visual aids enabled/disabled ex: dotted lines on tables.
	 * @param {boolean} any_selection Is there any selection at all or is there only a cursor.
	 */
	handleNodeChange : function(editor_id, node, undo_index, undo_levels, visual_aid, any_selection) {

		// save your energy : check if editorId equals tinyMCE.selectedInstance.editorId
		if (tinyMCE.selectedInstance.editorId != editor_id) {
			return;	
		}

		// save your energy : no node select : return!
		if (node == null)
			return;
	
		// save your energy : check if node differs from previousnode. If not, then we don't need to loop this all again ;-)
		if (node == this._previousNode) {
			return;
		} else {
			this._previousNode = node;
		}
		
		// check if current elem has a match in the _coreArray
		var gotHit		= null;
	
		for (var i = 0; i < this._coreArray.length; i++) {
			if (this._coreArray[i][0].toLowerCase() == node.nodeName.toLowerCase()) {
				gotHit		= this._coreArray[i];
				continue;
			}
		}
		
		// get the dropdown
		var selectDropDown = document.getElementById('bramusClassesSelect_' + editor_id);
		
		if (gotHit === null) {
			
			// save your energy : no need to clear things if there's nothing to clear!
			if (selectDropDown.options.length > 1) {
								
				// remove existing items
				for (var i = selectDropDown.options.length; i >= 0; i--) {
					selectDropDown.options[i] = null;
				}
				
				// push on the new ones (and enforce first one)
				selectDropDown.options[0] 		= new Option("[ no class ]");
				selectDropDown.options[0].value	= "";
			}
			
			// enable the selectbox!
			selectDropDown.disabled = 'disabled';

		} else {
						
			// get params from gotHit
			var elemNodeName		= gotHit[0];
			var parentElemNodeName	= gotHit[1];
			var elementClasses		= gotHit[2];
			
			// continue if parentElemNodeName equals self, or if parent node equals parentElemNodeName
			if ((parentElemNodeName == "self") || (tinyMCE.getParentElement(node, parentElemNodeName).nodeName.toLowerCase() == parentElemNodeName)) {
				
				// remove existing items
				for (var i = selectDropDown.options.length; i >= 0; i--) {
					selectDropDown.options[i] = null;
				}
				
				// push on the new ones (and enforce first one)
				selectDropDown.options[0] 		= new Option("[ no class ]");
				selectDropDown.options[0].value	= "";
				
				// fill the dropdown with the values
				for (var i = 0; i < elementClasses.length; i++) {
					selectDropDown.options[i+1] 				= new Option(elementClasses[i]);
					selectDropDown.options[i+1].value			= parentElemNodeName + "::" + elementClasses[i];
					
					// this node or the parent node?
					if (parentElemNodeName == "self") {
						var pNode 	= node;
					} else {
						var pNode	= tinyMCE.getParentElement(node, parentElemNodeName);
					}
					
					// if the instance currently has this class, set this option as selected
					if (tinyMCE.hasCSSClass(pNode, elementClasses[i])) {
						selectDropDown.options[i+1].selected	= true;
					}
					
				}
								
			}
			
			// enable the selectbox!
			selectDropDown.disabled = false;
				
		}

		return true;
	},

	/**
	 * Executes a specific command, this function handles plugin commands.
	 *
	 * @param {string} editor_id TinyMCE editor instance id that issued the command.
	 * @param {HTMLElement} element Body or root element for the editor instance.
	 * @param {string} command Command name to be executed.
	 * @param {string} user_interface True/false if a user interface should be presented.
	 * @param {mixed} value Custom value argument, can be anything.
	 * @return true/false if the command was executed by this plugin or not.
	 * @type
	 */
	execCommand : function(editor_id, element, command, user_interface, value) {
		switch (command) {
			case "bramus_classeslist":
			
				// get the instance
				var inst		= tinyMCE.getInstanceById(editor_id);
				
				// get the selected value
				var listValue	= value.options[value.selectedIndex].value;
				
				// this node or the parent node?
				if (listValue.split("::")[0] == "self") {
					var node 	= inst.getFocusElement();
				} else {
					var node	= tinyMCE.getParentElement(inst.getFocusElement(), listValue.split("::")[0]);
				}
				
				// begin Undo
				tinyMCE.execCommand('mceBeginUndoLevel');			
				
				// set className
				node.className	= listValue.split("::")[1];			
				
				// endUndo
				tinyMCE.execCommand('mceEndUndoLevel');
				
				// repaint the instance
				inst.repaint();
				
				// This is needed?
				tinyMCE.triggerNodeChange(false, true);
				
				return true;
			break;
		}

		return false;
	}
};

tinyMCE.addPlugin("bramus_classeslist", TinyMCE_bramusClassesPlugin);