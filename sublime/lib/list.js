'use strict';

/**
	* Check whether an array contains an item 
	* @param {[type]} array [description]
	* @param {[type]} item  [description]
	*/
var ArrayHas = function(array, item) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === item) { return true; }
	}
	return false;
};

/**
 * Remove an item from an array 
 * @param {Array} array 
 * @param {Any} item
 */
var ArrayRemove = function(array, item) {
	var index = array.length;
	while(index--) {
		if (array[index] === item) {
			array.splice(index, 1);
		}
	}
	return array;
};




/**
 * Get an index from a negative index
 * @param  {Integer} index
 * @return {Integer} 
 */

// Remove index = 0???
var getIndex = function(index, length) {
	if (index < 0) {
		index = length + index;
	}
	if (index < 0) { index = 0; }
	return index;
};




var list = {
	/**
	 * Is meant to be run on list of objects. Return matches 
	 * where object's property is a certiain value 
	 *
	 * The name can be separated by dots to represent a deep property 
	 * 
	 * @param  {String} names
	 * @param  {Any} value
	 */
	where: function (names, value) {
		names = names.split('.');
		var matches = [];
		var i = 0, len = this._items.length;

		for (; i < len; i++) {
			var item = this._items[i];
			var comparator = item;
			var j = 0;

			while (comparator !== undefined && comparator !== null) {
				var name = names[j];
				comparator = comparator[name];
				j++;
				if (comparator === value) {
					matches.push(item);
					break;
				}
			}
		}
		return List(matches);
	},
	whereOne: function (name, value) {
		return this.where(name, value)._items[0] || null;
	},
	remove: function (item) {
		ArrayRemove(this._items, item);
		return this;
	},
	append: function (item) {
		this._items.push(item);
		return this;
	},
	push: function (item) {
		this._items.push(item);
		return this;
	},
	has: function (item) {
		return ArrayHas(this._items, item);
	},
	each: function (callback, context) {
		Array.prototype.forEach.call(this._items, callback, context);
	},

	/**
	 * Remove an item from he array by index. 
	 *
	 * The index starts counting from 0, so the 3rd item is index 2
	 * @param  {Integer} index
	 * @return {Any} Returns the item removed 
	 */
	pop: function (index) {
		var length = this._items.length;
		if (index === undefined) {
			index = length;
		}
		index = getIndex(index, length);
		if (index > this._items.length || index < 0) { throw new Error('List index out of range'); }
		return this._items.splice(index, 1)[0];
	},
	/**
	 * Insert an item into the list. 
	 *
	 * The index starts from 0. 
	 * @param  {Integer} index
	 * @param  {Any} item 
	 * @return {this}
	 */
	insert: function (index, item) {
		var length = this._items.length;
		index = getIndex(index, length);
		this._items.splice(index, 0, item);
		return this;
	},

	index: function (item) {
		var i = 0, len = this._items.length;
		for (; i < len; i++) {
			if (this._items[i] === item) {
				return i;
			}
		}
		return -1;
	},

	// 
	extend: function (array) {
		if (Array.isArray(array._items)) {
			array = array._items;
		}
		this._items = this._items.concat(array);
		return this;
	},

	reverse: function () {
		this._items.reverse();
		return this;
	},
	item: function (index) {
		index = getIndex(index, this._items.length);
		return this._items[index];
	},
	items: function () {
		return this._items.splice(0);
	},
	unique: function () {

	},
	get length () {
		return this._items.length;
	}
};


var List = function (items) {
	var l = Object.create(list);
	l._items = Array.isArray(items) ? items.splice(0) : [];
	return l;
};


// var i = [{ 'id': 'cool', 'report': { 'id': 'cool' } }];
// var a = List(i);
// console.log(a.where('report.id', 'cool'))

// var a = List(['one', 'two', 'three']);
// a.pop(2)
// a.insert(-1, 3);
// console.log(a._items)

module.exports = List;











