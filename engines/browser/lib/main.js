(function (global) {
    var require = function (id) {
        return global["/" + id];
    };
    var Q = require("q");
    var REQUIRE = require("require");
    var LOADER = require("loader");
    global.Require = function (path) {
        var loader = LOADER.Loader({
            "path": path
        });
        return REQUIRE.Require({
            "loader": loader,
            "exports": {
                "q": Q,
                "require/loader": LOADER,
                "require/require": REQUIRE,
                "require/module": require("module"),
                "require/http": require("http"),
                "require/q-http": require("q-http")
            }
        });
    };
})(this);
