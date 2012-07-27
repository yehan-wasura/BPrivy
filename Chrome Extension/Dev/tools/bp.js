/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true, sloppy:true */
/*global require, process, __filename, module */

'use strict';

var events = require('events'),
    path = require('path'),
    abs = path.resolve,
    fs = require('fs.extra');


var ProtoJobTracker = Object.create(events.EventEmitter.prototype,{
    done: {value: function () 
    {
        if ((--this.n)<=0) {
            this.emit('done', this);
        }
        // else {            // console.log(this.name + ' decr');        // }
    }},
    runHere: {value: function(func, ctx)
    {
        this.n++;
        var self = this;
        return function() 
        {
            if (func) {
                // invoke func with all passed in arguments as well as ctx if available
                func.apply(null, (!ctx)? arguments: Array.prototype.slice.apply(arguments).concat([ctx]));
            }
            self.done();
        };
    }},
    track: {value: function ()
    {
        this.n++;
        var self = this;
        return function() 
        {
            self.done();
        };        
    }},
    logEnd: {value: function(self)
    {
        if (!self) {self=this;}
        console.log(self.name + ' end');
    }},    end: {value: function(){this.done();}}
});

function Async (name, _done)
{
    var o = Object.create(ProtoJobTracker,
    {
        n   : {value: 1, writable: true}, // the incremented value of n will be decremented by a call to release()
        name: {value: name},
        constructor: {value: Async}
    });
    if (_done) {
        o.on('done', _done);
    }
    else {
        o.on('done', ProtoJobTracker.logEnd);
    }
    return Object.seal(o);
}

function throwErr(err)
{ 
    if (err) { throw err; }
}

function copy(srcDir, dstDir, files, async)
{
    var i, n, 
        fsrc, fdst;
    files.forEach(function (f, i, files)
    {
        fsrc = abs(srcDir, f);
        fdst = abs(dstDir, f);
        if ((!fs.existsSync(fdst)) ||
            (fs.lstatSync(fsrc).mtime > fs.lstatSync(fdst).mtime))
        {
            console.log("Copying " + fdst);
            if (fs.existsSync(fdst)) {
                fs.unlinkSync(fdst); // truncate the file.
            }
            fs.copy(fsrc, fdst, async.runHere(throwErr));
        }
    });
}

function buildPackage(src, bld, async)
{
    copy(src, bld, ['updates.xml'], async);
}

module.exports = {newAsync:Async, throwErr:throwErr, buildPackage:buildPackage};
