
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- cadorn Christoph Dorn

(function (require, exports) {

/**
 * Provides a file-system-backed module loader
 * implementation, as used by Narwhal's bootstrapping, and
 * instantiable for nested module systems.
 * @module
 */

/*whatsupdoc*/

// NOTE: when this file is being loaded as part of the
// Narwhal bootstrapping process, all of the "requires" that
// occur here have to be manually accounted for (who loads
// the loader?)

var Q = require("q");
var MODULE = require("./module");

/**
 * Creates a module loader for plain-text modules stored
 * on the local file system with the given options.
 *
 * * `factories` is a pre-initialized map of top-level
 *   module identifiers to functions that accept a record of
 *   free variables to instantiate a module.
 * * `paths` is an `Array` of fully-qualified path `String`s
 *   wherein to search for top-level module identifiers
 *   in order.  Paths are sought in the outer loop, thus
 *   have lower precedence than extensions.
 * * `extensions` is an `Array` of extensions to search for,
 *   including the dot `.` if applicable, or an empty string
 *   to match all files.  The default is `["", ".js"]`.
 *   Extensions are sought in an inner loop, having higher
 *   precedence than paths.
 * * `Module(text, fileName, lineNo)` is a function that 
 *   transforms executable text in some language into a
 *   function.  The returned function must accept an 
 *   object of free variables to introduce into the 
 *   scope of the module and may return an object.  The
 *   module function may have a `requirements` array
 *   with module identifiers for the shallow dependencies
 *   of the module.  The default is a CommonJS JavaScript
 *   module parser.
 * * `types` is an `Object` that maps extensions to a
 *   corresponding `Module` constructor.  The default
 *   maps each extension to the given or default `Module`.
 * * `debug` is whether to print debug messages.
 *
 * In a module context, `require.loader` is or contains 
 * (as in a `MultiLoader` which can multiplex extensions to
 * alternate loaders) a `Loader` instance.
 *
 * @param {{factories: Object * Function, paths: extensions:
 * Array * String, extensions: Array * String, debug:
 * Boolean}} options.
 * @constructor
 */
exports.Loader = function (options) {
    options = options || {};
    var loader = {};
    var FS = options.fs || require("q-fs");
    var factories = options.factories || {};
    var paths = options.paths || [];
    var extensions = options.extensions || ["", ".js"];
    var Module = options.Module || MODULE.Module;
    var types = options.types;
    var next = options.next || function (topId) {
        return Q.reject({"message": "require error: couldn't find \"" + topId + "\""});
    };
    var debug = options.debug;
    var timestamps = {};

    if (!types) {
        types = {};
        for (var i = 0, ii = extensions.length; i < ii; i++) {
            types[extensions[i]] = Module;
        }
    }

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
        if (id.charAt(0) == ".") {
            id = FS.directory(baseId) + "/" + id;
        }
        // module ids need to use forward slashes, despite what the OS might say
        return FS.normal(id).replace(/\\/g, '/');
    };

    /***
     * @param {String} topId
     * @returns {Function(lexicalScope Object)} factory a
     * module factory ("maker") function.
     * @throws {Error} of no module can be found with the
     * given top-level identifier.
     */
    loader.find = function (topId) {
        // if it's absolute only search the "root" directory.
        // FS.join() must collapse multiple "/" into a single "/"
        var searchPaths = FS.isAbsolute(topId) ? [""] : paths;
        return (
            extensions.reduceRight(function (otherwise, extension) {
                return searchPaths.reduceRight(function (otherwise, searchPath) {
                    return function () {
                        var path = FS.join(searchPath, topId + extension);
                        return Q.when(FS.isFile(path), function (isFile) {
                            if (isFile)
                                return path;
                            else
                                return otherwise();
                        }, function () {
                            return false;
                        });
                    };
                }, otherwise);
            }, function () {
                return next(topId);
            })
        )();
    };

    /***
     * @param {String} topId
     * @param {String} path an optional hint about the path
     * for the corresponding identifier, to spare having to
     * find it again.
     * @returns {String} the text of the corresponding
     * module file in the topmost module path with the first
     * applicable extension.
     */
    loader.fetch = function (topId, path) {
        if (!path)
            path = loader.find(topId);
        return Q.when(path, function (path) {
            if (typeof FS.lastModified === "function")
                timestamps[path] = FS.lastModified(path);
            if (debug)
                print('loader: fetching ' + topId);
            var text = FS.read(path, {
                'charset': 'utf-8'
            });
            return Q.when(text, function (text) {
                // remove a shebang if it exists, but
                // leave the endline so the error line numbers align
                return text.replace(/^#[^\n]+\n/, "\n");
            });
        });
    };

    /***
     * @param {String} text the text of a module.
     * @param {String} topId the top-level identifier of the
     * module corresponding to the given text, used to 
     * @param {String} path an optional hint for the file
     * name of the module corresponding to the given text,
     * used to produce helpful stack traces.
     * @returns {Function(scope: Object)} a module factory
     * function or maker that executes the given text with
     * the owned properties of the given `scope` record
     * as free variables.  The returned function may have
     * a `path` property to provide hints to the recipient
     * for debugging.
     */
    loader.Module = function (text, topId, path) {
        if (!path)
            path = loader.find(topId);
        return Q.when(path, function (path) {
            var extension = FS.extension(path);
            var Module = types[extension];
            var factory = Module(text, path, 1);
            factory.path = path;
            return factory;
        });
    };

    /***
     * @param {String} topId
     * @param {String} path an optional path to provide a hint
     * about where to find the text corresponding to the
     * given topId, provided merely to avoid recomputation.
     * @return {Function(scope: Object)} the memoized module
     * factory function corresponding to the given top-level
     * identifier.
     */
    loader.load = function (topId, path, options) {
        options = options || {};
        var loaded = Object.prototype.hasOwnProperty.call(factories, topId)
        if (!loaded) {
            return Q.when(loader.reload(topId, path), function () {
                return factories[topId];
            });
        } else if (typeof FS.lastModified === "function") {
            var path = loader.find(topId);
            return Q.when(path, function (path) {
                return Q.when(loader.hasChanged(topId, path), function (hasChanged) {
                    if (hasChanged)
                        return Q.when(loader.reload(topId, path), resolve);
                    return factories[topId];
                });
            });
        } else {
            return factories[topId];
        }
    };

    /***
     * Forces a module to be reloaded, setting or replacing
     * the module factory function in the module factory
     * memo.  This function is called by `load` internally
     * to populate the memo and may be called externally
     * to freshen the memo.
     * @param {String} path an optional path to provide a hint
     * about where to find the text corresponding to the
     * given topId, provided merely to avoid recomputation.
     */
    loader.reload = function (topId, path) {
        return Q.when(loader.fetch(topId, path), function (text) {
            return Q.when(loader.Module(text, topId, path), function (module) {
                factories[topId] = module;
            });
        });
    };

    /***
     * @param {topId}
     * @returns {Boolean} whether a module factory function
     * has already been loaded for the given identifier.
     */
    loader.isLoaded = function (topId) {
        return Object.prototype.hasOwnProperty.call(factories, topId);
    };

    /***
     * @param {topId}
     * @param {String} path a hint on the whereabouts of the
     * given module.
     */
    loader.hasChanged = function (topId, path) {
        if (!path)
            path = loader.find(topId);
        return Q.when(path, function (path) {
            return Q.when(timestamps[path], function (previouslyModified) {
                return Q.when(FS.lastModified(path), function (lastModified) {
                    return (
                        !Object.prototype.hasOwnProperty.call(timestamps, path) ||
                        lastModified > previouslyModified
                    );
                });
            });
        });
    };

    /*** */
    loader.paths = paths;
    /*** */
    loader.extensions = extensions;

    return loader;
};

}).apply({},
    typeof exports !== "undefined" ? [
        require,
        exports
    ] : [
        (function (global) {
            return function (id) {
                return global["/" + id];
            }
        })(this),
        this["/loader"] = {}
    ]
);

