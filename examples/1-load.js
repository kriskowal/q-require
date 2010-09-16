
var Q = require("q");
var SYS = require("sys");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({
    "paths": [__dirname + "/package/"]
});

// grabs package/adder.js as a module
Q.when(loader.load("adder"), function (ADDER) {
    SYS.puts(SYS.inspect(ADDER));
    SYS.puts("executing module:");
    var result = ADDER({
        "a": 2,
        "b": 3
    });
    SYS.puts('a + b = ' + result);
});

