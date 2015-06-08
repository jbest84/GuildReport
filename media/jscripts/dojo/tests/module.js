if(!dojo._hasResource["dojo.tests.module"]){
dojo._hasResource["dojo.tests.module"] = true;
dojo.provide("dojo.tests.module");

try{
	dojo.require("tests._base");
	dojo.require("tests.i18n"); 
	dojo.require("tests.cldr");
	dojo.require("tests.data");
	dojo.require("tests.date");
	dojo.require("tests.number");
	dojo.require("tests.currency");
	dojo.require("tests.AdapterRegistry");
	dojo.require("tests.io.script");
	dojo.require("tests.io.iframe");
	dojo.require("tests.rpc");
	dojo.require("tests.string");
	dojo.require("tests.behavior");
	dojo.require("tests.parser");
}catch(e){
	doh.debug(e);
}

}
