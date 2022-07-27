
const json = require("./JSON.prune");
const fs = require("fs");

let eval_env_script_text_all = "", eval_env_script_text = "", base_script = "";
//还有什么变量可在这里增加
const proxy_array = [
	"window",
	"window.document",
	"window.location",
	"window.navigator",
	"window.history",
	"window.screen",
	"window.chrome",
	"window.chromeon",
	"window.localStorage"
];
function isPepeatPath(obj, path) { if (obj[path]) { return true }; obj[path] = true; }
//记录读取的可用环境变量
//用于过滤多余无用的环境变量
var new_window = {}, new_window_paths = {};
function addDefineProperty(path) {
	if (isPepeatPath(new_window_paths, path)) { return }

	var nw = new_window, w = window, paths = path.split("."), paths_len = paths.length;
	paths.forEach(function (k, i) {
		if (!nw[k]) {
			if (typeof w[k] == "function") {
				if (w[k].name.indexOf("_") != -1) {
					nw[k] = {}
					return;
				}
				nw[k] = w[k].toString();
				return;
			}
			if (typeof w[k] != "object") {
				nw[k] = w[k];
				return
			}
			nw[k] = {}
		}
		nw = nw[k];
		w = w[k];
	})
}
function debuggerLogName(target) {
	var targetName = target == global ? "window" : target,
		isProxyObject = proxy_array.find(s => s.replace(".", "_") == (target.name || ""));
	if (isProxyObject) {
		targetName = isProxyObject
	}
	return targetName
}
function debuggerLogPath(target, property) { return debuggerLogName(target) + "." + property; }

//hook Proxy
let debuggerKey = "", debuggerLog = false;
let vmProxyRepeatPath_get = {}, vmProxyRepeatPath_has = {};
function vmProxy(object) {
	return new Proxy(object, {
		set: function (target, property, value) {
			if (!proxy_array.find(s => s.indexOf(property) != -1)) {
				if (debuggerLog) {
					console.log("set: ", debuggerLogPath(target, property), "|", value);
				}
			}
			return Reflect.set(...arguments);
		},
		get: function (target, property) {
			if (target[property] == undefined) {
				//用于找出【不】可用环境变量
				if (debuggerLog) {
					console.log("get: ", debuggerLogPath(target, property), "|", target[property]);
				}
				//拼接脚本
				eval_env_script_text = (target.name || "window").replaceAll("_", ".") + "." + property;
				if (property == debuggerKey) {
					debugger
					//throw new Error("webdriver")
				}
			} else {
				//用于找出可用环境变量
				let path = debuggerLogPath(target, property);
				addDefineProperty(path);
				if (debuggerLog && !isPepeatPath(vmProxyRepeatPath_get, path)) {
					console.log("get->: ", path);
				}
			}
			return target[property];
		},
		has: function (target, property) {
			//用于找出【不】可用环境变量--暂未改进
			//用于找出可用环境变量
			let path = debuggerLogPath(target, property);
			addDefineProperty(path);
			if (debuggerLog && !isPepeatPath(vmProxyRepeatPath_has, path)) {
				console.log("has->: ", path);
			}
			return property in target;
		}
	});
}
proxy_array.forEach(function (k) {
	base_script += k + " = " + "{};\r\n";
	if (k == "window") {
		window = vmProxy(global);
		return
	}
	var kn = k.replaceAll(".", "_");
	eval(kn + "_pro={};" + k + " = vmProxy(function " + kn + "(){return " + kn + "_pro})");
});

//显示错误信息
function set_env_script_func(err) {
	console.log("err:", err, "\n");
	if (err.message.indexOf("Cannot read") != -1) {
		eval_env_script_text += ' = "";';
	} else if (err.message.indexOf("is not a function") != -1) {
		eval_env_script_text += " = function() {return {};}";
	}
	eval(eval_env_script_text);
	eval_env_script_text_all += "\r\n" + eval_env_script_text;
};

//设置环境变量
function setDefineProperty(self, obj) {
	var self_pro = (typeof self == "function") ? (eval(self.name + "_pro")) : {};
	for (var k in obj) {
		let v = obj[k];
		if (v && !(v instanceof Array)) {
			if (typeof v == "object") {
				self[k] = self_pro[k] = {};
				setDefineProperty(self[k], v)
				continue;
			}
			if (typeof v == "function") {
				self[k] = self_pro[k] = v;
				continue;
			}
		}
		self_pro[k] = v;
		Object.defineProperty && Object.defineProperty(self, k, { value: v, writable: false });
	}
}

//执行补环境
function complementEnv(path, count) {
	let script_text = "console.log('文件路径不存在：" + path + "')";
	if (fs.existsSync(path)) {
		script_text = fs.readFileSync(path, {
			flag: "r",
			encoding: "utf8",
		}).toString();
	}
	for (let index = 0; index < (count || 1); index++) {
		try {
			eval(script_text);
		} catch (err) {
			set_env_script_func(err)
		}
		debuggerLog && console.log("result: \r\n" + base_script + eval_env_script_text_all);
	}
}

//默认window
let browser_window = {
	"outerHeight": 1440,
	"outerWidth": 2560,
	"DeviceOrientationEvent": function () { console.log("DeviceOrientationEvent:", arguments); },
	"DeviceMotionEvent": function () { console.log("DeviceMotionEvent", arguments); },
}
//setDefineProperty(window, browser_window);//修改上面，并删除注释符号，可使用

//默认screen，可自行使用 JSON.prune 在浏览器中打印出来，再复制过来
let browser_screen = { "availWidth": 1920, "availHeight": 1042, "width": 1920, "height": 1080, "colorDepth": 24, "pixelDepth": 24, "availLeft": 0, "availTop": 0, "orientation": { "angle": 0, "type": "landscape-primary", "onchange": null }, "onchange": null, "isExtended": false }
//setDefineProperty(window.screen, browser_screen);//修改上面，并删除注释符号，可使用

//默认history，可自行使用 JSON.prune 在浏览器中打印出来，再复制过来
let browser_history = { "length": 1, "scrollRestoration": "auto", "state": null, "back": new Function, "forward": new Function, "go": new Function, "pushState": new Function, "replaceState": new Function }
//setDefineProperty(window.history, browser_history);//修改上面，并删除注释符号，可使用

//默认navigator，可自行使用 JSON.prune 在浏览器中打印出来，再复制过来
let browser_navigator = { "vendorSub": "", "productSub": "20030107", "vendor": "Google Inc.", "maxTdouchPoints": 0, "scheduling": { "isInputPending": new Function }, "userActivation": { "hasBeenActive": true, "isActive": true }, "doNotTrack": null, "geolocation": { "clearWatch": new Function, "getCurrentPosition": new Function, "watchPosition": new Function }, "connection": { "onchange": null, "effectiveType": "4g", "rtt": 150, "downlink": 10, "saveData": false, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "plugins": { "0": {}, "1": {}, "2": {}, "3": {}, "4": {}, "length": 5, "item": new Function, "namedItem": new Function, "refresh": new Function }, "mimeTypes": { "0": {}, "1": {}, "length": 2, "item": new Function, "namedItem": new Function }, "pdfViewerEnabled": true, "webkitTemporaryStorage": { "queryUsageAndQuota": new Function, "requestQuota": new Function }, "webkitPersistentStorage": { "queryUsageAndQuota": new Function, "requestQuota": new Function }, "hardwareConcurrency": 8, "cookieEnabled": true, "appCodeName": "Mozilla", "appName": "Netscape", "appVersion": "5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36", "platform": "Win32", "product": "Gecko", "userAgent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36", "language": "zh-CN", "languages": ["zh-CN"], "onLine": true, "webdriver": false, "getGamepads": new Function, "javaEnabled": new Function, "sendBeacon": new Function, "vibrate": new Function, "bluetooth": { "getAvailability": new Function, "requestDevice": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "clipboard": { "read": new Function, "readText": new Function, "write": new Function, "writeText": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "credentials": { "create": new Function, "get": new Function, "preventSilentAccess": new Function, "store": new Function }, "keyboard": { "getLayoutMap": new Function, "lock": new Function, "unlock": new Function }, "managed": { "onmanagedconfigurationchange": null, "getManagedConfiguration": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "mediaDevices": { "enumerateDevices": new Function, "getSupportedConstraints": new Function, "getUserMedia": new Function, "ondevicechange": null, "getDisplayMedia": new Function, "setCaptureHandleConfig": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "storage": { "estimate": new Function, "persisted": new Function, "getDirectory": new Function, "persist": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "serviceWorker": { "controller": null, "ready": {}, "oncontrollerchange": null, "onmessage": null, "onmessageerror": null, "getRegistration": new Function, "getRegistrations": new Function, "register": new Function, "startMessages": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "wakeLock": { "request": new Function }, "deviceMemory": 8, "ink": { "requestPresenter": new Function }, "hid": { "onconnect": null, "ondisconnect": null, "getDevices": new Function, "requestDevice": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "locks": { "query": new Function, "request": new Function }, "mediaCapabilities": { "decodingInfo": new Function, "encodingInfo": new Function }, "mediaSession": { "metadata": null, "playbackState": "none", "setActionHandler": new Function, "setCameraActive": new Function, "setMicrophoneActive": new Function, "setPositionState": new Function }, "permissions": { "query": new Function }, "presentation": { "defaultRequest": null, "receiver": null }, "serial": { "onconnect": null, "ondisconnect": null, "getPorts": new Function, "requestPort": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "virtualKeyboard": { "boundingRect": {}, "overlaysContent": false, "ongeometrychange": null, "hide": new Function, "show": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "usb": { "onconnect": null, "ondisconnect": null, "getDevices": new Function, "requestDevice": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "xr": { "ondevicechange": null, "isSessionSupported": new Function, "requestSession": new Function, "supportsSession": new Function, "addEventListener": new Function, "dispatchEvent": new Function, "removeEventListener": new Function }, "userAgentData": { "brands": {}, "mobile": false, "platform": "Windows" }, "canShare": new Function, "share": new Function, "clearAppBadge": new Function, "setAppBadge": new Function, "getBattery": new Function, "getInstalledRelatedApps": new Function, "getUserMedia": new Function, "requestMIDIAccess": new Function, "requestMediaKeySystemAccess": new Function, "webkitGetUserMedia": new Function, "registerProtocolHandler": new Function, "unregisterProtocolHandler": new Function }
//setDefineProperty(window.navigator, browser_navigator);//修改上面，并删除注释符号，可使用

//默认location，可自行使用 JSON.prune 在浏览器中打印出来，再复制过来
let browser_location = { "ancestorOrigins": { "length": 0, "contains": new Function, "item": new Function }, "href": "https://mms.pinduoduo.com/login/?redirectUrl=https%3A%2F%2Fmms.pinduoduo.com%2F", "origin": "https://mms.pinduoduo.com", "protocol": "https:", "host": "mms.pinduoduo.com", "hostname": "mms.pinduoduo.com", "port": "", "pathname": "/login/", "search": "?redirectUrl=https%3A%2F%2Fmms.pinduoduo.com%2F", "hash": "", "assign": new Function, "reload": new Function, "replace": new Function }
//setDefineProperty(window.location, browser_location);//修改上面，并删除注释符号，可使用

//默认localStorage
let browser_localStorage = {
	data: {},
	getItem: function (a) {
		//console.log("getItem:", arguments)
		return this.data[a]
	},
	setItem: function (a, b) {
		this.data[a] = b;
		//console.log("setItem:", arguments)
	}
}
//setDefineProperty(window.localStorage, browser_localStorage);//修改上面，并删除注释符号，可使用

//默认document
let browser_document = {
	"cookie": "api_uid=CiEOOWLf5ehvAABTfznrAg==",
	"referrer": "https://mms.pinduoduo.com/",
	"getElementById": function () {
		//console.log("getbyid:", a);
		return "<head></head>";
	},
	"addEventListener": function (a, b) {
		//console.log("addEventListener:", a, b)
		return undefined;
	},
}
//setDefineProperty(window.document, browser_document);//修改上面，并删除注释符号，可使用
//document.getElementById.toString = function () { return "function getElementById() { [native code] }"; };

complementEnv("./script_context.js");
console.log("用到的环境（函数被转换成字符，需自己转到函数。内置函数需要自行删除！！）：\n", json(new_window));

//该文件测试用于提取拼多多anti-content，用于其它可能需要修改一下。