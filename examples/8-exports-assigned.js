
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

require2.ensure(["assigner"], function (require3) {
    var assigner = require3("assigner");
    SYS.puts(assigner(2, 3));
});

