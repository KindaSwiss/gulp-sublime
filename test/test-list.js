var List = require('../sublime/lib/list');
var assert = require('chai').assert;
var expect = require('chai').expect;


/*
remove
append
push
has
each
pop
insert
index
extend
reverse
length

where
whereOne

*/
describe('List', function () {

	var list;
	var _items;

	afterEach(function () {

		list = null;
		_items = null;

	});

	beforeEach(function () {

		list = List([1, 2, 3]);
		_items = list._items;

	});

	describe('Constructor', function () {

		it('Should return an object', function () {
			var list = List();
			expect(list).to.be.a('object');
		});

		it('Should return an object with a property that is an array', function () {
			var list = List();

			expect(list).to.be.a('object');
		});

		it('Should accept an initial array of items', function () {
			expect(_items)
				.to.be.a('array')
				.to.include(1)
				.to.include(2)
				.to.include(3);
		});


	});

	describe('#has', function () {

		it('Should return whether or not an item is contained within the list', function () {

			expect(list.has(1)).to.be.ok;
			expect(list.has(2)).to.be.ok;
			expect(list.has(3)).to.be.ok;

			expect(list.has(4)).to.not.be.ok;

		});

	});

	describe('#append', function () {

		it('Should add an item to the list', function () {

			list.append(4);
			expect(_items).to.include(4);

		});

	});

	describe('#remove', function () {

		it('Should remove an individual item from its array', function () {

			list.remove(1);
			expect(_items).to

		});

	});

	describe('#pop', function () {

		it('Should remove an item from the array by index', function () {

			list.pop(2);
			expect(_items).to.not.include(3);

		});

		it('Should remove from the end when given a negative index', function () {

			list.pop(-1);
			expect(_items).to.not.include(3);

		});

		it('Should return the item removed', function () {

			var item = list.pop(-1);
			expect(item).to.equal(3);

		});

	});

	describe('#index', function () {

		it('Should return the index of an item', function () {

			var index = list.index(3);
			expect(index).to.equal(2);

		});

		it('Should return the -1 when the item is not in the list', function () {

			var index = list.index(4);
			expect(index).to.equal(-1);

		});

	});

	describe('#insert', function () {

		it('Should insert an item into a certain index', function () {

			list.insert(0, 4);
			expect(_items)
				.to.be.a('array')
				.with.deep.property('[0]')
				.to.equal(4)

		});

	});

	describe('#extend', function () {

		it('Should append each item of another list into the list', function () {

			list.extend([4,5,6]);

			expect(list._items)
				.to.be.a('array')
				.to.include(4)

			expect(list._items)
				.to.be.a('array')
				.to.include(5)

			expect(list._items)
				.to.be.a('array')
				.to.include(6);

		});

	});

	describe('#reverse', function () {

		it('It should reverse the items in the list', function () {

			list.reverse();
			expect(_items)
				.to.be.a('array')
				.with.deep.property('[0]')
				.to.equal(3);

		});

	});

	describe('#each', function () {

		it('Should iterate over each item in the list', function (done) {

			list.each(function (value) {
				if (value === _items.length) {
					done();
				}
			});
			
		});

	});

	describe('#length', function () {

		it('Should return the number of items in the list', function () {

			expect(list.length).to.equal(_items.length);

			list.pop()
			
			expect(list.length).to.equal(_items.length);

		});

	});

	describe('#item', function () {

		it('Should return a list of objects where the objects contain a certain property', function () {
			var list = List([{'id': 'cool'}, {'id': 'awesome'}]);
			var item = list.item(0);

			expect(item)
				.that.deep.equals({'id': 'cool'});

			item = list.item(-1);
			expect(item)
				.that.deep.equals({'id': 'awesome'});

		});

	});

	describe('#where', function () {

		it('Should return a list of objects where the objects contain a certain property', function () {
			var items = [{'id': 'cool'}, {'id': 'cool'}, {'id': 'awesome'}];
			var list = List(items);
			var matches = list.where('id', 'cool');

			expect(matches._items)
				.with.deep.property('[0]')
				.that.deep.equals({'id': 'cool'})

			expect(matches._items)
				.with.deep.property('[1]')
				.that.deep.equals({'id': 'cool'})

		});

	});

	describe('#whereOne', function () {

		it('Should return the first result of list#where', function () {
			var firstItem = {'id': 'cool'};
			var items = [firstItem, {'id': 'cool'}, {'id': 'awesome'}];
			var list = List(items);
			var match = list.whereOne('id', 'cool');

			expect(match)
				.to.equal(firstItem)
		});

	});

});