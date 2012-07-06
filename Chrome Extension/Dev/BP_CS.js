/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT,
  BP_MOD_ERROR, BP_MOD_WDL, BP_MOD_W$ */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
/* members el.type,
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */


/**
 * @module CS
 */
var BP_MOD_PANEL = (function (g_win)
{
    "use strict"; // TODO: @remove Only used in debug builds

    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var CSS_HIDDEN = IMPORT(m.CSS_HIDDEN);
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    var encrypt = IMPORT(m.encrypt);
    var decrypt = IMPORT(m.decrypt);
    var stopPropagation = IMPORT(m.stopPropagation);
    var preventDefault = IMPORT(m.preventDefault);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    var newPRecord = IMPORT(m.newPRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var deleteRecord = IMPORT(m.deleteRecord);
    var getRecs = IMPORT(m.getRecs);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-end */    m = null;
    
    /** @globals-begin */
	// Names used in the code. A mapping is being defined here because
	// these names are externally visible and therefore may need to be
	// changed in order to prevent name clashes with other libraries.
	// These are all merely nouns/strings and do not share a common
	// semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
	var eid_panel = "com-bprivy-panel"; // Used by panel elements
	var eid_panelTitle ="com-bprivy-panelTitle"; // Used by panel elements
	var eid_panelList ="com-bprivy-panelList"; // Used by panel elements
	var eid_ioItem = "com-bprivy-ioItem-";
    var eid_opElement = 'com-bprivy-op-'; // ID prefix of an output line of panel
    var eid_userOElement = "com-bprivy-useridO-"; // ID Prefix used by panel elements
	var eid_passOElement = "com-bprivy-passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = "com-bprivy-useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = "com-bprivy-passI-"; // ID Prefix Used by panel elements
	var eid_inForm = "com-bprivy-iform-";
	var eid_tButton = "com-bprivy-tB-"; // ID prefix for IO toggle button
	var eid_xButton = "com-bprivy-xB"; // ID of the panel close button
	var eid_fButton = "com-bprivy-fB"; // ID of the fill fields button

	// CSS Class Names. Visible as value of 'class' attribute in HTML
	// and used as keys in CSS selectors. These need to be globally
	// unique as well. We need these here in order to ensure they're
	// globally unique and also as a single location to map to CSS files.
    var css_class_li = "com-bprivy-li "; // Space at the end allows concatenation
    var css_class_ioFields = "com-bprivy-io-fieldset ";// Space at the end allows concatenation
	var css_class_field ="com-bprivy-field ";// Space at the end allows concatenation
	var css_class_userIn = "com-bprivy-user-in ";// Space at the end allows concatenation
    var css_class_userOut = "com-bprivy-user-out ";// Space at the end allows concatenation
    var css_class_passIn = "com-bprivy-pass-in ";// Space at the end allows concatenation
	var css_class_passOut = "com-bprivy-pass-out ";// Space at the end allows concatenation
	var css_class_tButton = "com-bprivy-tB ";
	
	// These are 'data' attribute names. If implemented as jQuery data
	// these won't manifest as HTML content attributes, hence won't
	// clash with other HTML elements. However, their names could clash
	// with jQuery. Hence they are placed here so that they maybe easily
	// changed if needed.
	var prop_value = "bpValue";
	var prop_dataType = "bpDataType";
	var prop_peerID = 'bpPeerID';
	var prop_panelID = 'bpPanelID';
	var prop_ctx = 'bpPanelCtx';
    var CT_TEXT_PLAIN = 'text/plain';
    var CT_BP_PREFIX = 'application/x-bprivy-';
    var CT_BP_DT = CT_BP_PREFIX + 'dt';
    var CT_BP_PASS = CT_BP_PREFIX + ft_pass;
    var CT_BP_USERID = CT_BP_PREFIX + ft_userid;

    // Other Globals
    var g_doc = g_win.document;
    var g_loc = g_doc.location;
    var g_ioItemID = 0;
    var u_cir_s = '\u24E2';
    var u_cir_S = '\u24C8';
    var u_cir_e = '\u24D4';
    var u_cir_E = '\u24BA';
    var u_cir_F = '\u24BB';
    var u_cir_X = '\u24CD';
    
    // Object sent by BP_MOD_CS
    // = {doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db, autoFill: autoFill, autoFillable: autoFillable}
    var g_ctx;
    /** @globals-end **/
      
	function createImageElement(imgPath)
	{
		var el = g_doc.createElement("img");
		el.src = getURL(imgPath);
		
		return el;
	}
	
    function makeDataDraggable2(ctx, j_panelList) // ctx saved in g_ctx
    {
        //var dnd = ctx.dnd;
        function handleDragStart (e)
        {
            //console.info("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = $(e.target).data(prop_value);
            if ($(e.target).data(prop_dataType) === ft_pass) {
                data = decrypt(data);
            }
            
            e.dataTransfer.items.add('', CT_BP_PREFIX + $(e.target).data(prop_dataType)); // Keep this on top for quick matching later
            e.dataTransfer.items.add($(e.target).data(prop_dataType), CT_BP_DT); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, CT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(createImageElement("icon16.png"), 0, 0);
            //e.dataTransfer.addElement(e.target); Not supported in Google-Chrome
            //dnd.draggedElementID = e.target.id;
            //dnd.draggedElement = e.target;
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        function handleDrag(e)
        {
            //console.info("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }
        
        addEventListener(j_panelList[0], 'dragstart', handleDragStart);
        addEventListener(j_panelList[0], 'drag', handleDrag);

        function handleDragEnd(e)
        {
            //console.info("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //dnd.draggedElementID = null;
            //dnd.draggedElement = null;
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        addEventListener(j_panelList[0], 'dragend', handleDragEnd);
    }
    
    function createOpItem(doc, id, u, p)
	{
	    var opid = eid_opElement + id;
	    var ueid = eid_userOElement + id;
	    var peid = eid_passOElement + id;
	    
        var j_div = $(doc.createElement("div")).attr(
            {
                id: opid
                //style: BP_MOD_CSS.style_ioFields
            }
        ).addClass(css_class_ioFields);

        var j_opu = $(doc.createElement('span')).attr(
            {draggable: true,
             id: ueid,
             name: ueid
             //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_userOut
             }
            ).addClass(css_class_field+css_class_userOut).text(u);
        j_opu.data(prop_dataType, ft_userid).data(prop_value, u);

        var j_opp = $(doc.createElement('span')).attr(
            {
                draggable: true,
                id: peid,
                name: peid
                //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_passOut
            }
            ).addClass(css_class_field + css_class_passOut).text("*****");
        j_opp.data(prop_dataType, ft_pass).data(prop_value, p);
        
        j_div.append(j_opu).append(j_opp);

        return j_div[0];
	}
	
	function isValidInput(str) { return Boolean(str); } // TODO: Probably need to extend this
	
	/** Creates input fields for the IO Widget **/
	function createInItem(doc, id, u, p)
	{
	    var ifid = eid_inForm + id;
	    var ueid = eid_userIElement + id;
	    var peid = eid_passIElement + id;

        var j_inf = $(doc.createElement('div')).attr({id: ifid, 'class': css_class_ioFields});
        var j_inu = $(doc.createElement('input')).attr(
        {
            type: 'text',
            id: ueid,
            name: ueid,
            value: u || undefined,
            placeholder: 'Username'
            //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_userIn
        }).addClass(css_class_field+css_class_userIn).data(prop_value, u);
        var j_inp = $(doc.createElement('input')).attr(
        {
            type: 'password',
            id: peid,
            name: peid,
            value: p? decrypt(p): undefined,
            placeholder: 'Password'
            //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_passIn
        }).addClass(css_class_field+css_class_passIn).data(prop_value, p);

        j_inf.append(j_inu).append(j_inp);
        
        return j_inf[0];
	}

	/** Toggles the IO Widget **/
	function toggleIO(e)
	{
	    var doc = e.target.ownerDocument; // TODO: Experimenting, was g_doc
        var d = e.target.dataset;
        //console.info("tb clicked" + JSON.stringify(d));
	    var op = doc.getElementById(d.opid),
	        ifm = doc.getElementById(d.ifid),
	        id = d.id, fb = doc.getElementById(d.fbid),
	        parent, col, ue, pe, uo, po;
	    
	    if (op) { // replace draggable text with input form
	        // Save the 'op' values.
	        col = op.children;
	        ue = col[eid_userOElement + id];
	        pe = col[eid_passOElement + id];
	        uo = $(ue).data(prop_value);
	        po = $(pe).data(prop_value);
	        // remove the 'op' item.
	        // Create an 'ifm' item and save the values hidden away somewhere.
	        parent = op.parentElement;
            ifm = createInItem(doc, id, uo, po);
	        if (ifm) {
	            $(ue).removeData(); // removes the jquery .data() cache
	            $(pe).removeData();
	           parent.removeChild(op);
	           parent.appendChild(ifm);
	           $(e.target).text(u_cir_S); // unicode circled s = save
	           $(fb).prop('disabled', true);
	        }
	    }
	    else if (ifm) { // replace input-form with draggable text
	        col = ifm.children;
	        ue = col[eid_userIElement + id];
	        pe = col[eid_passIElement + id];
	        var u = ue.value;
	        var p = encrypt(pe.value);
	       
	        if (!isValidInput(ue.value) || !isValidInput(pe.value)) {return false;}
	        
	        uo = $(ue).data(prop_value);
	        po = $(pe).data(prop_value);
	        // Check if values have changed. If so, save to DB.
	        if ((uo !== u) || (po !== p))
	        {
	            // save to db
	            var pRec = newPRecord(g_loc, Date.now(), u, p);
                // Can't update locally because we only have one DNode locally and
                // that may not be the right one to insert the record into.
	            saveRecord(pRec);
	            if (uo !== u) {
	                // delete the original p-record. Goes to the mothership.
	                // Can't update locally because we only have one DNode locally and
	                // that may not be the right one to insert the record into.
	                deleteRecord({loc: g_loc, userid: uo});
	            }
	        }
	        // Then save the values and create a new 'op' item.
	        parent = ifm.parentElement;
	        op = createOpItem(doc, id, u, p);
	        if (op) {
	            //parent.removeChild(ifm);
	            parent.appendChild(op);// Insert the 'op' item.
	            $(e.target).text(u_cir_E); // unicode circled e = edit
                $(fb).prop('disabled', false);
	        }
	        
	        $(ifm).remove(); // Then remove the 'ifm' item.
	    }

        e.stopPropagation(); // We don't want the enclosing web-page to interefere
        e.preventDefault(); // Causes event to get cancelled if cancellable
        return false; // Causes the event to be cancelled (except mouseover event).
	}

    function fillHandler(e)
    {
        
    }
    
    /** Creates an IO Widget with a Toggle Button and Output Fields **/
    function insertIOItem2 (doc, j_panel, user, pass, bInp)
    {
        var jq = $('#' + eid_panelList, j_panel);
        var id = (++g_ioItemID);
        var liid = eid_ioItem + id;
        var opid = eid_opElement + id;
        var ifid = eid_inForm + id;
        var tbid = eid_tButton + id;
        var fbid = eid_fButton + id;//TODO: define eid_fButton
        
        var j_li = $(doc.createElement("div")).attr({id: liid, class: css_class_li});
        var j_fb = $('<button type="button">').attr(
            {
                'data-opid': opid,
                'data-id': id,
                'data-tbid': tbid,
                id: fbid,
                disabled: true
            }
        ).addClass(css_class_tButton).text(u_cir_F);
        addEventListener(j_fb[0], 'click', fillHandler);//TODO: Define fillHandler
        j_li.append(j_fb);
        
        var j_tb = $('<button type="button">').attr(
            {
                'data-opid': opid,
                'data-ifid': ifid,
                'data-id': id,
                'data-fbid': fbid,
                id: tbid
                //'data-tbid': tbid,
                //style: BP_MOD_CSS.style_tButton
            }
        ).addClass(css_class_tButton);
        addEventListener(j_tb[0], 'click', toggleIO);
        
        j_li.append(j_tb);
        if (!bInp) { // Output Fields
            j_tb.text(u_cir_E); // Unicode circled e = edit
            j_li.append(createOpItem(doc, id, user, pass));
            j_fb.prop('disabled', false);
        }
        else { // Input fields
            j_tb.text(u_cir_S); // unicode circled s = save
            j_li.append(createInItem(doc, id, user, pass));
            j_fb.prop('disabled', true);
        }
        jq.append(j_li);

        // Prevent mousedown from bubbling up; so as to prevent panel dragging by
        // jquery-ui.
        addEventListener(j_li[0], 'mousedown', stopPropagation);
    }
    
    function insertIOItems2(ctx, j_panel)
    {
        var doc = ctx.doc, db = ctx.db,
        i, userids, 
        pRecsMap=db.pRecsMap;
        if (pRecsMap) 
        {
            userids = Object.keys(pRecsMap);
        
            for (i=0; i<userids.length; i++) {
                //var curr = pRecsMap[userids[i]].curr;
                insertIOItem2(doc, j_panel, userids[i], pRecsMap[userids[i]].curr.pass);
            }
        }
        // Finally, create one Input Item for new entry.
        insertIOItem2(doc, j_panel, "","", true);
    }
    
    function insertSettingsPanel(j_panel)
    {
        var ml = '<input type="file" accept=".3db" class="com-bprivy-dbPath" placeholder="Insert DB Path Here" ></input>';
    }
    
    // Delete the control panel. Invoked when the x button is clicked.
    function deletePanel(el)
    {
        if (el)
        {   
            //$(el).data(prop_ctx).db.clear(); //g_db.clear(); // clear the data.
            // Need to do this using jquery so that it will remove $.data of all descendants
            $(el).remove();
        }        
    }
    
    function deletePanelHandler(e)
    {
        if (e)
        {
            var id_panel = $(e.target).data(prop_panelID);
            var el = g_doc.getElementById(id_panel);
            deletePanel(el);
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            return false; // Causes the event to be cancelled (except mouseover event).
        }
    }
    
    // CREATE THE CONTROL-PANEL
    function createPanel(ctx) // ctx saved in g_ctx
    {
        var doc = ctx.doc, id_panel = ctx.id_panel, dnd = ctx.dnd, db = ctx.db,
            j_panel = $(doc.createElement('div')).attr({id: id_panel, style:"display:none"}),
            html =      '<div id="com-bprivy-panelTitle"><div id="com-bprivy-TitleText">BPrivy</div>' +
                            '<button type="button" id="com-bprivy-xB" accesskey="q">'+u_cir_X+'</button>' +
                        '</div>' +
                        '<div id="com-bprivy-panelList"></div>';
        g_ctx = ctx;
        j_panel[0].insertAdjacentHTML('beforeend', html);
        makeDataDraggable2(ctx, $('#'+eid_panelList,j_panel));
        var j_xButton = $('#'+eid_xButton, j_panel).data(prop_panelID, id_panel);
        addEventListener(j_xButton[0], 'click', deletePanelHandler);
        insertSettingsPanel(j_panel);
        insertIOItems2(ctx, j_panel);

        doc.body.appendChild(j_panel[0]);
        // Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
        // by setting position:relative. Also we can use right:0px here because draggable() does not like it.
        // Hence we need to calculate the left value :(         
        var panelW = j_panel.outerWidth();
        var winW = doc.body.clientWidth || $(doc.body).innerWidth();
        
        var left = (winW-panelW);
        left = (left>0)? left: 0;
        
        console.info("WinW = " + winW + " panelW = " + panelW);

        //j_panel.css({position: 'fixed', top: '0px', 'left': left + "px"});
        j_panel.css({position: 'fixed', top: '0px', 'right': "0px"});
        
        // Make it draggable after all above mentioned style properties have been applied to the element.
        // Otherwise draggable() will override those properties.
        j_panel.draggable();

        return j_panel;
    }

    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        createPanel: {value: createPanel},
        deletePanel: {value: deletePanel},
        eid_panel: {value: eid_panel},
        prop_value: {value: prop_value},
        prop_dataType: {value: prop_dataType},
        prop_peerID: {value: prop_peerID},
        CT_BP_DT: {value: CT_BP_DT},
        CT_TEXT_PLAIN: {value: CT_TEXT_PLAIN},
        CT_BP_PREFIX: {value: CT_BP_PREFIX}
    });
    Object.freeze(iface);

    return iface;

}(window));
/** @ModuleEnd */

var BP_MOD_CS = (function(g_win)
{
    'use strict';
    /** @export-module-begin */
    var g_dnd = {};
    var g_db = {
        ingest: function(db) {
            if (db) {
                this.pRecsMap = db.pRecsMap; 
                this.eRecsMapArray = db.eRecsMapArray;
                delete this.numUserids;
                if (this.pRecsMap) {
                    this.numUserids = Object.keys(this.pRecsMap).length;
                }
                else {
                    this.numUserids = 0;
                }
                Object.defineProperty(this, "numUserids", {writable: false, configurable:true, enumerable:true});
            }
        },
        clear: function() {
            var keys = Object.keys(this), n;
            for (n=keys.length-1; n > 0; n--) {
                delete this[keys[n]];
            }
        }
    };
    Object.defineProperties(g_db,
        {
            ingest: {enumerable:false, writable:false, configurable:false},
            clear: {enumerable:false, writable:false, configurable:false}
        });
    /** Returns true if the BPrivy control panel should be created in the supplied browsing context */
    function isTopLevel(win) {
        return (win.top === win.self);
    }
    var BP_MOD_CS = {};
    Object.defineProperties(BP_MOD_CS, 
    {
        g_dnd: {value: g_dnd, enumerable:true},
        g_db: {value: g_db, enumerable:true}
    });
    Object.freeze(BP_MOD_CS);
    /** @export-module-end **/
   
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var encrypt = IMPORT(m.encrypt);
    var decrypt = IMPORT(m.decrypt);
    var stopPropagation = IMPORT(m.stopPropagation);
    var preventDefault = IMPORT(m.preventDefault);    
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs);
    var deleteRecord = IMPORT(m.deleteRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var newERecord = IMPORT(m.newERecord);
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    /** @import-module-begin Panel */
    m = BP_MOD_PANEL;
    var createPanel = IMPORT(m.createPanel);
    var deletePanel = IMPORT(m.deletePanel);
    // Since there is only one panel, we're using eid_panel as the global panel id.
    var prop_value = IMPORT(m.prop_value);
    var prop_dataType = IMPORT(m.prop_dataType);
    var prop_peerID = IMPORT(m.prop_peerID);
    var CT_BP_DT = IMPORT(m.CT_BP_DT);
    var CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN);
    var CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX);
    /** @import-module-begin W$ */
    var m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.exec);
    var w$get = IMPORT(m.get);
    /** @import-module-begin WDL */
    m = BP_MOD_WDL;
    var cs_panel_wdt = IMPORT(m.cs_panel_wdt);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location);
    var g_doc = IMPORT(g_win.document);
    var gid_panel; // id of created panel if any
    var settings = {AutoFill:true, ShowPanelIfNoFill: false}; // User Settings
    var g_autoFillable; // Indicates that the page was found to be autofillable.
    /** @globals-end **/

    /**
     * Autofills element described by 'er' with string 'str'.
     * if dcrpt is true, then decrypts the data before autofilling.
     */
    function autoFillEl (er, str, dcrpt) {
        var nl, el, doc = g_doc, i, ell = [];
        if (er.id) 
        {
            el = doc.getElementById(er.id);
            if (!el) {el = null;}
        }
        if((el === undefined) && er.name) // (!er.id), therefore search based on field name
        {
            nl = doc.getElementsByName(er.name);

            for (i=0; i<nl.length; i++) 
            {
                if (nl.item(i).tagName !== er.tagName) {
                        continue;
                }
                if ((er.type) && 
                    (nl.item(i).type !== er.type)) {
                        continue;
                }
                ell.push(nl.item(i));
            }
            
            // if (ell.length === 1) {                // el = ell[0];            // }            // else {                // el = null;            // }
            if (ell.length > 0) {
                // One or more elements had the same name,type and tagName. We'll fill
                // them all because this is probably a pattern wherein alternate forms are
                // declared on the page for the same purpose but different environments
                // e.g. with JS/ without JS (twitter has such a page).
                el = ell[0];
            }
            else {
                el = null;
            }
        }

        if (el) {
            // We found the element(s). AutoFill it/them. We're assuming that it is an 'input'
            // element, hence values will go into its .value IDL attribute. If we start filling
            // other elements (such as textarea) then this assumption won't hold anymore.
            el.value = dcrpt ? decrypt(str) : str;
            if (ell.length > 1) {
                for (i=1; i<ell.length; i++)
                {
                    ell[i].value = dcrpt ? decrypt(str) : str;
                }
            }
            return true;
        }
    }
    

    function autoFill(userid, pass) // if arguments are not supplied, takes them from global
    {
        var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone, pRecsMap;
        // auto-fill
        // if we don't have a stored username/password, then there is nothing
        // to autofill.
        
        if (userid && pass) {
            u = userid; p = pass;
        }
        else if ((pRecsMap = g_db.pRecsMap)) 
        {
            ua = Object.keys(pRecsMap); 
            if (ua) {
                if (ua.length === 1) {
                    u = ua[0];
                    p = pRecsMap[ua[0]].curr.pass;
                }
                else if (ua.length > 1) {
                    // if there is more than one username, do not autofill, but
                    // try to determine if autofilling is possible.
                    u = "";
                    p = "";
                }
            }
        }
        
        if ((u!==undefined) && (p!==undefined) && (g_db.eRecsMapArray)) 
        {
            // Cycle through eRecords starting with the
            // best URL matching node.
            l = g_db.eRecsMapArray.length; uDone=false; pDone=false;
            for (i=0; (i<l) && (!pDone) && (!uDone); ++i) {
                eRecsMap = g_db.eRecsMapArray.pop();
                
                if (eRecsMap[ft_userid]) { uer = eRecsMap[ft_userid].curr;}
                if (eRecsMap[ft_pass]) {per = eRecsMap[ft_pass].curr;}
                if ((!uDone) && uer) {
                    uDone = autoFillEl(uer, u);
                    if (!uDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.
                      
                        // Location gets deleted from e-rec when it is
                        // inserted into the DB. Therefore we'll need to
                        // put it back in.
                        uer.loc = g_loc; // TODO: This may not be required anymore.

                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(uer); // TODO: implement deleteRecord
                    }
                }
                if ((!pDone) && per) {
                    pDone = autoFillEl(per, p, true);
                    if (!pDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.

                        // Location gets deleted from e-rec when it is
                        // inserted into the DB. Therefore we'll need to
                        // put it back in.
                        per.loc = g_loc; // TODO: This may not be required anymore.

                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(per); // TODO: implement deleteRecord
                    }
                }
            }
        }  

        if (uDone || pDone) {
            g_autoFillable = true;
            return true;
        }
    }
       
/*
    function autoFill()
    {
        var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone,
        // auto-fill
        // if we don't have a stored username/password, then there is nothing
        // to autofill.
        pRecsMap  = g_db.pRecsMap;
        if (pRecsMap) 
        {
            ua = Object.keys(pRecsMap); 
            // if there is more than one username, do not autofill
            if (ua && (ua.length === 1) && (g_db.eRecsMapArray)) 
            {
                // Cycle through eRecords starting with the
                // best URL matching node.
                l = g_db.eRecsMapArray.length; uDone=false; pDone=false;
                for (i=0; (i<l) && (!pDone) && (!uDone); ++i) {
                    eRecsMap = g_db.eRecsMapArray.pop();
                    
                    if (eRecsMap[ft_userid]) { uer = eRecsMap[ft_userid].curr;}
                    if (eRecsMap[ft_pass]) {per = eRecsMap[ft_pass].curr;}
                    if ((!uDone) && uer) {
                        u = ua[0];
                        uDone = autoFillEl(uer, u);
                        if (!uDone && (i===0)) {
                            // The data in the E-Record was an exact URL match
                            // yet, it has been shown to be not useful.
                            // Therefore purge it form the K-DB.
                          
                            // Location gets deleted from e-rec when it is
                            // inserted into the DB. Therefore we'll need to
                            // put it back in.
                            uer.loc = g_loc; // TODO: This may not be required anymore.

                            // TODO: Can't assume that i===0 implies full url match.
                            // Need to construct a URLA from uer.loc and compare it with
                            // g_loc. Commenting out for the time being.
                            //deleteRecord(uer); // TODO: implement deleteRecord
                        }
                    }
                    if ((!pDone) && per) {
                        p = pRecsMap[ua[0]].curr.pass;
                        pDone = autoFillEl(per, p, true);
                        if (!pDone && (i===0)) {
                            // The data in the E-Record was an exact URL match
                            // yet, it has been shown to be not useful.
                            // Therefore purge it form the K-DB.

                            // Location gets deleted from e-rec when it is
                            // inserted into the DB. Therefore we'll need to
                            // put it back in.
                            per.loc = g_loc; // TODO: This may not be required anymore.

                            // TODO: Can't assume that i===0 implies full url match.
                            // Need to construct a URLA from uer.loc and compare it with
                            // g_loc. Commenting out for the time being.
                            //deleteRecord(per); // TODO: implement deleteRecord
                        }
                    }
                }
            }  
        }
        
        if (uDone && pDone) {
            return true;
        }
    }*/

       
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function initialGetDB (resp)
    {   
        var filled;
        if (resp.result === true) 
        {
            var db = resp.db;
            console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(db));
            g_db.ingest(db);
            filled = autoFill();
        
            if (settings.AutoFill) {
                if ((filled===false) && g_db.numUserids && settings.ShowPanelIfNoFill)
                {
                    var panel = w$exec(cs_panel_wdt, {it: new PREC_TRAITS.it(g_db.pRecsMap)});
                    gid_panel = panel.data.id;
                    //createPanel({doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db}).show();
                }
            }
        }
        else
        {
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.warn("bp_cs.js@init " + exc.toString() + "]");
        }        
    }
    
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function asyncShowPanel (resp)
    {
        if (resp.result === true)
        {
            var db = resp.db;
            console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(db));
            g_db.ingest(db);
        }
        else
        {
            g_db.clear();
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.warn("bp_cs.js@showPanel " + exc.toString() + "]");
        }

        // TODO: Since this is async, maybe we should check if the panel already exists?
        //createPanel({doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db, autoFill: autoFill, autoFillable: g_autoFillable}).show();
        var panel = w$exec(cs_panel_wdt);
        gid_panel = panel.id;
    }
   
    function clickBP (request, sender, sendResponse)
    {
        if(isTopLevel(g_win)) 
        {
            var panel;
            // var el = g_doc.getElementById(gid_panel);            // if (el)            // {                // // Need to do this using jquery so that it cleans up all related $.data attrs                // $(el).remove();            // }
            if (gid_panel && (panel = w$get(gid_panel))) {
                panel.die();
                gid_panel = null;
            }
            else {
                // Post a message to MemStore to retrieve the set of recs afresh.
                getRecs(g_win.location, asyncShowPanel);
            }
        }
        
        sendResponse({});
    }

    function findPeerElement(el)
    {}
    
    function autoFillPeer(el, data)
    {
        var p_el = findPeerElement(el);
        if (p_el)
        {
            if (data.type() === ft_pass) {
                p_el.value = decrypt(data);
            }
            else {
                p_el.value = data;
            }
        }
    }
    
    /** Intelligently returns true if the input element is a userid/username input field */
    function isUserid(el)
     {
         var tagName = el.tagName.toLowerCase(), rval = false;
         if (tagName === 'textarea') {rval = true;}
         else if (tagName !== 'input') {rval = false;}
         else {
             if (el.type)
                {rval = (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");}
             else
                 {rval = true;} // text type by default
         }
         
         return rval;
     }
    
    /** Intelligently returns true if the element is a password field */
    function isPassword (el)
     {
         if (el.tagName.toLowerCase() !== 'input') {return false;}
        return (el.type === "password");
     }

    function isFieldType (ft, el)
    {
        switch (ft)
        {
            case ft_userid: return isUserid(el);
            case ft_pass: return isPassword(el);
            default: return;
        }
    }
    
    function matchDTwField(e)
    {
        var dtMatched = false, isBPDrag = false, 
        items = e.dataTransfer.items, pn=CT_BP_PREFIX + $(e.target).data(prop_dataType),
        n;
        for (n=items.length-1; n>=0; n--)
        {
            if (items[n] && items[n].type === pn) {
                dtMatched = true; isBPDrag = true;
                console.info("Matched BP Drag w/ Field !");
                break;
            }
            else if ((!isBPDrag) && items[n] && items[n].type === CT_BP_DT) {
                isBPDrag = true;
                console.info("Matched BP Drag !");
            }
        }
        
        return {dtMatched: dtMatched, isBPDrag: isBPDrag};        
    }
    
    function dragoverHandler(e)
    {
        //console.info("dragoverHandler(type = " + e.type + ") invoked ! effectAllowed/dropEffect = " +
        //                e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);

        var r = matchDTwField(e);
        if (r.isBPDrag)
        {
            if (r.dtMatched) {
                e.dataTransfer.dropEffect= 'copy';
            }
            else {
                e.dataTransfer.dropEffect = 'none'; // Prevent drop here.
            }
            
            //console.info("dropEffect set to " + e.dataTransfer.dropEffect);
            e.preventDefault(); // cancel the event signalling that we've handled it.
            e.stopImmediatePropagation();
        }
        //return true; // return true to signal that we're not cancelling the event (some code out there)
    }
    
    function dropHandler(e)
    {
        //console.info("dropHandler invoked ! effectAllowed/dropEffect = " + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
 
        var data, r = matchDTwField(e);
        
        if (r.isBPDrag) {
            // Cancel event to tell browser that we've handled it and to prevent it from
            // overriding us with a default action.                        
            e.preventDefault();
            
            if (!r.dtMatched) {
                // This is our drag-event, but Data-type and field-type don't match.
                // Abort the drop.
                // prevent browser from dropping the password into a visible field.
                // or prevent browser from dropping userid into a password field.
                e.dataTransfer.dropEffect = 'none';                    
            }                     
            else {
                // Tell browser to set vlaue of 'current drag operation' to 'copy'
                e.dataTransfer.dropEffect = 'copy';

                // Save an ERecord.
                var eRec = newERecord(e.target.ownerDocument.location,
                                      Date.now(),
                                      e.dataTransfer.getData(CT_BP_DT), // fieldType
                                      e.target.tagName,
                                      e.target.id,
                                      e.target.name,
                                      e.target.type);
                // eRec.tagName = e.target.tagName;                // eRec.id = e.target.id;                // eRec.name = e.target.name;                // eRec.type = e.target.type;                // eRec.fieldType = e.dataTransfer.getData(CT_BP_DT);                // //could this lead to a security issue? should we use g_doc instead?                // eRec.loc = e.target.ownerDocument.location;
                saveRecord(eRec);

                data = e.dataTransfer.getData(CT_TEXT_PLAIN);
                if (data) {
                    e.target.value = data;
                }
            }
        }
        // console.info("dropEffect set to " + e.dataTransfer.dropEffect);
    }

    function setupDNDWatchers(win)
    {
        function inputHandler(e)
        {
            // console.info("inputHandler invoked");
            var eRec, dragged_el;
            if (g_dnd.draggedElementID) {
                //dragged_el = g_doc.getElementById(g_dnd.draggedElementID);
                dragged_el = g_dnd.draggedElement;
                // console.info("DraggedElementID is " + g_dnd.draggedElementID);
            }
            // else {
                // console.info("DraggedElementID is null");
            // }
            
            if ( dragged_el && ($(dragged_el).data(prop_value) === e.target.value))
            {
                eRec = newERecord(g_doc.location,
                                 Date.now(),
                                 $(dragged_el).data(prop_dataType),//fieldType
                                 e.target.tagName,
                                 e.target.id,
                                 e.target.name,
                                 e.target.type);
                // eRec.tagName = e.target.tagName;                // eRec.id = e.target.id;                // eRec.name = e.target.name;                // eRec.type = e.target.type;                // eRec.fieldType = $(dragged_el).data(prop_dataType);                // eRec.loc = g_doc.location;
                                
                saveRecord(eRec);
                
                var p = $(dragged_el).data(prop_peerID);
                if (p) {
                    autoFillPeer(e.target, $(p).data(prop_value));
                }
                // console.info("Linking elements " + g_dnd.draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
            }
        }
        
        //$(g_doc.getElementsByTagName('input')).each(function(i, el) {
        $('input').each(function(i, el)
        {
            var u;
            if ( (u = isUserid(el)) || isPassword(el)) {
                //addEventListener(el, "input", inputHandler);
                addEventListener(el, "dragenter", dragoverHandler);
                addEventListener(el, "dragover", dragoverHandler);
                addEventListener(el, "drop", dropHandler);
                if (u) {
                    $(el).data(prop_dataType, ft_userid);
                } else {
                    $(el).data(prop_dataType, ft_pass);
                }
                // console.log("Added event listener for element " + el.id +
                // "/" + el.name);
            }
        }); 
    }
    
    function main()
    {
        if(isTopLevel(g_win)) 
        {
            console.log("BP_CS entered on page " + location.href);
            getRecs(g_win.location, initialGetDB);
            registerMsgListener(clickBP);
            setupDNDWatchers(g_win);
        }
    }
    
    return main();
    
    // Following are not being used.
    // function isDocVisible(document) {
        // /*properties is */
        // return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
    // }
// 
    // function isFrameVisible(frame)
    // {
        // var retval = true;
        // console.info("Entered IsFrameVisible");
        // if (frame.hidden) {
            // retval = false;
        // }
        // else if (!frame.style) {
            // retval = true;
        // }
        // else// frame.style exists
        // {
            // if(frame.style.visibility && frame.style.visibility === 'hidden') {
                // retval = false;
            // }
            // else if(frame.style.display && frame.style.display === 'none') {
                // retval = false;
            // }
        // }
// 
        // console.info("Exiting IsFrameVisible");
        // return retval;
    // }

}(window));
