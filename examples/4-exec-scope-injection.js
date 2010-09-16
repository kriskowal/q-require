
var Q = require("q");
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

Q.when(require2.exec("adder", {"a": 2, "b": 3}), function (adder) {
    SYS.puts(SYS.inspect(adder));
}, function (reason) {
    SYS.puts(SYS.inspect(reason));
});

