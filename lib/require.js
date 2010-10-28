// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License

(function (require, exports) {

/**
 * @module
 */

/*whatsupdoc*/

var Q = require("q");
var has = Object.prototype.hasOwnProperty;
var update = function (_object, object) {
    for (var key in object) {
        if (has.call(object, key)) {
            _object[key] = object[key];
        }
    }
};
var copy = function (object) {
    var _object = {};
    update(_object, object);
    return _object;
}

/**
 * Creates a `require` function, and arranges for modules
 * to be executed and their exports memoized, in a lexical
 * scope that includes:
 *
 * * `require(id)` with support for identifiers relative to
 *   the calling module.
 * * `require.loader` for direct access to the module
 *    loader, which can be used in nested requirers.
 * * `require.force(id)`
 * * `require.once(id, scope)` to execute but not memoize
 *   a module, with an optional object that owns additional
 *   free variables to inject into the module's lexical
 *   scope.
 * * `module`
 *   * `id`
 *   * `path`
 * * `exports`
 *
 * @param {{loader, modules, debug}} options
 * @constructor
 * @returns {require(id)}
 */

exports.Require = function (options) {
    options = options || {};
    var loader = options.loader;
    var factories = options.factories || {};
    var modules = options.modules || {};
    var apis = options.exports || {};
    for (var id in apis)
        if (has.call(apis, id))
            modules[id] = {"exports": apis[id]};

    var require = function (id, baseId, options) {
        var module, factory, exports, completed, require;
        options = options || {};
        id = loader.resolve(id, baseId);
        if (has.call(modules, id)) {
            module = modules[id];
        } else if (has.call(factories, id)) {
            factory = factories[id];
            module = Module(id, factory.path);
            modules[id] = module;
            exports = modules[id].exports;
            require = Require(id);
            scope = {
                "require": require,
                "exports": exports,
                "module": module
            };
            update(scope, options.scope || {});
            try {
                var returned = factory(scope);
                completed = true;
            } finally {
                if (!completed) {
                    delete modules[id];
                }
            }
            if (typeof returned !== "undefined")
                module.exports = returned;
        } else {
            throw new Error("require: could not load " + id);
        }
        return module.exports;
    };

    // curries require for a module, so its baseId can be assumed
    var Require = function (baseId) {
        var _require = function (id) { return require(id, baseId); };
        _require.async = function (id) { return require.async(id, baseId) };
        _require.loader = loader;
        _require.main = modules[options.main];
        return _require;
    };

    // creates a module object
    var Module = function (baseId, path) {
        var module = {};
        module.exports = {};
        module.id = baseId;
        module.path = path;
        return module;
    };

    // asynchronously adds module factories to a factory list
    var advanceFactories = function (id, factories) {
        return Q.when(loader.load(id), function (factory) {
            factories[id] = factory;
            return factory.requirements.reduce(function (factories, requirement) {
                requirement = loader.resolve(requirement, id);
                return Q.when(factories, function (factories) {
                    if (has.call(modules, requirement) || has.call(factories, requirement))
                        return factories;
                    return advanceFactories(requirement, factories);
                });
            }, factories);
        });
    };

    require.reload = function (id) {
        return Q.when(advanceFactories(id, {}), function (factories) {
            return exports.Require({
                "loader": loader,
                "factories": factories
            });
        });
    };

    require.ensure = function (ids, callback) {
        var _modules = copy(modules);
        var _factories = ids.reduce(function (factories, id) {
            return Q.when(factories, function (factories) {
                return advanceFactories(id, factories);
            });
        }, copy(factories));
        return Q.when(_factories, function (factories) {
            callback(exports.Require({
                "loader": loader,
                "factories": factories,
                "modules": _modules
            }));
        }, function (reason) {
            throw new Error(reason.message || reason);
        });
    };

    require.async = function (id, baseId) {
        var _factories = copy(factories);
        var _modules = copy(modules);
        return Q.when(advanceFactories(id, _factories), function (factories) {
            var _require = exports.Require({
                "loader": loader,
                "factories": factories,
                "modules": _modules
            });
            return _require(id, baseId);
        });
    };

    require.exec = function (id, scope) {
        var _factories = copy(factories);
        var _modules = copy(modules);
        return Q.when(advanceFactories(id, _factories), function (factories) {
            var _require = exports.Require({
                "loader": loader,
                "factories": factories,
                "modules": _modules,
                "main": id
            });
            return _require(id, undefined, {
                "scope": scope
            });
        });
    };

    require.loader = loader;

    return require;
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
        this["/require"] = {}
    ]
);

