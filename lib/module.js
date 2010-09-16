
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// requirePattern from http://code.google.com/p/es-lab/source/browse/trunk/src/ses/initSES.js
// -- - Google, Inc. Copyright (C) 2009 Apache 2.0 License

if (typeof process !== "undefined") { // Node
    exports.Module = function (text, fileName, lineNo) {
        var factory = function (inject) {
            var names = [];
            for (var name in inject)
                if (Object.prototype.hasOwnProperty.call(inject, name))
                    names.push(name);
            var factory;
            try {
                factory = process.compile(
                    Array(lineNo).join("\n") +
                    "(function(" + names.join(",") + "){" + text + "\n})",
                    fileName
                );
            } catch (exception) {
                throw new Error(
                    exception + " while compiling " +
                    fileName + ":" + lineNo
                );
            }
            return factory.apply(null, names.map(function (name) {
                return inject[name];
            }));
        };
        factory.requirements = exports.getRequirements(text);
        return factory;
    };
} else { // Narwhal
    try {
        exports.Module = require("narwhal/engine").Module;
        throw new Exception("Narwhal's narwhal/engine needs to be updated for Module and .requirements.");
    } catch (exception) {
        exports.Module = function (text, fileName, lineNo) {
            return function (inject) {
                var keys = [], values = [];
                for (var key in inject) {
                    if (Object.prototype.hasOwnProperty.call(inject, key)) {
                        keys.push(key);
                        values.push(inject[key]);
                    }
                }
                return Function.apply(null, keys.concat([text])).apply(this, values);
            };
        };
    }
}

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

