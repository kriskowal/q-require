
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var loader = LOADER.Loader({"paths": [__dirname + "/package/"]});
var require2 = REQUIRE.Require({"loader": loader});

assertion();
require2.ensure(["required"], function (require3) {
    assertion();
    var required = require3("required");
    SYS.puts(SYS.inspect(required));
});
assertion();

function assertion() {
    var completed;
    try {
        require2("required");
        completed = true;
    } catch (exception) {
    }
    if (completed) {
        SYS.puts("an error has occurred; required should not have been available");
    }
}

