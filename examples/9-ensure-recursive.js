
var Q = require("q");
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

require2.ensure(["foo"], function (require3) {
    require3("baz");
});

