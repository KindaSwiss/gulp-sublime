'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var SettingsProto = {
	/**
  * Sets a setting with the values passed.
  * @param {Object} 0.values
  * @param {String} 0.name
  * @param {String} 1.value
  */
	set: function set() {
		var _this = this;

		var args = Array.prototype.slice.call(arguments);
		var data = {};
		var validations = {};
		var values = undefined;
		var changes = [];

		// if the value passed is an object
		if (args.length === 1 && _util2['default'].isObject(args[0])) {
			values = args[0];
		} else {
			// if key and value were passed
			var _name = args[0];
			var value = args[1];
			values = _defineProperty({}, _name, value);
		}

		for (var _name2 in values) {
			var value = values[_name2];
			var passed = true;

			if (_name2 in this._validations) {
				passed = this._validations[_name2](value);
				validations[_name2] = passed;

				// Don't set the setting if it doesn't pass validation
				if (!passed) {
					continue;
				}
			}

			this._settings[_name2] = value;
			changes.push(_name2);
		}

		data.changes = changes;
		data.validations = validations;

		changes.forEach(function (name) {
			return _this.emit('change:' + name, data);
		}, this);

		// Notify of settings change
		this.emit('change', data);

		return (0, _objectAssign2['default'])({}, validations);
	},

	/**
  * Returns whether the settings object contains the specified name.
  * @param  {String}  name
  * @return {Boolean}
  */
	has: function has(name) {
		return this._settings.hasOwnProperty(name);
	},

	/**
  * Retrieves the value associated with the name in the settings.
  * A default value may be specified if the settings does not own
  * the key.
  * @param  {String} name
  * @param  {*} defaultValue
  * @return {*}
  */
	get: function get(name, defaultValue) {
		if (this._settings.hasOwnProperty(name)) {
			return this._settings[name];
		} else {
			return defaultValue;
		}
	},

	/**
  * Checks whether a value passes the validations associated with
  * the name.
  * @param  {String}  name
  * @param  {*}       value
  * @return {Boolean}
  */
	isValid: function isValid(name, value) {
		if (this._validations.hasOwnProperty(name)) {
			return this._validations[name](value);
		}

		return false;
	}
};

(0, _objectAssign2['default'])(SettingsProto, _events.EventEmitter.prototype);

/**
 * Creates a settings object "instance". Default values may be passed
 * to create initial setting values. Validations are used to ensure values aren't set unless they
 * are valid.
 * @param {Object} options
 * @param {Object} options.defaults
 * @param {Object} options.validations
 */
function Settings() {
	var options = arguments[0] === undefined ? {} : arguments[0];
	var _options$defaults = options.defaults;
	var defaults = _options$defaults === undefined ? {} : _options$defaults;
	var _options$validations = options.validations;
	var validations = _options$validations === undefined ? {} : _options$validations;

	var result = Object.create(SettingsProto);

	_events.EventEmitter.call(result);

	Object.defineProperty(result, '_settings', {
		value: (0, _objectAssign2['default'])({}, defaults)
	});

	Object.defineProperty(result, '_validations', {
		value: (0, _objectAssign2['default'])({}, validations)
	});

	return result;
}

Settings.prototype = SettingsProto;

exports['default'] = Settings;
module.exports = exports['default'];