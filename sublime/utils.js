
var objectTag = '[object Object]';

var exports = {
	isNumber: function(value) {
		value = value - 0;
		return value === value && typeof value === 'number' && isFinite(value);
	},
	isObject: function (value) {
		return Object.prototype.toString.call(value) === objectTag;
	},
	isString: function (value) {
		return typeof value === 'string';
	},
};


module.exports = exports;

