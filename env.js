!function (t, e) {
  "function" == typeof define && define.amd ? define(["exports"], e) : e("object" == typeof exports && "string" != typeof exports.nodeName ? module.exports : t);
}(this, function (t) {
	var new_window_paths = {},isPrint=false;
	function isPepeatPath (obj, path, vlaue) { if (obj.hasOwnProperty(path)) { return true }; obj[path] = vlaue; }
	function addDefineProperty (path, vlaue) {
		isPepeatPath(new_window_paths, path, vlaue)
	}
	function printLogName (target) {
		if(target == global){
			return "window"
		}
		var matched = target.toString().match(/\[object (\w+)\]/)
		return matched? matched[1]:target.name || "undefined"
	}
	function printLogPath (key, property) {return key + "." + String(property); }
	function vmProxy (object, key) {
		if(object instanceof vmProxy){
			return object
		}
		return new Proxy(object, {
			set: function (target, property, value) {
				var find = (property in target),
					path = printLogPath(key, property)
				if(!find){
					addDefineProperty(path, value)
					isPrint && console.log("set: ", path, " = ", typeof value);
				}
				return Reflect.set(target, property, value)
			},
			get: function (target, property) {
				var path =  printLogPath(key, property)
				if (target[property] == undefined) {
					addDefineProperty(path)
					isPrint && console.log("get: ", target[property], " = ", path);
				}
				return target[property];
			},
			has: function (target, property) {
				var find = (property in target),
					path = printLogPath(key, property)
				if (!find) {
					addDefineProperty(path)
					isPrint && console.log("has: ",  path, " in ", find);
				}
				return find;
			}
		});
	}

	function init(){
		window = vmProxy(global, "window");
		document = vmProxy((typeof document == "undefined")?{}:document, "document")
		location = vmProxy((typeof location == "undefined")?{}:location, "location")
		navigator = vmProxy((typeof navigator == "undefined")?{}:navigator, "navigator")
		history = vmProxy((typeof history == "undefined")?{}:history, "history")
		screen = vmProxy((typeof screen == "undefined")?{}:screen, "screen")
		chrome = vmProxy((typeof chrome == "undefined")?{}:chrome, "chrome")
		chromeon = vmProxy((typeof chromeon == "undefined")?{}:chromeon, "chromeon")
		localStorage = vmProxy((typeof localStorage == "undefined")?{}:localStorage, "localStorage")
		sessionStorage = vmProxy((typeof sessionStorage == "undefined")?{}:sessionStorage, "sessionStorage")
		return t
	}

	function print(){
		console.log(new_window_paths)
		new_window_paths={}
	}
	function repair(){
		return new_window_paths
	}
	function test(func){
		isPrint=true
		try{
			return func.apply(func, Array.prototype.slice.call(arguments, 1))
		}catch(err){
			console.log(err)
		}
	}

	t.print = print
	t.repair = repair
	t.vmProxy = vmProxy
	t.test = test
	t.init = init
})

