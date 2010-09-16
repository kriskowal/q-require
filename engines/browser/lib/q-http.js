
(function (require, exports) {

var Q = require("q");
var HTTP = require("./http");

exports.read = function (path) {
    var response = Q.defer();
    var request = HTTP.Request();
    request.open("GET", path, true);
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            var status; 
            try {
                status = request.status;
            } catch (error) {
            }
            if (status === 200) {
                response.resolve(request.responseText);
            } else {
                response.reject("HTTP " + status + " for " + path);
            }
        }
    };
    request.send('');
    return response.promise;
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
        this["/q-http"] = {}
    ]
);

