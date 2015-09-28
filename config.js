'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @file Contains the plugin settings
 */

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _utils = require('./utils');

var config = (0, _settings2['default'])({
	defaults: {
		pluginName: 'gulp-sublime',
		pluginID: (0, _utils.createUID)()
	}
});

exports['default'] = config;
module.exports = exports['default'];