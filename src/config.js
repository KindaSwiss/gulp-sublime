'use strict';

/**
 * @file Contains the plugin settings
 */

import Settings from './settings';
import { createUID } from './utils';




const config = Settings({
	defaults: {
		pluginName: 'gulp-sublime',
		pluginID: createUID(),
	}
});




export default config;