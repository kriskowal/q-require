
var Q = require("q");
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

Q.when(require2.exec("main"), function (main) {
    SYS.puts(SYS.inspect(main));
}, function (reason) {
    SYS.puts(SYS.inspect(reason));
});

