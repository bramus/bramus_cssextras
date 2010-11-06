/**
 * @author Bramus!
 * @copyright Copyright © 2007, Bram Van Damme
 * @version 0.3.2
 *
 * v 0.3.2 - 2007.07.23 - minor change in outputted HTML of the selects
 * v 0.3.1 - 2007.06.28 - ids must be unique, so added a check and confirm thingy ;-)
 * v 0.3   - 2007.06.27 - Plugin changed from bramus_classeslist to bramus_cssextras as it now supports the settings of ids too :-)
 * v 0.2   - 2007.06.22 - added Undo Levels + a few extra comments (should be fully commented now)
 * v 0.1   - 2007.06.19 - initial build
 */

/* Import plugin specific language pack */
// tinyMCE.importPluginLanguagePack('bramus_classeslist', 'en');

var TinyMCE_BramusCSSExtrasPlugin = {

	/**
	 * Returns information about the plugin as a name/value array.
	 * The current keys are longname, author, authorurl, infourl and version.
	 *
	 * @returns Name/value array containing information about the plugin.
	 * @type Array 
	 */
	 
	getInfo : function() {
		return {
			longname 	: 'Plugin to support the adding of classes and ids to elements (or their parent element)',
			author 		: 'Bramus!',
			authorurl	: 'http://www.bram.us/',
			infourl		: 'http://www.bram.us/projects/tinymce-plugins/',
			version		: "0.3.1"
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
			case "bramus_cssextras_classes":
			case "bramus_cssextras_ids":
				return (this._buildParamsFromEditor(control_name));
			break;
		}

		return "";
	},
	
	_defaultSelectClasses		: '<select name="BramusCSSExtrasClassesSelect" id="BramusCSSExtrasClassesSelect_{$editor_id}" onchange="javascript:tinyMCE.execInstanceCommand(\'{$editor_id}\', \'bramus_cssextras_classes_exec\', false, this);" style="width: 80px;" class="mceSelectList"><option value="">[ no class ]</option></select>',
	_defaultSelectIds			: '<select name="BramusCSSExtrasIdsSelect" id="BramusCSSExtrasIdsSelect_{$editor_id}" onchange="javascript:tinyMCE.execInstanceCommand(\'{$editor_id}\', \'bramus_cssextras_ids_exec\', false, this);" style="width: 80px;" class="mceSelectList"><option value="">[ no id ]</option></select>',
	
	_coreArrayClasses			: null,
	_coreArrayIds				: null,
		
	_buildParamsFromEditor		: function(control_name) {
		
		// STEP 1 : Define what to check (ids or classes?)
			switch(control_name) {
				case "bramus_cssextras_classes":
					coreArray		= this._coreArrayClasses;
					defaultSelect	= this._defaultSelectClasses;
					param			= tinyMCE.getParam("bramus_cssextras_classesstring", false);
				break;
				
				case "bramus_cssextras_ids":
					coreArray		= this._coreArrayIds;
					defaultSelect	= this._defaultSelectIds;
					param			= tinyMCE.getParam("bramus_cssextras_idsstring", false);
				break;
			}
			
		// STEP 2 : Now that we've defined this all, do something with it!
		
			// save your energy : coreArray already built (TIP: plugin getControlHTML is loaded multiple times when using multiple instances, yet the plugin is only loaded once!)
			if (coreArray != null) { return defaultSelect; }
			
			// get the param from the init
			var elmsAndClassesString = param;
			
			// param is there and is not null : start parsing!
			if (elmsAndClassesString && elmsAndClassesString != null) {
				
				// create new arrays
				coreArray			= new Array();
				
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
						coreArray.push(new Array(elmAndClassesArray[1], elmAndClassesArray[2], elmAndClassesArray[3].split(',')));
					}
				}
	
			}
		
		// STEP 3 : now that everything is filled, set 'm back (pass by reference I miss here ...)
			switch(control_name) {
				case "bramus_cssextras_classes":
					this._coreArrayClasses		= coreArray;
				break;
				case "bramus_cssextras_ids":
					this._coreArrayIds			= coreArray;
				break;
			}
			
		// STEP 4 : finalize (return something)
		
			// corearray not null and got hits? Return a disabled select
			if (coreArray && (coreArray.length !== 0)) {
				return defaultSelect;
				
			// corearray is null and/or no hits : don't even bother showing me; the user prolly didn't set this param!
			} else {
				return '';
			}
	},
	
	_previousNode				: null,
	
	_checkHit					: function(coreArray) {
	
		// correarray not null?
		if (coreArray) {
			for (var i = 0; i < coreArray.length; i++) {
				if (coreArray[i][0].toLowerCase() == this._previousNode.nodeName.toLowerCase()) {
					return coreArray[i];
				}
			}
		}
		
		return null;
		
	},
	
	_doSomethingWithHit			: function(gotHit, selectDropDown, what) {
		
		if (gotHit === null) {
			
			// only continue if a dropdown is present!
			if (selectDropDown) {
				
				// save your energy : no need to clear things if there's nothing to clear!
				if (selectDropDown.options.length > 1) {
									
					// remove existing items
					for (var i = selectDropDown.options.length; i >= 0; i--) {
						selectDropDown.options[i] = null;
					}
					
					// push on the new ones (and enforce first one)
					selectDropDown.options[0] 		= new Option("[ no " + what + " ]");
					selectDropDown.options[0].value	= "";
				}
				
				// enable the selectbox!
				selectDropDown.disabled = 'disabled';
				
			}

		} else {
						
			// get params from gotHit
			var elemNodeName		= gotHit[0];
			var parentElemNodeName	= gotHit[1];
			var elementClasses		= gotHit[2];
			
			// continue if parentElemNodeName equals self, or if parent node equals parentElemNodeName
			if ((parentElemNodeName == "self") || (tinyMCE.getParentElement(this._previousNode, parentElemNodeName).nodeName.toLowerCase() == parentElemNodeName)) {
				
				// remove existing items
				for (var i = selectDropDown.options.length; i >= 0; i--) {
					selectDropDown.options[i] = null;
				}
				
				// push on the new ones (and enforce first one)
				selectDropDown.options[0] 		= new Option("[ no " + what + " ]");
				selectDropDown.options[0].value	= "";
				
				// fill the dropdown with the values
				for (var i = 0; i < elementClasses.length; i++) {
					selectDropDown.options[i+1] 				= new Option(elementClasses[i]);
					selectDropDown.options[i+1].value			= parentElemNodeName + "::" + elementClasses[i];
					
					// this node or the parent node?
					if (parentElemNodeName == "self") {
						var pNode 	= this._previousNode;
					} else {
						var pNode	= tinyMCE.getParentElement(this._previousNode, parentElemNodeName);
					}
					
					// if the instance currently has this class, set this option as selected
					switch(what) {
						
						case "class":
							if (tinyMCE.hasCSSClass(pNode, elementClasses[i])) {
								selectDropDown.options[i+1].selected	= true;
							}
						break;
						
						case "id":
							if (pNode.id == elementClasses[i]) {
								selectDropDown.options[i+1].selected	= true;
							}
						break;
					}
					
				}
								
			}
			
			// enable the selectbox!
			selectDropDown.disabled = false;
				
		}
	},

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
		
		// check if current elem has a match in the _coreArrayClasses or _coreArrayIds
		var gotHitClass		= this._checkHit(this._coreArrayClasses);
		var gotHitIds		= this._checkHit(this._coreArrayIds);
		
		// get the dropdowns
		var selectDropDownClasses 	= document.getElementById('BramusCSSExtrasClassesSelect_' + editor_id);
		var selectDropDownIds 		= document.getElementById('BramusCSSExtrasIdsSelect_' + editor_id);
		
		// now do something with that hit and that dropdown!
		this._doSomethingWithHit(gotHitClass, selectDropDownClasses, "class");
		this._doSomethingWithHit(gotHitIds, selectDropDownIds, "id");

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
			case "bramus_cssextras_classes_exec":
			case "bramus_cssextras_ids_exec":
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
				if (command == "bramus_cssextras_classes_exec") {
					node.className	= listValue.split("::")[1];
					
				// set id
				} else {
					
					// there already exists an element with that id?
					if (inst.getDoc().getElementById(listValue.split("::")[1])) {
						
						// confirm the move of the id
						if (confirm("There already exists an element with that id, ids must be unique.\nPress 'OK' to move the id to the current element.\nPress 'Cancel' to leave unchanged")) {
							
							// remove id from current element with that id
							inst.getDoc().getElementById(listValue.split("::")[1]).id = "";
							
							// set id on node
							node.id			= listValue.split("::")[1];
							
						// not confirmed, set selectedindex of node to 0
						} else {
							document.getElementById('BramusCSSExtrasIdsSelect_' + editor_id).selectedIndex = 0;
						}
					
					// id not found in document yet
					} else {
						
						// set id on node
						node.id				= listValue.split("::")[1];
					}
				}
				
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

tinyMCE.addPlugin("bramus_cssextras", TinyMCE_BramusCSSExtrasPlugin);