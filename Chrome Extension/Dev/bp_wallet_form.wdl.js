/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */

/*global $, IMPORT, BP_PLUGIN */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin WALLET_FORM
 */
function BP_GET_WALLET_FORM(g)
{
    "use strict";
    var window = null, document = null, console = null,
        g_doc = g.g_win.document;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m);
    /** @import-module-begin CSPlatform */
        m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT),
        rpcToMothership = IMPORT(CS_PLAT.rpcToMothership),
        addEventListeners = IMPORT(m.addEventListeners), // Compatibility function
        addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin W$ */
    m = IMPORT(g.BP_W$);
    var BP_W$ = m,
        w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        WidgetElement = IMPORT(m.WidgetElement),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin */
    var BP_DBFS = IMPORT(g.BP_DBFS);
    var DB_FS = IMPORT(BP_DBFS.DB_FS);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    var g_dialog,
        g_counter = 1;
    /** @globals-end **/

    // TODO: This is better done via CSS
    function setValidity(w$ctrl, w$cg)
    {
        if ((!w$ctrl) || (!w$cg)) { return; }
        if (w$ctrl.el.validity.valid) {
            w$cg.removeClass('error');
        }
        else {
            w$cg.addClass('error');
        }
    }
    function checkValidity(w$ctrl, w$cg)
    {
        var valid = w$ctrl && w$ctrl.el.checkValidity();
        setValidity(w$ctrl, w$cg);
        return valid;
    }
    
    function chooseFolder(o)
    {
        if (!BP_PLUGIN.chooseFolder(o)) 
        {
            BP_ERROR.loginfo(o.err);
        }
        else {
            return o.path;
        }
    }
    
    function chooseWalletFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle = "Untrix Wallet: Select Wallet Folder";
        o.dbutton = "Select Wallet Folder";
        o.clrHist = true;

        return chooseFolder(o);
    }
    
    function chooseKeyFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle  = "Untrix Wallet: Select folder for storing Key File";
        o.dbutton = "Select Key File Folder";

        return chooseFolder(o);
    }
    
    function chooseKeyFile(o)
    {
        BP_COMMON.clear(o);
        o.filter = ['Key File','*.3ak'];
        o.dtitle = "Untrix Wallet: Select Key File";
        o.dbutton = "Select";
        o.clrHist = true;
        
        if (!BP_PLUGIN.chooseFile(o)) {BP_ERROR.loginfo(o.err);}
        else {return o.path;}
    }
    
    //////////////// Common Prototype Functions  //////////////////
    var formFieldProto = Object.create(WidgetElement.prototype, 
    {
        disable: {value: function()
        {
            this.el.disabled = true;
            this.hide();
        }},
        enable: {value: function()
        {
            this.el.disabled = false;
            this.show();
        }},
        checkValidity: {value: function(w$ctrl)
        {
            // Assumes that this element is surrounding w$ctrl and has class 'control-group'
            return checkValidity(w$ctrl, this);
        }}
    });
    
    //////////////// Widget: checkSaveDBLocation //////////////////
    function checkDontSaveLocation() {}
    checkDontSaveLocation.wdt = function(ctx)
    {
        return {
        tag:'label',
        addClass:'pull-left',
        attr:{ title:'If checked, saved wallet locations will be forgotten, otherwise '+
        'all opened/created wallet locations will be remembered. For privacy and security, '+
        'select it if this is not your computer.'
        },
            children:[
            {tag:'input',
             attr:{ type:'checkbox', tabindex:-1 },
             prop:{ checked:(localStorage.dbDontSaveLocation==='y') },
             ref:'checkDontSaveLocation',
             on:{'change': function(e){
                    localStorage.dbDontSaveLocation= (this.el.checked ? 'y' : 'n');
                  }}
            },
            {tag:'span', text:"  Forget Wallets"}
            ]
        };
    };
    checkDontSaveLocation.prototype = w$defineProto(checkDontSaveLocation,
    {});

    //////////////// Widget: itemDBName //////////////////
    function itemDBName() {}
    itemDBName.wdi = function(w$ctx)
    {
        var db_name = w$ctx.w$rec;
        
        return {
        tag:'li', cons:itemDBName,
        iface:{ dbName:db_name },
        save:['fieldsetDBName'],
            children:[
            {tag:'a', attr:{href:'#'}, text:'ctx.dbName',
             on:{ 'click':itemDBName.prototype.onClick }
            }
            ]
        };
    };
    itemDBName.prototype.onClick = function(e)
    {
        this.fieldsetDBName.inputDBName.el.value = this.dbName;
        CS_PLAT.customEvent(this.el, 'dbNameChosen', {dbName:this.dbName});
    };

    //////////////// Widget: menuDBSelect //////////////////
    function menuDBSelect() {}
    menuDBSelect.wdt = function(ctx)
    {
        var names, menuID, nIt;
            
        if (ctx.mode === 'create') { return w$undefined; }
        
        names = localStorage.dbNames;
        // return undefined if there are no options to select.
        if (!names) {return w$undefined; }        
        
        menuID = 'dbNameMenu' + g_counter++;
        nIt = BP_COMMON.ArrayIterator(Object.keys(names));
        
        return {
        tag:'div', ref:'menuDBSelect', cons:menuDBSelect, addClass:'dropdown',
        css:{display:'inline-block'},
            children:[
            {tag:'button', text:'Select ', attr:{type:'button'}, 
             addClass:'dropdown-toggle btn', ref:'button',
                children:[{tag:'span', addClass:'caret'}]
            },
            {tag:'ul', attr:{role:'menu', id:menuID}, addClass:'dropdown-menu',
             ref:'menuItems'
            }
            ],
        save:['fieldsetDBName'],
            iterate:{ it:nIt, wdi:itemDBName.wdi },
        _cull:['button', 'menuItems'],
        _final:{ exec:menuDBSelect.prototype.init }
        };    
    };
    menuDBSelect.prototype = w$defineProto(menuDBSelect,
    {
        init: {value: function()
        {
            this.button.$().dropdown();
            return this;
        }},
        focus: {value: function()
        {
            this.button.el.focus();
        }}
    });

    //////////////// Widget: fieldsetDBName //////////////////
    function fieldsetDBName() {}
    fieldsetDBName.wdt = function (ctx)
    {
        if (ctx.mode !== 'create') { return w$undefined; }
        
        return {
        tag:'fieldset',
        cons:fieldsetDBName,
        ref:'fieldsetDBName',
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Name</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-append',
                    children:[
                    {tag:'input',
                     ref:'inputDBName', addClass:"input-medium",
                     attr:{ type:'text', placeholder:"Enter Wallet Name", pattern:".{1,}",
                     title:"Please enter a name for the new Wallet that you would like to create. "+
                           "Example: <i>Tony's Wallet</i>"
                     },
                     prop:{ required: true },
                     on:{ 'change': function(e) {
                                    CS_PLAT.customEvent(this.el, 'dbNameChosen', {dbName:this.el.value});
                                    }}
                    }
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBName']
        };
    };
    fieldsetDBName.prototype = w$defineProto(fieldsetDBName,
    {
        val: {value: function(){ return this.inputDBName.el.value; }},
        
        focus: {value: function()
        {
            this.inputDBName.el.focus();
            return this;
        }}
    }, formFieldProto);
        
    //////////////// Widget: fieldsetChooseDB //////////////////
    function fieldsetChooseDB() {}
    fieldsetChooseDB.wdt = function (ctx)
    {
        //////////////// Widget: btnChooseDB //////////////////
        function btnChooseDB() {}
        btnChooseDB.wdt = function (ctx)
        {
            return {
            tag:'button',
            cons:btnChooseDB,
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseDB',
            on:{ 'click':btnChooseDB.prototype.onClick },
            save:['fieldsetChooseDB', 'dialog']
            };
        };
        btnChooseDB.prototype = w$defineProto(btnChooseDB, 
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseWalletFolder(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseDB.inputDBPath.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseDB.inputDBPath.el, 'dbChosen', {dbPath:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseDB,
        ref:'fieldsetChooseDB',
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Wallet Location</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend',
                    children:[
                    menuDBSelect.wdt,
                    btnChooseDB.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Wallet Folder Location" },
                     prop:{ required:true },
                     addClass:"input-large",
                     ref:'inputDBPath',
                     save:['fieldsetChooseDB'],
                     on:{'change':function(e)
                         {
                            if (this.fieldsetChooseDB.checkValidity(this)) {
                                CS_PLAT.customEvent(this.el, 'dbChosen', {dbPath:this.el.value});
                            }
                         }
                     }
                    },
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBPath', 'btnChooseDB', 'menuDBSelect']
        };
    };
    fieldsetChooseDB.prototype = w$defineProto(fieldsetChooseDB,
    {
        focus: {value: function()
        {
            if (this.menuDBSelect) {
                this.menuDBSelect.focus();
            }
            else {
                this.btnChooseDB.el.focus();    
            }
            
            return this;
        }},

        val: {value: function()
        {
            return this.inputDBPath.el.value;
        }},
        
        onDBNameChosen: {value: function(dbName) 
        {
            var names = localStorage.dbNames;

            if (names) {
                this.inputDBPath.el.value = names[dbName];
            }
            this.enable();
        }}        
    }, formFieldProto);
    

    //////////////// Widget: fieldsetChooseKey //////////////////
    function fieldsetChooseKey() {}
    fieldsetChooseKey.wdt = function (ctx)
    {
        //////////////// Widget: checkInternalKey //////////////////
        function checkInternalKey() {}
        checkInternalKey.wdt = function(ctx)
        {
            return {
            tag:'label',
            addClass:'checkbox',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false }, // default value
                 ref:'checkInternalKey',
                 on:{'change': function(e)
                     {if (this.el.checked) {
                         fieldsetChooseKey.prototype.onCheck();
                      } else {
                         fieldsetChooseKey.prototype.onUncheck();
                      }
                     }
                 }
                }
                ],
            _text:'Check if key is saved within the Wallet.'
            };
        };
        checkInternalKey.prototype = w$defineProto(checkInternalKey, {});
        
        //////////////// Widget: btnChooseKey //////////////////
        function btnChooseKey() {}
        btnChooseKey.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseKey',
            on:{ 'click':btnChooseKey.prototype.onClick },
            save:['fieldsetChooseKey']
            };
        };
        btnChooseKey.prototype = w$defineProto(btnChooseKey,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFile(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseKey.inputKeyPath.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseKey.inputKeyPath.el, 'keyPathChosen', {keyPath:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseKey,
        ref:'fieldsetChooseKey',
        prop:{ disabled:true },
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Key File</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend',
                    children:[
                    btnChooseKey.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Key File Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     ref:'inputKeyPath',
                     save:['fieldsetChooseKey'],
                     on:{ 'change': function(e) {
                         if (this.fieldsetChooseKey.checkValidity(this)) {
                            CS_PLAT.customEvent(this.el, 'keyPathChosen', {keyPath:this.el.value});
                         } } 
                        }
                    }
                    ]
                //checkInternalKey.wdt
                }
                ]
            }
            ],
        save:['walletForm'],
        _cull:['inputKeyPath', 'btnChooseKey', 'checkInternalKey'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetChooseKey.prototype = w$defineProto(fieldsetChooseKey,
    {
        val: {value: function(){ return this.inputKeyPath.el.value; }},
        
        onDBChosen: {value: function(dbPath)
        {
            var keyPath;
            
            if (this.walletForm.mode === 'create') { 
                this.disable();
                return this;
            }
            
            keyPath = dbPath ? DB_FS.findCryptInfoFile2(dbPath) : undefined;

            if (keyPath) {
                this.disable();
                CS_PLAT.customEvent(this.el, 'keyPathChosen', {keyPath:keyPath});
            }
            else
            {
                this.enable();
                //this.checkInternalKey.el.checked = false;
                this.btnChooseKey.el.focus();
            }
            
            return this;
        }}
    }, formFieldProto);


    //////////////// Widget: fieldsetChooseKeyFolder //////////////////
    function fieldsetChooseKeyFolder() {}
    fieldsetChooseKeyFolder.wdt = function (ctx)
    {
        //////////////// Widget: checkInternalKey //////////////////
        function checkInternalKey() {}
        checkInternalKey.wdt = function(ctx)
        {
            return {
            tag:'label',
            addClass:'checkbox',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false },
                 ref:'checkInternalKey',
                 save:['fieldsetChooseKeyFolder'],
                 on:{ 'change':function(e)
                     {if (this.el.checked) {
                         this.fieldsetChooseKeyFolder.onCheck();
                      } else {
                         this.fieldsetChooseKeyFolder.onUncheck();
                      }
                     }}
                }
                ],
            _text:'Key is saved within the Wallet (uncheck for more security).'
            };
        };
        checkInternalKey.prototype = w$defineProto(checkInternalKey, {});
        
        //////////////// Widget: btnChooseKeyFolder //////////////////
        function btnChooseKeyFolder() {}
        btnChooseKeyFolder.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseKeyFolder',
            on:{ 'click':btnChooseKeyFolder.prototype.onClick },
            save:['fieldsetChooseKeyFolder']
            };
        };
        btnChooseKeyFolder.prototype = w$defineProto(btnChooseKeyFolder,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFolder(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseKeyFolder.inputKeyFolder.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseKeyFolder.inputKeyFolder.el, 
                        'keyFolderChosen', {keyFolder:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseKeyFolder,
        ref:'fieldsetChooseKeyFolder',
        addClass:'control-group',
        prop:{ disabled:true },
        save:['walletForm'],
            children:[
            {html:'<label class="control-label">Key Folder</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend', ref:'controlsKeyFolder',
                    children:[
                    btnChooseKeyFolder.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Key Folder Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     ref:'inputKeyFolder',
                     save:['fieldsetChooseKeyFolder'],
                     on:{ 'change': function(e) 
                          {
                              if (this.fieldsetChooseKeyFolder.checkValidity(this)) {
                                CS_PLAT.customEvent(this.el, 'keyFolderChosen',
                                                    {keyFolder:this.el.value});
                              }
                          }}
                    },
                    ]
                },
                checkInternalKey.wdt,
                ]
            }
            ],
        _cull:['inputKeyFolder','btnChooseKeyFolder','checkInternalKey', 'controlsKeyFolder'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetChooseKeyFolder.prototype = w$defineProto(fieldsetChooseKeyFolder,
    {
        val: {value: function(){ return this.inputKeyFolder.el.value; }},
        onDBChosen: {value: function()
        {          
            if (this.walletForm.mode === 'create')
            {
                this.enable();
                this.checkInternalKey.el.checked = true; // Default position
                this.onCheck();
                this.btnChooseKeyFolder.el.focus();
            }

            return this;
        }},
        
        onCheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyFolder.el.value = null;
                this.inputKeyFolder.el.disabled = true;
                this.btnChooseKeyFolder.el.disabled = true;
                this.controlsKeyFolder.hide();
                CS_PLAT.customEvent(this.inputKeyFolder.el, 'keyFolderChosen', {keyFolder:null});
            }
        }},

        onUncheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyFolder.el.value = null;
                this.inputKeyFolder.el.disabled = false;
                this.btnChooseKeyFolder.el.disabled = false;
                this.controlsKeyFolder.show();
            }
        }}
    }, formFieldProto);

    //////////////// Widget: fieldsetPassword //////////////////
    function fieldsetPassword() {}
    fieldsetPassword.wdt = function(ctx)
    {
        var bPass2 = ctx.bPass2;
        
        function inputPassword() {}
        inputPassword.wdt = function(ctx)
        {
            return {
            tag:'input',
            attr:{ type:'password', placeholder:bPass2?"Re-Enter Master Password":"Enter Master Password",
                   title:'10 or more characters required', pattern:'.{10,}' },
            prop:{ required:true },
            ref:'inputPassword',
            on:{ 'change':inputPassword.prototype.onChange},
            save:['walletForm', 'fieldsetPassword']
            };
        };
        inputPassword.prototype = w$defineProto(inputPassword,
        {
            onChange: {value: function(e)
             {
                 if (!this.fieldsetPassword.checkValidity(this)) { return; }

                 if (bPass2) {
                     if (this.el.value !== this.walletForm.fieldsetPassword.inputPassword.el.value) {
                         this.el.setCustomValidity('Passwords do not match');
                     }
                     else {
                         CS_PLAT.customEvent(this.el, 'passwordChosen');
                     }
                 }
                 else if (this.walletForm.mode !== 'create') {
                     CS_PLAT.customEvent(this.el, 'passwordChosen');
                 }
             }}
        });

        return {
        tag:'fieldset', cons: fieldsetPassword,
        ref: (bPass2 ? 'fieldsetPassword2' : 'fieldsetPassword'),
        iface:{ bPass2: bPass2 },
        prop:{ disabled:true },
        addClass:'control-group',
            children:[
            {tag:'label', addClass:'control-label',
             text:bPass2?'Re-Enter Master Password':'Master Password'
            },
            {tag:'div', addClass:'controls',
                children:[inputPassword.wdt]
            }
            ],
        _cull:['inputPassword'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetPassword.prototype = w$defineProto(fieldsetPassword,
    {
        val: {value: function(){ return this.inputPassword.el.value; }},
        onKeyPathChosen: {value: function(e)
        {
            if (!this.bPass2) { this.enable(); this.inputPassword.el.focus(); }
        }},
        
        onKeyFolderChosen: {value: function(e)
        {
            this.enable();
            if (!this.bPass2) {
                this.inputPassword.el.focus();
            }
        }}
    }, formFieldProto);

    function fieldsetPassword2_wdt(ctx)
    {
        var wdl;
        ctx.bPass2 = true;
        wdl = fieldsetPassword.wdt(ctx);
        delete ctx.bPass2;
        return wdl;
    }
    
    //////////////// Widget: fieldsetSubmit //////////////////
    function fieldsetSubmit() {}
    fieldsetSubmit.wdt = function(ctx)
    {
        return {
        tag:'fieldset', addClass:'control-group',
            children:[
            {tag:'div', addClass:'controls',
                children:[
                {tag:'button', ref:'btnWalletSubmit', attr:{type:'button'},
                 //prop:{ disabled:true },
                 addClass:'btn btn-small btn-primary', text:'Submit'
                },
                {tag:'button', ref:'btnWalletCancel', attr:{type:'button'},
                 addClass:'btn btn-small', text:'Cancel'
                }
                ]
            }
            ],
        _cull:['btnWalletSubmit', 'btnWalletCancel']
        };
    };
    fieldsetSubmit.prototype = w$defineProto(fieldsetSubmit, {}, formFieldProto);
    
    //////////////// Widget: WalletFormWdl //////////////////
    function WalletFormWdl() {}
    WalletFormWdl.wdt = function (ctx)
    {      
        return {
        tag:'form',
        cons: WalletFormWdl,
        ref:'walletForm',
        addClass:'form-horizontal',
        save:['dialog'],
        iface:{
            mode: ctx.mode,
            loadDB2: ctx.loadDB2,
            createDB2: ctx.createDB2,
            mergeDB2: ctx.mergeDB2,
            mergeInDB2: ctx.mergeInDB2,
            mergeOutDB2: ctx.mergeOutDB2,
            updateDash: ctx.updateDash,
            callbackHandleError: ctx.callbackHandleError
        },
        on:{ 'dbNameChosen':WalletFormWdl.prototype.onDBNameChosen,
             'dbChosen':WalletFormWdl.prototype.onDBChosen,
             'keyPathChosen':WalletFormWdl.prototype.onKeyPathChosen,
             'keyFolderChosen':WalletFormWdl.prototype.onKeyFolderChosen,
             'passwordChosen':WalletFormWdl.prototype.onPasswordChosen
        },
            children:[
            fieldsetDBName.wdt,
            fieldsetChooseDB.wdt,
            fieldsetChooseKey.wdt,
            fieldsetChooseKeyFolder.wdt,
            fieldsetPassword.wdt,
            fieldsetPassword2_wdt
            ],
        _cull:['fieldsetDBName',
               'fieldsetChooseDB',
               'fieldsetChooseKey',
               'fieldsetChooseKeyFolder',
               'fieldsetPassword',
               'fieldsetPassword2']
        };
    };
    WalletFormWdl.prototype = w$defineProto(WalletFormWdl,
    {
        setValiditys: {value: function()
        {
            if (this.fieldsetDBName) { 
                setValidity(this.fieldsetDBName.inputDBName, this.fieldsetDBName);
            }
            setValidity(this.fieldsetChooseDB.inputDBPath, this.fieldsetChooseDB);
            setValidity(this.fieldsetChooseKey.inputKeyPath, this.fieldsetChooseKey);
            setValidity(this.fieldsetChooseKeyFolder.inputKeyFolder, this.fieldsetChooseKeyFolder);
            setValidity(this.fieldsetPassword.inputPassword, this.fieldsetPassword);
            setValidity(this.fieldsetPassword2.inputPassword, this.fieldsetPassword2);            
        }},
        onDBNameChosen: {value: function(e)
        {
            this.fieldsetChooseDB.onDBNameChosen(e.detail.dbName);
            e.preventDefault();
            e.stopPropagation();
        }},
        onDBChosen: {value: function(e)
        {
            this.fieldsetChooseKey.onDBChosen(e.detail.dbPath);
            this.fieldsetChooseKeyFolder.onDBChosen();
            e.preventDefault();
            e.stopPropagation();            
        }},
        onKeyPathChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyPathChosen();
            e.preventDefault();
            e.stopPropagation();
        }},
        onKeyFolderChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyFolderChosen();
            this.fieldsetPassword2.onKeyFolderChosen();
            e.preventDefault();
            e.stopPropagation();
        }},
        onPasswordChosen: {value: function(e)
        {
            this.onSubmit();
        }},
        onSubmit: {value: function()
        {
            if (!this.el.checkValidity()) {
                this.setValiditys();
                BP_ERROR.alert('There were some errors');
                return;
            }
            
            this.setValiditys();
            var self = this;
            
            if (this.mode === 'open') {
                this.loadDB2(this.fieldsetChooseDB.val(),
                        this.fieldsetChooseKey.val(),
                        this.fieldsetPassword.val(), function (resp)
                {
                    if (resp.result === true) {
                        self.updateDash(resp);
                        BP_ERROR.success('Opened password wallet at ' + resp.dbPath);
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (this.mode === 'create') 
            {
                this.createDB2(this.fieldsetDBName.val(),
                              this.fieldsetChooseDB.val(),
                              this.fieldsetChooseKeyFolder.val(),
                              this.fieldsetPassword.val(), function (resp)
                {
                    if (resp.result === true) {
                        self.updateDash(resp);
                        BP_ERROR.success('Password store created at ' + resp.dbPath);
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (this.mode === 'merge')
            {
                this.mergeDB2(this.fieldsetChooseDB.val(),
                        this.fieldsetChooseKey.val(),
                        this.fieldsetPassword.val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged with password wallet at ' + this.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (this.mode === 'mergeIn')
            {
                this.mergeInDB2(this.fieldsetChooseDB.val(),
                        this.fieldsetChooseKey.val(),
                        this.fieldsetPassword.val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged In password wallet at ' + this.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (this.mode === 'mergeOut')
            {
                this.mergeOutDB2(this.fieldsetChooseDB.val(),
                        this.fieldsetChooseKey.val(),
                        this.fieldsetPassword.val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged out to password wallet at ' + this.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
        }}
    });
    
    function modalDialog() {}
    modalDialog.wdt = function(ctx)
    {
        return {
        tag:'div', ref: 'dialog',
        cons:modalDialog,
        addClass:'modal',
        attr:{ id:'modalDialog', role:'dialog' },
        iface:{ mode:ctx.mode },
        _final:{ appendTo:ctx.appendTo, show:false },
        _cull:['walletForm', 'modalHeader'],
            children:[
            {tag:'div', addClass:'modal-header',
                children:[
                {tag:'button', addClass:'close',
                 attr:{ "data-dismiss":'modal', 'aria-hidden':true },
                 text:'x',
                 save:['dialog'],
                 on:{ 'click': function(e){modalDialog.destroy();} }
                },
                {tag:'h3', ref:'modalHeader'}
                ]
            },
            {tag:'div', addClass:'modal-body',
                children:[WalletFormWdl.wdt]
            },
            {tag:'div', addClass:'modal-footer',
                children:[
                checkDontSaveLocation.wdt,
                {tag:'button', 
                addClass:'btn', 
                attr:{'data-dismiss':'modal', 'aria-hidden':true, tabindex:-1},
                text:'Cancel',
                on:{ 'click': function(e){modalDialog.destroy();}}
                },
                {tag:'button', addClass:'btn btn-primary', text:'Submit',
                 attr:{ 'type':'button'},
                 save:['walletForm'],
                 on:{ 'click': function(e) {
                     this.walletForm.onSubmit(e);
                 } 
                 }
                }
                ]
            }
            ]
        };
    };
    modalDialog.prototype = w$defineProto(modalDialog,
    {
        onInsert: {value: function()
        {
            this.$().modal({show:false});
            this.$().on('shown', modalDialog.onShown);
            this.$().on('hidden', modalDialog.onHidden);
            
            switch (this.mode)
            {
                case 'merge':
                    this.modalHeader.$().text('Sync/Merge Wallet');
                    break;
                case 'mergeIn':
                    this.modalHeader.$().text('Import Wallet');
                    break;
                case 'mergeOut':
                    this.modalHeader.$().text('Export to Wallet');
                    break;
                case 'create':
                    this.modalHeader.$().text('Create Wallet');
                    break;
                case 'open':
                default:
                    this.modalHeader.$().text('Open Wallet');
            }
            
            return this;
        }},
        
        showModal: {value: function()
        {
            this.$().modal('show');
            return this;
        }},
        
        hideModal: {value: function()
        {
            this.walletForm.el.reset();
            this.$().modal('hide');
            return this;
        }}
    });
    modalDialog.onShown = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog');
        if (!dialog) { return; }
        
        switch (dialog.mode)
        {
            case 'create':
                dialog.walletForm.fieldsetDBName.focus();
                break;
            default:
                dialog.walletForm.fieldsetChooseDB.focus();
        }   
    };
    modalDialog.onHidden = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog');
        if (!dialog) { return; }
        dialog.destroy();
    };    
    modalDialog.create = function(ops)
    {
        var ctx, dialog, temp;

        if (g_dialog) {
            g_dialog.hide().destroy();
            g_dialog = null;
        }

        // Create the Widget.
        ctx = {
            mode: ops.mode,
            loadDB2: ops.loadDB2,
            createDB2: ops.createDB2,
            mergeDB2: ops.mergeDB2,
            mergeInDB2: ops.mergeInDB2,
            mergeOutDB2: ops.mergeOutDB2,
            updateDash: ops.updateDash,
            callbackHandleError: ops.callbackHandleError,
            appendTo: 'body'
        };

        dialog = BP_W$.w$exec(modalDialog.wdt, ctx);
        
        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
        
        g_dialog = dialog;
        
        if (dialog)
        {
            $(g_dialog.el).tooltip(); // used to leak DOM nodes in version 2.0.4.
            g_dialog.onInsert().showModal();
        }
        
        return g_dialog;
    };
    modalDialog.destroy = function()
    {
        var w$dialog;
        if (g_dialog) {
            w$dialog = g_dialog;
        }
        else {
            w$dialog = BP_W$.w$get('#modalDialog');
        }

        if (w$dialog) {
            w$dialog.hideModal();
        }
        
        g_dialog = null;
    };

    BP_ERROR.loginfo("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: modalDialog.create
    });
}