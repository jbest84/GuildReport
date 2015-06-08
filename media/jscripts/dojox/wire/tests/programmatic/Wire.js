if(!dojo._hasResource["dojox.wire.tests.programmatic.Wire"]){
dojo._hasResource["dojox.wire.tests.programmatic.Wire"] = true;
dojo.provide("dojox.wire.tests.programmatic.Wire");

dojo.require("dojox.wire.Wire");

tests.register("dojox.wire.tests.programmatic.Wire", [

	function test_Wire_property(t){
		var source = {a: "A", b: {c: "B.C"}};
		var target = {a: "a", b: {c: "b.c"}};
		var value = new dojox.wire.Wire({object: source, property: "a"}).getValue();
		new dojox.wire.Wire({object: target, property: "a"}).setValue(value);
		t.assertEqual(source.a, target.a);

		// child property
		value = new dojox.wire.Wire({object: source, property: "b.c"}).getValue();
		new dojox.wire.Wire({object: target, property: "b.c"}).setValue(value);
		t.assertEqual(source.b.c, target.b.c);

		// new property
		target = {};
		value = new dojox.wire.Wire({object: source, property: "a"}).getValue();
		new dojox.wire.Wire({object: target, property: "a"}).setValue(value);
		t.assertEqual(source.a, target.a);

		// new parent and child property
		target.b = {};
		value = new dojox.wire.Wire({object: source, property: "b.c"}).getValue();
		new dojox.wire.Wire({object: target, property: "b.c"}).setValue(value);
		t.assertEqual(source.b.c, target.b.c);

		// new parent and child property
		target = {};
		value = new dojox.wire.Wire({object: source, property: "b.c"}).getValue();
		new dojox.wire.Wire({object: target, property: "b.c"}).setValue(value);
		t.assertEqual(source.b.c, target.b.c);

		// new array property
		source = {a: ["A"]};
		target = {};
		value = new dojox.wire.Wire({object: source, property: "a[0]"}).getValue();
		new dojox.wire.Wire({object: target, property: "a[0]"}).setValue(value);
		t.assertEqual(source.a[0], target.a[0]);

		// by getter/setter
		source = {getA: function() { return this._a; }, _a: "A"};
		target = {setA: function(a) { this._a = a; }};
		value = new dojox.wire.Wire({object: source, property: "a"}).getValue();
		new dojox.wire.Wire({object: target, property: "a"}).setValue(value);
		t.assertEqual(source._a, target._a);

		// by get/setPropertyValue
		source = {getPropertyValue: function(p) { return this["_" + p]; }, _a: "A"};
		target = {setPropertyValue: function(p, v) { this["_" + p] = v; }};
		value = new dojox.wire.Wire({object: source, property: "a"}).getValue();
		new dojox.wire.Wire({object: target, property: "a"}).setValue(value);
		t.assertEqual(source._a, target._a);
	},

	function test_Wire_type(t){
		var source = {a: "1"};
		var string = new dojox.wire.Wire({object: source, property: "a"}).getValue();
		t.assertEqual("11", string + 1);
		var number = new dojox.wire.Wire({object: source, property: "a", type: "number"}).getValue();
		t.assertEqual(2, number + 1);
	},

	function test_Wire_converter(t){
		var source = {a: "1"};
		var converter = {convert: function(v) { return v + 1; }};
		var string = new dojox.wire.Wire({object: source, property: "a", converter: converter}).getValue();
		t.assertEqual("11", string);
		var number = new dojox.wire.Wire({object: source, property: "a", type: "number", converter: converter.convert}).getValue();
		t.assertEqual(2, number);
	}

]);

}
