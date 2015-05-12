
var objectTag = '[object Object]';

var isNumber = function(value) {
	value = value - 0;
	return value === value && typeof value === 'number' && isFinite(value);
}

var isObject = function (value) {
	return Object.prototype.toString.call(value) === objectTag;
}


exports.isNumber = isNumber;

exports.isObject = isObject;


