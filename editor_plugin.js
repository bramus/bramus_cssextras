/**
 * @name         bramus_cssextras
 * @version      0.4.1
 *
 * @author       Bramus! (Bram Van Damme)
 * @authorURL    http://www.bram.us/
 * @infoURL      http://www.bram.us/projects/tinymce-plugins/
 * 
 * @license      Creative Commons Attribution-Share Alike 2.5
 * @licenseURL   http://creativecommons.org/licenses/by-sa/2.5/
 *
 *
 * v 0.4.1 - 2007.11.22 - BUG : didn't work with multiple content_css files specified (@see http://www.bram.us/projects/tinymce-plugins/tinymce-classes-and-ids-plugin-bramus_cssextras/#comment-89820)
 *                      - BUG : If for example p.test is defined multiple times, show "test" only once in the dropdown.
 * v 0.4.0 - 2007.09.10 - BUG : selection noclass returned "undefined" as class, should be empty
 *                      - ADD : automatic building of the bramus_cssextras_classesstring and bramus_cssextras_idsstring
 * v 0.3.3 - 2007.07.27 - getInfo returned wrong version. Fixed + version increment.
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
			version		: "0.4.1"
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
	
	_xmlhttp					: null,
	_xmlhttpresponse			: null,
	
	_trim 						: function(str) {
		return str.replace(/^\s+|\s+$/g,"");
	},
	
	_ltrim 						: function(str) {
		return str.replace(/^\s+/,"");
	},
	
	_rtrim 						: function() {
		return this.replace(/\s+$/,"");
	},
		
	_loadContentCSS				: function(control_name) {
	
		// if this_xmlhttpresponse equals null, then the css file hasn't been loaded yet ... 
			if (this._xmlhttpresponse == null) {

				// create nex XHR object
				if (window.XMLHttpRequest) {
					this._xmlhttp 	= new XMLHttpRequest();
				} else if (window.ActiveXObject) {
					this._xmlhttp 	= new ActiveXObject('Microsoft.XMLHTTP');
				}
				
				// make sure it's an object
				if (typeof(this._xmlhttp) == 'object') {
					
					// get the content_css path
					content_css	= tinyMCE.getParam("content_css", false);
					
					// var which will hold all data from all files referred through content_css
					content_css_data = "";
					
					// content_css exists?
					if (content_css && (content_css != null) && (content_css != "")) {
						
						// support the referring of multiple classes
						content_css_arr	= content_css.split(',');
						
						// loop all referred css files
						for (i = 0; i < content_css_arr.length; i++) {
							
							// load it in, but <<<< SYNCHRONOUS >>>>
							// this._xmlhttp.onreadystatechange	= this._doneLoadContentCSS;		// SYNCHRONOUS, no need to set onreadystatechange!
							this._xmlhttp.open('GET', this._trim(content_css_arr[i]), false);						// false == SYNCHRONOUS ;-)
							this._xmlhttp.send(null);
							
							// wait for it to load
							if (this._xmlhttp.readyState == 4) {
		
								// loaded!
								if (this._xmlhttp.status == 200) {
		
									// get the responseText
									this._xmlhttpresponse	= this._xmlhttp.responseText;
		
									// run some prelim regexes on them
									this._xmlhttpresponse 	= this._xmlhttpresponse.replace(/(\r\n)/g, "");			// get all CSS rules on 1 line per selector : 1 line on whole document
									this._xmlhttpresponse 	= this._xmlhttpresponse.replace(/(\})/g, "}\n");		// get all CSS rules on 1 line per selector : 1 line per selector
									this._xmlhttpresponse 	= this._xmlhttpresponse.replace(/\{(.*)\}/g, "");		// strip out css rules themselves
									this._xmlhttpresponse 	= this._xmlhttpresponse.replace(/\/\*(.*)\*\//g, "");	// strip out comments
									this._xmlhttpresponse 	= this._xmlhttpresponse.replace(/\t/g, "");				// strip out tabs
		
									content_css_data		+= this._xmlhttpresponse + "\n";
		
								// not loaded!
								} else {
									alert("[bramus_cssextras] Error while loading content_css file '" + content_css_arr[i] + "', make sure the path is correct and that the file is located on this server!");	
								}
							}
						}
		
						// clear the xhr object
						this._xmlhttp 			= null;
						
					}
					
				}
			}
							
		// someone set us up the bomb! -->> strip out classes (or ids)
			if (control_name == "bramus_cssextras_classes") {
				matches		= content_css_data.match(/([a-zA-Z0-9])+(\.)([a-zA-Z0-9_\-])+(\b)?/g);
			} else {
				matches		= content_css_data.match(/([a-zA-Z0-9])+(\#)([a-zA-Z0-9_\-])+(\b)?/g);
			}
			
		// found any hits?
			if (!matches) {
				return '';	
			} else {
				arr_selectors			= new Array();
				arr_values				= new Array();
			}
		
		// run matches and build selectors and values arrays.					
			for (var i = 0; i < matches.length; i++) {
				
				if (control_name == "bramus_cssextras_classes") {
					matches[i]	= matches[i].split(".");
				} else {
					matches[i]	= matches[i].split("#");
				}
				
				
				var position	= this._inArray(((matches[i][0] != "ul")?matches[i][0]:"li") + "::" + ((matches[i][0] != "ul")?"self":matches[i][0]), arr_selectors);
			
				// not found : add selector and classes/ids
				if (position === false) {
					arr_selectors.push(((matches[i][0] != "ul")?matches[i][0]:"li") + "::" + ((matches[i][0] != "ul")?"self":matches[i][0]));
					arr_values.push(matches[i][1]);
					
				// found, adjust ids on position
				} else {
					// extra check: check if ain't class/id isn't in values yet!
					// console.log("Checking for " + matches[i][1] + " in " + arr_values[position].split(','));
					if (this._inArray(matches[i][1], arr_values[position].split(',')) === false) {
						arr_values[position]	= arr_values[position] + "," + matches[i][1];
					}
				}

			}
		
		// build the elmsAndClassesArray
			var elmsAndClassesArray			= new Array();
			
			for (var i = 0;  i < arr_selectors.length; i++) {
				elmsAndClassesArray.push(arr_selectors[i] + "[" + arr_values[i] + "]");
			}
								
			return elmsAndClassesArray;
	},
	
	// get position of item in array
	_inArray					: function(needle, haystack) {
		for (var i = 0; i < haystack.length; i++){
			if (needle == haystack[i]) {
				return i;
			}
		}			
		return false;
	},
		
	_buildParamsFromEditor		: function(control_name) {
		
		// STEP 1 : Define what to check (ids or classes?)
			switch(control_name) {
				case "bramus_cssextras_classes":
					coreArray		= this._coreArrayClasses;
					defaultSelect	= this._defaultSelectClasses;
					param			= tinyMCE.getParam("bramus_cssextras_classesstring", null);
				break;
				
				case "bramus_cssextras_ids":
					coreArray		= this._coreArrayIds;
					defaultSelect	= this._defaultSelectIds;
					param			= tinyMCE.getParam("bramus_cssextras_idsstring", null);
				break;
			}
						
		// STEP 2 : Now that we've defined this all, do something with it!
		
			// save your energy : coreArray already built (TIP: plugin getControlHTML is loaded multiple times when using multiple instances, yet the plugin is only loaded once!)
			if (coreArray != null) { return defaultSelect; }
			
			// get the param from the init
			var elmsAndClassesString = param;
			
			// param is there (can be empty)
			if (elmsAndClassesString != null) {
				// split out each "elem::parentelem[class1,class2]" entry from that string
				elmsAndClassesArray 				= elmsAndClassesString.split(';');
				
			// param is not there
			} else {				
				// try building the elmsAndClassesArray by reading in and parsing the content_css file
				elmsAndClassesArray					= this._loadContentCSS(control_name);
			}
			
			// console.log(elmsAndClassesArray);
			
			// create new array to hold the real stuff
			coreArray			= new Array();
			
			// loop the entries of elmsAndClassesArray
			if (elmsAndClassesArray.length > 0) {
				for (var i = 0; i < elmsAndClassesArray.length; i++) {
					
					// check if syntax is correct and get data from the entry
					var elmAndClassesString 	= elmsAndClassesArray[i];
					var elmAndClassesArray		= elmAndClassesString.match(/(.*)::(.*)\[(.*)\]/);
					
					// got less than 4 matches : invalid entry!
					if ((!elmAndClassesArray) || (elmAndClassesArray.length < 4)) {
						
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
				
				// define what to set class or id to
				toSetTo 	= (listValue.split("::")[1] != undefined)?listValue.split("::")[1]:"";
				
				// set className
				if (command == "bramus_cssextras_classes_exec") {
					node.className	= toSetTo;
					
				// set id
				} else {
					
					// toSetTo is not empty : perform a check if an element with that id already exists
					if (toSetTo != "") {
						
						// there already exists an element with that id?
						if (inst.getDoc().getElementById(toSetTo)) {
							
							// confirm the move of the id
							if (confirm("There already exists an element with that id, ids must be unique.\nPress 'OK' to move the id to the current element.\nPress 'Cancel' to leave unchanged")) {
								
								// remove id from current element with that id
								inst.getDoc().getElementById(toSetTo).id = "";
								
								// set id on node
								node.id			= toSetTo;
								
							// not confirmed, set selectedindex of node to 0
							} else {
								document.getElementById('BramusCSSExtrasIdsSelect_' + editor_id).selectedIndex = 0;
							}
							
						// no element with that id exists yet : set the id
						} else {
							
						// set id on node
						node.id				= toSetTo;
					}
						
					// toSetTo is empty : clear the id on the selected element
					} else {
							
						// set id on node
						node.id				= toSetTo;
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