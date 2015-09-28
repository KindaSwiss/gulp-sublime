'use strict';

import assign from 'object-assign';
import { EventEmitter } from 'events';
import util from 'util';




const SettingsProto = {
	/**
	 * Sets a setting with the values passed.
	 * @param {Object} 0.values
	 * @param {String} 0.name
	 * @param {String} 1.value
	 */
	set: function () {
		const args = Array.prototype.slice.call(arguments);
		const data = {};
		const validations = {};
		let values;
		let changes = [];

		// if the value passed is an object
		if (args.length === 1 && util.isObject(args[0])) {
			values = args[0];
		} else { // if key and value were passed
			const name = args[0];
			const value = args[1];
			values = { [name]: value };
		}

		for (let name in values) {
			let value = values[name];
			let passed = true;

			if (name in this._validations) {
				passed = this._validations[name](value);
				validations[name] = passed;

				// Don't set the setting if it doesn't pass validation
				if ( ! passed) {
					continue;
				}
			}

			this._settings[name] = value;
			changes.push(name);
		}

		data.changes = changes;
		data.validations = validations;

		changes.forEach(name => this.emit(`change:${name}`, data), this);

		// Notify of settings change
		this.emit('change', data);

		return assign({}, validations);
	},

	/**
	 * Returns whether the settings object contains the specified name.
	 * @param  {String}  name
	 * @return {Boolean}
	 */
	has: function (name) {
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
	get: function (name, defaultValue) {
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
	isValid: function (name, value) {
		if (this._validations.hasOwnProperty(name)) {
			return this._validations[name](value);
		}

		return false;
	}
};

assign(SettingsProto, EventEmitter.prototype);




/**
 * Creates a settings object "instance". Default values may be passed
 * to create initial setting values. Validations are used to ensure values aren't set unless they
 * are valid.
 * @param {Object} options
 * @param {Object} options.defaults
 * @param {Object} options.validations
 */
function Settings(options={}) {
	const { defaults={}, validations={} } = options;
	const result = Object.create(SettingsProto);

	EventEmitter.call(result);

	Object.defineProperty(result, '_settings', {
		value: assign({}, defaults)
	});

	Object.defineProperty(result, '_validations', {
		value: assign({}, validations)
	});

	return result;
}

Settings.prototype = SettingsProto;




export default Settings;