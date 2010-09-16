
var Q = require("q");
var SYS = require("sys");
var REQUIRE = require("../lib/require");
var LOADER = require("../lib/loader");
var require2 = REQUIRE.Require({
    "loader": LOADER.Loader(),
    "exports": {
        "sys": SYS // injected
    }
});

var SYS2 = require2("sys");
SYS2.puts("from injected module");

require2.ensure([], function (require3) {
    var SYS3 = require3("sys");
    SYS3.puts("from module forwarded through ensure");
});

