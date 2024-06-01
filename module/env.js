!function (t, e) {
	"function" == typeof define && define.amd ? define(["exports"], e) : e("object" == typeof exports && "string" != typeof exports.nodeName ? module.exports : t);
}(this, function (t) {
	var new_window_paths = {}, isPrint = false, isTest = false, disabledPrint = true;
	function isPepeatPath (obj, path, vlaue) { if (obj.hasOwnProperty(path)) { return true }; obj[path] = vlaue; }
	function addDefineProperty (path, vlaue) {
		isPepeatPath(new_window_paths, path, vlaue)
	}
	function printLogPath (key, property) { return key + "." + String(property); }
	function vmProxy (object, key) {
		return new Proxy(object, {
			set: function (target, property, value) {
				var find = (property in target),
					path = printLogPath(key, property)
				if (!find) {
					addDefineProperty(path, value)
				}

				if (!disabledPrint && isTest || (isPrint && !find)) {
					console.log("<-set: ", path, " = ", typeof value);
				}

				return Reflect.set(target, property, value)
			},
			get: function (target, property) {
				var path = printLogPath(key, property),
					find = !(target[property] == undefined)
				if (!find) {
					addDefineProperty(path)
				}

				if (!disabledPrint && isTest || (isPrint && !find)) {
					console.log("get->: ", path, " = ", target[property]);
				}

				return target[property];
			},
			has: function (target, property) {
				var find = (property in target),
					path = printLogPath(key, property)
				if (!find) {
					addDefineProperty(path)
				}
				if (!disabledPrint && isTest || (isPrint && !find)) {
					console.log("<has>: ", path, " in ", find);
				}
				return find;
			}
		});
	}

	function internal (key, obj) {
		return Function("$1", "$2", "return (typeof  window[$1] == 'undefined') ?  window[$1] = $2: window[$1]")(key, obj)
	}
	function init () {
		if (global.defaultInit) {
			return t
		}
		global.defaultInit = true
		disabledPrint = false
		window = vmProxy(global, "window");
		self = vmProxy(global, "self");
		document = vmProxy(internal("document", {}), "document")
		location = vmProxy(internal("location", {}), "location")
		navigator = vmProxy(internal("navigator", {}), "navigator")
		history = vmProxy(internal("history", {}), "history")
		screen = vmProxy(internal("screen", {}), "screen")
		chrome = vmProxy(internal("chrome", {}), "chrome")
		chromeon = vmProxy(internal("chromeon", {}), "chromeon")
		localStorage = vmProxy(internal("localStorage", {}), "localStorage")
		sessionStorage = vmProxy(internal("sessionStorage", {}), "sessionStorage")
		disabledPrint = true
		return t
	}

	function print (ok) {
		isPrint = ok
		new_window_paths = {}
	}
	function repair () {
		return new_window_paths
	}
	function test (func, no_print) {
		isTest = typeof no_print != "undefined" ? no_print : true
		try {
			return func()
		} catch (err) {
			console.log(err)
		}
		isTest = false
	}

	t.print = print
	t.repair = repair
	t.vmProxy = vmProxy
	t.test = test
	t.init = init
})

