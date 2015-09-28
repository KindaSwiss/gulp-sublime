'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;

var util = require('util');

var Settings = require('./../settings');




describe('Settings', function () {
	it('Should be a function', function () {
		expect(Settings).to.be.a.function
	});

	it('Should return an object', function () {
		expect(Settings()).to.be.an.object
	});

	it('Should set defaults when passed', function () {
		var expected = { peanut: 'butter', chocolate: 'chip' };
		var defaults = { peanut: 'butter', chocolate: 'chip '};

		expect(Settings({ defaults: defaults })._settings)
			.to.have.property('peanut')
			.to.equal(expected.peanut);
	});

	it('#has', function () {
		it('Should return whether the key is stored in the properties', function () {
			var settings = Settings({ defaults: { peanut: 'butter' } });
			expect(settings.has('thiskeydoesnotexist')).to.be.false;
			expect(settings.has('peanut')).to.be.true;
		});
	});

	describe('#get', function () {
		it('Should retrieve a setting property from its `_setting` object', function () {
			var expected = 'butter';
			var settings = Settings();
			var key = 'peanut';
			settings._settings[key] = 'butter';
			expect(settings.get(key)).to.equal(expected);
		});
		it('Should return the default value passed if the object does not contain the key', function () {
			var settings = Settings();
			var defaultValue = 'peanut';
			expect(settings.get('thiskeydoesnotexist', defaultValue)).to.equal(defaultValue);

			settings._settings['peanut'] = undefined;
			expect(settings.get('peanut', 123)).to.be.undefined;
		});
	});

	describe('#set', function () {
		it('Should accept key and value as arguments and store the key and value', function () {
			var settings = Settings();
			var key = 'peanut';
			var expected = 'butter';
			settings.set(key, expected);
			expect(settings._settings).to.have.property(key).to.equal(expected);
		});

		it('Should accept an object as an argument', function () {
			var settings = Settings();
			var expected = 'butter';
			var values = { peanut: expected };
			settings.set(values);
			expect(settings._settings).to.have.property('peanut').to.equal(expected);
		});

		it('Should cause a `change` event to be emitted passing the keys of the properties that were changed',
			function (done) {
			var settings = Settings();
			var key = 'peanut';
			var expected = 'butter';

			settings.on('change', function (data) {
				expect(data.changes).to.include(key);
				done();
			});

			settings.set(key, expected);
		});

		it('Should return the validations',
			function () {
			var settings = Settings({
				validations: {
					peanut: util.isString
				}
			});

			var key = 'peanut';
			var expected = 'butter';
			var validations = settings.set(key, expected);
			expect(validations).to.deep.equal({ peanut: true });
		});
	});

	describe('#isValid', function () {
		it('Should return whether a setting is a valid value for a specific property based on the validations passed', function () {
			var settings = Settings({
				validations: {
					peanut: util.isString
				}
			});

			expect(settings.isValid('peanut', 123123)).to.be.false;
			expect(settings.isValid('peanut', 'butter')).to.be.true;
		});
	});

	describe('Events#changes', function () {
		it('Should return true if a setting is valid', function () {
			var settings = Settings({
				defaults: {
					peanut: 'butter',
				},
				validations: {
					peanut: util.isString,
					foo: Number.isFinite,
				}
			});

			settings.on('change', function (changes) {
				expect(changes).to.be.an.object;
				expect(changes.validations).to.be.an.object;
				expect(changes.validations.peanut).to.be.true;
			});

			settings.set({ peanut: 'hello', foo: 123 });
		});
	})
});