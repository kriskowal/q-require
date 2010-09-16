
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

require2.ensure(["returner"], function (require3) {
    var returner = require3("returner");
    SYS.puts(returner(2, 3));
});

