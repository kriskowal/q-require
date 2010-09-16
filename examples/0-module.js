
// constructs a Module function from the text of a
//  module file, acquired asynchronously

var SYS = require("sys");
var Q = require("q");
var FS = require("q-fs");
var MODULE = require("../lib/module");
var Module = MODULE.Module;

var fileName = FS.join(__dirname, "package/adder.js");
Q.when(FS.read(fileName), function (text) {
    SYS.puts('text: ' + text.trim());
    var adder = Module(text, fileName, 1); // lineNo optional
    SYS.puts('running module:');
    var result = adder({"a": 2, "b": 3});
    SYS.puts('2 + 3 = ' + result);
}, function (reason) {
    SYS.puts("error: " + SYS.inspect(reason));
});

