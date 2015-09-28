'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;

var utils = require('./../utils');

describe('normalizeError', function () {
	var normalizeError = utils.normalizeError;

	it('Should be defined as function', function() {
		expect(normalizeError).to.be.a.function;
	});

	it('Should not throw an error when passed an empty object', function () {
		expect(normalizeError).to.not.throw;
	});

	it('Should normalize line and number properties', function () {
		var line = 123;
		var column = 22;
		var expected = { line: line, column: column };

		expect(normalizeError({
			line: 123,
			col: 32
		})).to.include.keys(['line', 'column']);

		expect(normalizeError({
			lineNumber: 123,
			column: 32
		})).to.include.keys(['line', 'column']);

		expect(normalizeError({
			loc: {
				line: line,
				column: column
			}
		})).to.include.keys(['line', 'column']);
	});
}); // #setStatus

