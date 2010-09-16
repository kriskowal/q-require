
var SYS = require("sys");
var Q = require("q");
var FS = require("q-fs");
var MODULE = require("../lib/module");
var Module = MODULE.Module;

var fileName = FS.join(__dirname, "package/requirements.js");
var lineNo = 1;
Q.when(FS.read(fileName), function (text) {
    var module = Module(text, fileName, lineNo);
    SYS.puts(SYS.inspect(module.requirements));
}, function (reason) {
    SYS.puts("error: " + SYS.inspect(reason));
});

