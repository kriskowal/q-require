
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// requirePattern from http://code.google.com/p/es-lab/source/browse/trunk/src/ses/initSES.js
// -- - Google, Inc. Copyright (C) 2009 Apache 2.0 License

(function (require, exports, undefined) {

exports.Module = function (text, fileName, lineNo) {
    var module = function (inject) {
        var keys = [], values = [];
        for (var key in inject) {
            if (Object.prototype.hasOwnProperty.call(inject, key)) {
                keys.push(key);
                values.push(inject[key]);
            }
        }
        return Function.apply(null, keys.concat([text])).apply(this, values);
    };
    module.requirements = exports.getRequirements(text);
    return module;
};

// http://code.google.com/p/es-lab/source/browse/trunk/src/ses/initSES.js
var requirePattern = (/require\s*\(\s*(['"])((?:\w|\$|\.|\/)+)\1\s*\)/m);

exports.getRequirements = function (text) {
    var result = [];
    var statements = text.split(';');
    var i = 0, ii = statements.length;
    for (; i < ii; i++) {
    var match = requirePattern.exec(statements[i]);
        if (!match) break;
        result.push(match[2]);
    }
    return result;
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
        this["/module"] = {}
    ]
);

