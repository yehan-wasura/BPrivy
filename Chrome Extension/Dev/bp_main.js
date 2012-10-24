/**
 *
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, BP_MOD_PLAT, BP_GET_CONNECT, BP_GET_COMMON, IMPORT, localStorage,
  BP_GET_MEMSTORE, BP_GET_DBFS, BP_GET_FILESTORE, BP_GET_ERROR, BP_GET_TRAITS,
  BP_GET_CS_PLAT, BP_GET_PLAT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/** @globals-begin */
//////////// DO NOT HAVE DEPENDENCIES ON ANY BP MODULE OR GLOBAL ///////////////////
function IMPORT(sym)
{
    'use strict';
    var window = null, document = null, console = null;
    if(sym===undefined || sym===null) {
        throw new ReferenceError("Linker:Symbol Not Found");
    }
    else {
        return sym;
    }
}
var BP_PLUGIN;
/** @globals-end */

var BP_MAIN = (function()
{
    "use strict";
    var g = {g_win:window, g_console:console},
        g_doc = document;

    g.BP_ERROR = BP_GET_ERROR(g);
    g.BP_COMMON = BP_GET_COMMON(g);
    g.BP_TRAITS = BP_GET_TRAITS(g);
    g.BP_PLAT = BP_GET_PLAT(g);
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    g.BP_CONNECT = BP_GET_CONNECT(g);
    g.BP_MEMSTORE = BP_GET_MEMSTORE(g);
    g.BP_DBFS = BP_GET_DBFS(g);
    g.BP_FILESTORE = BP_GET_FILESTORE(g);

    /** @import-module-begin MainPlatform */
    var m = g.BP_PLAT;
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
    var MEM_STORE = IMPORT(m),
        MOD_ETLD = IMPORT(m.MOD_ETLD);
    var FILE_STORE = IMPORT(g.BP_FILESTORE);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = g.BP_ERROR.BPError,
        Activity = g.BP_ERROR.Activity;
    /** @import-module-begin */
    var DBFS = IMPORT(g.BP_DBFS);
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
        var res, notes;

        if (!DBFS.getDBPath()) {throw new BPError("", 'UserError', 'NoDBLoaded');}

        switch (dt)
        {
            case dt_eRecord:
            case dt_pRecord:
                notes = MEM_STORE.insertRec(rec, dt);
                if (notes) 
                {
                    res = true;
                    if (MEM_STORE.DT_TRAITS.getTraits(dt).toPersist(notes) &&
                        FILE_STORE.UC_TRAITS.insertNewRec.toPersist(notes))
                    {
                        res = FILE_STORE.insertRec(rec, dt);
                    }
                }
                break;
            default: // do nothing
        }
        
        return res;
    }
    
    function makeDashResp(result)
    {
        return {
            result: result,
            dbName:DBFS.getDBName(),
            dbPath:DBFS.getDBPath(),
            dbStats:DBFS.getDBStats(),
            memStats:MEM_STORE.getStats()
        };
    }
    
    function getRecs (loc)
    {
        var recs, resp={};
        recs = MEM_STORE.getRecs(loc);
        resp.dbInfo = {
            dbName : DBFS.getDBName(),
            dbPath : DBFS.getDBPath()
        };
        resp.db = recs;
        resp.result = true;
        return resp;
    }
    
    function onBefReq(details)
    {
        if (g_forms[details.url]) {
            g_win.alert("onBefReq: " + details.url);
            //delete g_forms[details.url];
        }
        // else {
            // console.log("onBefReq: " + details.url);
        // }
    }
    
    function onRequest(rq, sender, funcSendResponse)
    {
        var result, recs, dbPath, dbStats, fnames, notes, dt,
            cm = rq.cm,
            bSaveRec;
        //delete rq.cm; // we don't want this to get saved to store in case of eRec and pRec.
        BP_ERROR.logdebug("onRequest: " + cm);
        
        rq.atvt ? (BPError.atvt = new Activity(rq.atvt)) : (BPError.atvt = new Activity("BPMain::OnRequest"));
        
        try  {
            switch (cm) {
                case dt_eRecord:
                case dt_pRecord:
                    dt = cm;
                    BPError.push("SaveRecord:" + dt);
                    bSaveRec = true;
                    result = insertNewRec(rq.rec, dt);
                    if (result && (!rq.dontGet)) {
                        recs = MEM_STORE.getDTRecs(rq.loc, dt);
                    }
                    funcSendResponse({result:result, recs:recs});
                    break;
                case BP_CONNECT.cm_tempRec:
                    BPError.push("SaveTempRecord:" + rq.dt);
                    if (DBFS.getDBPath()) {
                        notes = MEM_STORE.insertTempRec(rq.rec, rq.dt);
                        if (!rq.dontGet) {
                            recs = MEM_STORE.getTRecs(rq.loc);
                        } 
                    }
                    else {result = false;}
                    funcSendResponse({result:result, recs:recs, notes:notes});
                    break;
                case 'cm_bootLoaded':
                    BPError.push("CSLoaded");
                    chrome.pageAction.show(sender.tab.id);
                    funcSendResponse({result:true});
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
                    dbPath = DBFS.getDBPath();
                    funcSendResponse(makeDashResp(true));
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
                    funcSendResponse({result:true, dB:MEM_STORE.getDB(rq.dt)});
                    break;
                case BP_CONNECT.cm_getDN:
                    BPError.push("GetDNode");
                    funcSendResponse({result:true, dN:MEM_STORE.getDNode(rq.l, rq.dt)});
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
            MEM_STORE.loadETLD();
            MEM_STORE.clear();
            if (dbPath)
            {
                BPError.atvt = new Activity('LoadDBAtInit');
                dbPath = FILE_STORE.loadDB(dbPath);
    
                if (!dbPath) { // db-load failed
                    throw new BPError("DB Load Failed");
                }
            }
            
            //chrome.webRequest.onBeforeRequest.addListener(onBefReq, {urls:["http://*/*", "https://*/*"]});
        
            // chrome.tabs.onSelectionChanged.addListener(function(tabId) 
            // {
                // chrome.pageAction.show(tabId);
            // });        } 
        catch (e)
        {
            delete localStorage['db.path'];
            MEM_STORE.clear();
            BP_ERROR.logwarn(e);
        }
    }

    BP_ERROR.logdebug("constructed mod_main");
    return Object.freeze(
        {
            init: init,
            g: g
        });
}());

BP_MAIN.g.BP_CS_PLAT.addEventListener(window, 'load', function(e)
{ "use strict";
  BP_MAIN.init(); 
  BP_MAIN.g.BP_ERROR.logdebug("inited main"); 
});
