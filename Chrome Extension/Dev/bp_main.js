/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, BP_MOD_PLAT, BP_GET_CONNECT, BP_GET_COMMON, IMPORT, localStorage,
  BP_GET_MEMSTORE, BP_GET_DBFS, BP_GET_FILESTORE, BP_GET_ERROR, BP_GET_TRAITS,
  BP_GET_CS_PLAT, BP_GET_PLAT, BP_GET_LISTENER, BP_GET_W$, BP_GET_WDL, chrome,
  webkitNotifications */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin NTNF_CNTR
 */
function BP_GET_NTNF_CNTR(g)
{   'use strict';
    var window = null, document = null, console = null;

    /** @import-module-begin */
    var BP_ERROR    = IMPORT(g.BP_ERROR),
        BPError     = IMPORT(BP_ERROR.BPError);
    var BP_COMMON   = IMPORT(g.BP_COMMON);
    var MEMSTORE    = IMPORT(g.BP_MEMSTORE);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_CONNECT  = IMPORT(g.BP_CONNECT),
        dt_pRecord  = IMPORT(BP_CONNECT.dt_pRecord);
    var BP_PLAT     = IMPORT(g.BP_PLAT);
    /** @import-module-end **/

    /** @globals-begin */
    var g_notification;
    /** @globals-end **/

    function onClose(ev)
    {
        BP_ERROR.loginfo('BP_NTFN_CNTR: onClose invoked');
        g_notification = null;
    }

    /*function create()
    {
        g_notification = BP_PLAT.notifications.createHTMLNotification(
          'bp_notification.html'  // html url - can be relative
        );
        g_notification.onerror = onClose;
        g_notification.onclose = onClose;
        g_notification.onclick = onClose;
        g_notification.show();                
    }*/
    
    function onChange(ev)
    {
        /*if (!g_notification) {
            if (ev.detail.drec && ev.detail.drec.actn && ev.detail.drec.actn.a !== 'd') {
                create();
            }
        }*/
    }
    
    function init()
    {
        BPError.push('InitNotifications');
        var scope = new BP_LISTENER.Scope('temp_' + dt_pRecord, dt_pRecord);
        var cback = new BP_LISTENER.CallbackInfo(onChange);
        MEMSTORE.Event.listen('bp_change', scope, cback);
    }
    
    function dispatch(eventType, tabId, loc)
    {
        switch(eventType)
        {
            case 'bp_boot_loaded':
                if (!loc.protocol || (loc.protocol.indexOf('http')!==0)) {break;}
                if (MEMSTORE.numTRecs(loc, true)) {
                    BP_PLAT.showBadge({tabId:tabId, title:"You have unsaved passwords. Click here to see them.", text:'save'});
                }
                break;
            case 'bp_saved_temp':
                if (MEMSTORE.numTRecs(loc, true)) {
                    BP_PLAT.showBadge({tabId:tabId, title:"You have unsaved passwords. Click here to see them.", text:'save'});
                }
                else {
                    BP_PLAT.removeBadge({tabId:tabId});
                }
                break;
        }
       
    }

    return Object.freeze(
    {
        init: init,
        Event: {
            dispatch: dispatch
        }
    });
}
var BP_PLUGIN;
/** @globals-end */

var BP_MAIN = (function()
{
    "use strict";
    var g = {g_win:window, 
             g_console:console, 
             g_chrome:chrome, 
             webkitNotifications: webkitNotifications},
        g_doc = document;

    g.BP_ERROR = BP_GET_ERROR(g);
    g.BP_COMMON = BP_GET_COMMON(g);
    g.BP_TRAITS = BP_GET_TRAITS(g);
    g.BP_PLAT = BP_GET_PLAT(g);
    g.BP_LISTENER = BP_GET_LISTENER(g);
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    g.BP_CONNECT = BP_GET_CONNECT(g);
    g.BP_MEMSTORE = BP_GET_MEMSTORE(g);
    g.BP_DBFS = BP_GET_DBFS(g);
    g.BP_FILESTORE = BP_GET_FILESTORE(g);
    g.BP_NTFN_CNTR= BP_GET_NTNF_CNTR(g);
    // These are for use by panel.js
    g.BP_W$ = BP_GET_W$(g);
    g.BP_WDL = BP_GET_WDL(g);

    /** @import-module-begin MainPlatform */
    var m = g.BP_PLAT,
        BP_PLAT = IMPORT(m);
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var initScaffolding = IMPORT(m.initScaffolding);
    /** @import-module-begin **/
    m = g.BP_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin Connector */
    m = g.BP_CONNECT;
    var BP_CONNECT = IMPORT(g.BP_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var cm_loadDB = IMPORT(m.cm_loadDB);
    var cm_mergeInDB = IMPORT(m.cm_mergeInDB);
    var cm_createDB = IMPORT(m.cm_createDB);
    var cm_getDBPath = IMPORT(m.cm_getDBPath);
    /** @import-module-begin MemStore */
    m = g.BP_MEMSTORE;
    var MEMSTORE = IMPORT(m),
        MOD_ETLD = IMPORT(m.MOD_ETLD);
    var FILE_STORE = IMPORT(g.BP_FILESTORE);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = g.BP_ERROR.BPError,
        Activity = g.BP_ERROR.Activity;
    /** @import-module-begin */
    var DBFS = IMPORT(g.BP_DBFS);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_NTFN_CNTR = IMPORT(g.BP_NTFN_CNTR);
    /** @import-module-end **/    m = null;

    var MOD_WIN; // defined later.
    var g_forms = {}; // Form submissions to look out for
    
    /**
     * Invoked when a new record - eRec or pRec - is generated by the user. This is not
     * invoked for bulk-loads like loadDB, importCSV or mergeDB.
     * @param {Object} rq Request received from BP_CONNECT
     */
    function insertNewRec(rec, dt)
    {
        var res, dr, root, dnode;

        if (!DBFS.getDBPath()) {throw new BPError("", 'UserError', 'NoDBLoaded');}

        switch (dt)
        {
            case dt_eRecord:
            case dt_pRecord:
                dr = MEMSTORE.insertRec(rec, dt);
                if (dr) {
                    res = true;
                    if (MEMSTORE.DT_TRAITS.getTraits(dt).toPersist(dr.notes) &&
                        FILE_STORE.UC_TRAITS.insertNewRec.toPersist(dr.notes))
                    {
                        res = FILE_STORE.insertRec(rec, dt);
                    }
                }
                break;
            default: // do nothing
        }
        
        return res ? dr : undefined;
    }
    
    function makeDashResp(result)
    {
        return {
            result: result,
            dbName:DBFS.getDBName(),
            dbPath:DBFS.getDBPath(),
            dbStats:DBFS.getDBStats(),
            memStats:MEMSTORE.getStats()
        };
    }
    
    function getRecs (loc, callback)
    {
        var recs, resp={loc:loc};
        recs = MEMSTORE.getRecs(loc);
        resp.dbInfo = {
            dbName : DBFS.getDBName(),
            dbPath : DBFS.getDBPath()
        };
        resp.db = recs;
        resp.result = true;
        if (callback) {
            callback(resp);
        }
        return resp;
    }
    
    function saveRecord(rec, dt, callback, dontGet, _/*tabId*/)
    {
        var dr, resp, recs;
        dr = insertNewRec(rec, dt);
        if (dr && (!dontGet)) {
            recs = MEMSTORE.getDTRecs(BP_CONNECT.lToLoc(rec.l), dt);
        }
        resp = {result:Boolean(dr), recs:recs};
        if (callback) {callback(resp);}
        
        if (dr) { // event dispatch
            MEMSTORE.Event.dispatch(dr);
        }
        return resp;
    }
    
    function saveTempRec(rec, dt, callback, dontGet, tabId)
    {
        var notes, result, resp, recs, loc, dr, dnode, root;
        if (DBFS.getDBPath()) 
        {
            dr = MEMSTORE.insertTempRec(rec, dt);
            loc = BP_CONNECT.lToLoc(rec.l);
            if (!dontGet) {
                recs = MEMSTORE.getTRecs(loc);
            }
            result = true;
        }
        else {result = false;}
        resp = {result:result, recs:recs};
        if (callback) {callback(resp);}
        if (dr) { // event dispatch
            BP_NTFN_CNTR.Event.dispatch('bp_saved_temp', tabId, loc);
            MEMSTORE.Event.dispatch(dr);
        }
        return resp;
    }
    
    function sendDelActn(_rec, dt, callback, dontGet, toTemp, tabId)
    {
        var del = BP_CONNECT.getDTProto(dt).newDelActn.apply(_rec);
        //BP_ERROR.logdebug('Producing Delete Action' + (toTemp?' to temp: ':': ') + JSON.stringify(del));
        if (toTemp) {
            saveTempRec(del, dt, callback, dontGet, tabId);
        }
        else {
            saveRecord(del, dt, callback, dontGet, tabId);                
        }
    }
    
    function getDBPath(callback)
    {
        var resp = makeDashResp(true),
            dbPath = DBFS.getDBPath();
            
        if (callback) {callback(resp);}
        return resp;
    }
     
    function onBefReq(details)
    {
        if (g_forms[details.url]) {
            window.alert("onBefReq: " + details.url);
            //delete g_forms[details.url];
        }
        // else {
            // console.log("onBefReq: " + details.url);
        // }
    }
    
    function onRequest(rq, sender, funcSendResponse)
    {
        var result, recs, dbPath, dbStats, fnames, notes,
            cm = rq.cm,
            bSaveRec;
        //BP_ERROR.loginfo("onRequest: " + cm + (rq.dt ? (" dt="+rq.dt) : ""));
        
        rq.atvt ? (BPError.atvt = new Activity(rq.atvt)) : (BPError.atvt = new Activity("BPMain::OnRequest"));
        
        try  {
            switch (cm) {
                case BP_CONNECT.cm_saveRec:
                    BPError.push("SaveRecord" + rq.dt);
                    bSaveRec = true;
                    saveRecord(rq.rec, rq.dt, funcSendResponse, rq.dontGet, sender.tab.id);
                    break;
                case BP_CONNECT.cm_tempRec:
                    BPError.push("SaveTempRecord" + rq.dt);
                    saveTempRec(rq.rec, rq.dt, funcSendResponse, rq.dontGet, sender.tab.id);
                    
                    break;
                case 'cm_bootLoaded':
                    BPError.push("CSBootLoaded");
                    //BP_PLAT.showPageAction(sender.tab.id);
                    //funcSendResponse({result:true, cm:((MEMSTORE.numTRecs(rq.loc, true)) ? 'cm_loadDll' : undefined) });
                    funcSendResponse({result:true});
                    BP_NTFN_CNTR.Event.dispatch('bp_boot_loaded', sender.tab.id, rq.loc);
                    break;
                case cm_getRecs:
                    BPError.push("GetRecs");
                    MOD_WIN.putTab(sender.tab.id);
                    chrome.pageAction.show(sender.tab.id);
                    funcSendResponse(getRecs(rq.loc));
                    break;
                case cm_loadDB:
                    BPError.push("LoadDB");
                    dbPath = FILE_STORE.loadDB(rq.dbPath);
                    funcSendResponse(makeDashResp(Boolean(dbPath)));
                    break;
                case BP_CONNECT.cm_unloadDB:
                    BPError.push("UnloadDB");
                    dbPath = FILE_STORE.unloadDB();
                    funcSendResponse(makeDashResp(true));
                    break;
                case BP_CONNECT.cm_mergeInDB:
                    BPError.push("MergeInDB");
                    result = FILE_STORE.mergeInDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_mergeOutDB:
                    BPError.push("MergeOutDB");
                    result = FILE_STORE.mergeOutDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_mergeDB:
                    BPError.push("MergeDB");
                    result = FILE_STORE.mergeDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_compactDB:
                    BPError.push("CompactDB");
                    dbPath = FILE_STORE.compactDB();
                    funcSendResponse(makeDashResp(Boolean(dbPath)));
                    break;
                case BP_CONNECT.cm_cleanDB:
                    BPError.push("CleanDB");
                    dbStats = FILE_STORE.cleanLoadDB();
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_createDB:
                    BPError.push("CreateDB");
                    dbPath = FILE_STORE.createDB(rq.dbName, rq.dbDir);
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_getDBPath:
                    BPError.push("GetDBPath");
                    funcSendResponse(getDBPath());
                    break;
                case BP_CONNECT.cm_importCSV:
                    BPError.push("ImportCSV");
                    result = FILE_STORE.importCSV(rq.dbPath, rq.obfuscated);
                    funcSendResponse(makeDashResp(result));                        
                    break;
                case BP_CONNECT.cm_exportCSV:
                    BPError.push("ExportCSV");
                    fnames = FILE_STORE.exportCSV(rq.dirPath, rq.obfuscated);
                    funcSendResponse({result: (fnames.length>0), 'fnames':fnames});
                    break;
                case BP_CONNECT.cm_getDB:
                    BPError.push("GetDB");
                    funcSendResponse({result:true, dB:MEMSTORE.getDB(rq.dt)});
                    break;
                case BP_CONNECT.cm_getDN:
                    BPError.push("GetDNode");
                    funcSendResponse({result:true, dN:MEMSTORE.getDNode(rq.l, rq.dt)});
                    break;
                case BP_CONNECT.cm_getDomn:
                    BPError.push("GetDomain");
                    funcSendResponse({result:true, domn:MOD_ETLD.getDomain(rq.loc)});
                    break;
                case BP_CONNECT.cm_closed:
                    BPError.push("PanelClosed");
                    MOD_WIN.rmTab(sender.tab.id);
                    funcSendResponse({result:true});
                    break;
                case "form":
                    BPError.push("FormSubmit");
                    console.log("Form Submitted: " + JSON.stringify(rq.form));
                    try 
                    {
                        // Needed because the page would've reloaded by now and therefore
                        // we'll get a invalid-port exception.
                        funcSendResponse({result:true});
                    }
                    catch (err) {BP_ERROR.log(err);}
                    break;
                case "watchF":
                    BPError.push("WatchForm");
                    console.log("Watching Form: "+rq.url);
                    g_forms[rq.url] = true;
                    break;
                default: // do nothing
            }
        } 
        catch (err) 
        {
            BP_ERROR.logwarn(err);
            if (bSaveRec) {FILE_STORE.unloadDB();} // Seems that we lost DB-connection
            var resp = makeDashResp(false);
            resp.err = new BPError(err);
            funcSendResponse(resp);
        }
    }

    /**
     * @defun-mod MOD_WIN 
     */
    MOD_WIN = (function()
    {
        var g_tabs = {};

        function clickReq (url)
        {
            //return getRecs(BP_COMMON.parseURL(url));
            return {};
        }
        
        function clickResp (url) 
        {
            if (g_tabs[url]) {
                delete g_tabs[url];
            }
            else {
                g_tabs[url] = true;
            }
        }
        
        function putTab (id)
        {
            g_tabs[id] = true;
        }
        
        function rmTab (id)
        {
            delete g_tabs[id];
        }

        return Object.freeze (
        {
            clickReq: clickReq,
            clickResp: clickResp,
            rmTab: rmTab,
            putTab: putTab
        });
    }());

    function init() 
    {
        var dbPath;

        function bpPluginLoaded ()
        { "use strict";
          BP_PLUGIN = g_doc.getElementById('com-untrix-bpplugin');
          if (!BP_PLUGIN.getpid) {
              BP_ERROR.warn(
                  "UWallet: Sorry, you either haven't installed the BPrivy plugin or your"+
                  " operating system is not supported. Please install the plugin from "+
                  "http://www.untrix.com/downloads, then restart your browser'");
              throw new BPError("Plugin Not Loaded");
          }
          BP_ERROR.logdebug("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
        }
        
        try
        {
            bpPluginLoaded();
            dbPath = localStorage["db.path"];
            initScaffolding(g_doc, MOD_WIN);
            registerMsgListener(onRequest);
            DBFS.init();
            MEMSTORE.loadETLD();
            MEMSTORE.clear();
            if (dbPath)
            {
                BPError.atvt = new Activity('LoadDBAtInit');
                dbPath = FILE_STORE.loadDB(dbPath);
    
                if (!dbPath) { // db-load failed
                    throw new BPError("DB Load Failed");
                }
            }
            // Initialize notifications after everything has loaded.
            BP_NTFN_CNTR.init();
            //chrome.webRequest.onBeforeRequest.addListener(onBefReq, {urls:["http://*/*", "https://*/*"]});
        
            // chrome.tabs.onSelectionChanged.addListener(function(tabId) 
            // {
                // chrome.pageAction.show(tabId);
            // });        } 
        catch (e)
        {
            delete localStorage['db.path'];
            MEMSTORE.clear();
            BP_ERROR.logwarn(e);
        }
    }

    BP_ERROR.logdebug("constructed mod_main");
    return Object.freeze(
        {
            init: init,
            g: g,
            // MOD_CONNECT
            saveRecord: saveRecord,
            saveTempRec: saveTempRec,
            sendDelActn: sendDelActn,
            getRecs: getRecs,
            getDBPath: getDBPath,
            BP_PLAT: g.BP_PLAT
        });
}());

BP_MAIN.g.BP_CS_PLAT.addEventListener(window, 'load', function(e)
{ "use strict";
  BP_MAIN.init(); 
  BP_MAIN.g.BP_ERROR.logdebug("inited main"); 
});
