
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

(function (require, exports) {

/*whatsupdoc*/

var Q = require("q");
var HTTP = require("q-http");
var MODULE = require("./module");

exports.Loader = function (options) {
    options = options || {};
    var loader = {};
    var factories = options.factories || {};
    var basePath = options.path;
    var Module = options.Module || MODULE.Module;
    var next = options.next || function (topId) {
        return Q.reject({"message": "require error: couldn't find \"" + topId + "\""});
    };
    var debug = options.debug;

    /*** 
     * Resolves module identifiers into the top-level,
     * or absolute module name space.
     * @param {String} id a relative or top-level
     * identifier.
     * @param {String} baseId a top-level identifier.
     * @returns {String} the corresponding top-level
     * identifier.
     */
    loader.resolve = function (id, baseId) {
        id = String(id);
        var parts = id.split("/");
        if (id.charAt(0) === ".") {
            parts.pop();
            parts.push(id);
        }
        return parts.join("/").replace(/\.\.\/[^\/]+\//g, '/');
    };

    loader.fetch = function (id) {
        var url = basePath + '/' + id + '.js';
        return HTTP.read(url);
    };

    loader.Module = function (text, topId, path) {
        return Q.when(path, function (path) {
            var factory = Module(text, path, 1);
            factory.path = path;
            return factory;
        });
    };

    loader.load = function (topId, path, options) {
        options = options || {};
        var loaded = Object.prototype.hasOwnProperty.call(factories, topId);
        if (!loaded) {
            return Q.when(loader.reload(topId, path), function () {
                return factories[topId];
            });
        } else {
            return factories[topId];
        }
    };

    loader.reload = function (topId, path) {
        return Q.when(loader.fetch(topId, path), function (text) {
            return Q.when(loader.Module(text, topId, path), function (module) {
                factories[topId] = module;
            });
        });
    };

    loader.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    return loader;
};

}).apply({},
    typeof exports !== "undefined" ? [
        require,
        exports
    ] : [
        (function (global) {
            return function (id) {
                return global["/" + id.replace("./", "")];
            }
        })(this),
        this["/loader"] = {}
    ]
);

