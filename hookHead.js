!(function (win) {
	if (!win.$H) {
		let db = {},
			filter = {},
			before_text = "",
			MyXhr = XMLHttpRequest,
			captureStackTrace = Error.captureStackTrace,
			log = console.log;
		Error.captureStackTrace = function (s) { s.stack = "" };

		function LS (a) {
			win[a] = localStorage.getItem(a)
		}
		Object.defineProperty(win, "onerror", {
			set: function () { }
		}),
			LS("$rcode"),//判断代码
			LS("$rval"),//判断值
			LS("$debugger"),//断点
			LS("$record");//记录

		function getFilter (text) {
			let text_ = (text + "_"), f = filter[text_]
			function has (before_text) {
				if (!f) { return false }
				return f.indexOf(before_text) != -1
			}
			function add (before_text) {
				if (!f) { f = filter[text_] = [] }
				!has(before_text) && f.push(before_text)
			}
			return { has, add }
		}
		function caputeRecord (s, _stack, text) {
			if (!(db[s] instanceof Array)) {
				db[s] = [];
			}

			let arr = db[s], exists = false;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i].stack == _stack) {
					if (arr[i].count > 20) {//防止在循环内操作，限20次足够了。
						getFilter(text).add(before_text)
					}
					arr[i].count++;
					exists = true;
					break;
				}
			}
			if (!exists) {
				db[s].push({
					count: 1,
					stack: _stack,
				})
			}
		}
		win.$H = function (s, text, type) {
			if (typeof text == "number") { type = text; text = undefined; }
			if (text == undefined) { text = s }
			let st = (typeof s == "string"), sn = (typeof s == "number");

			if (!(st || sn) || getFilter(text).has(before_text)) {
				before_text = text
				return s;
			}
			if (type == 1) {
				let xhr = new MyXhr();
				xhr.open("POST", "/hook_jscode", false);
				xhr.send(s);
				return xhr.responseText;
			}

			let rv_ok = (st && win.$rval && new RegExp(win.$rval).test(String(s))),
				rs_ok = (win.$rcode && new RegExp(win.$rcode).test(text)),
				trackObj = {};
			if (rs_ok || rv_ok || (win.$record && st)) {
				captureStackTrace(trackObj);
				var _stack = text + " => " + trackObj.stack.split("\n")[2];

				if (rs_ok || rv_ok) {
					log(s, " => ", _stack);
					//if(typeof win.$debug == "function"){
					//	win.$debug(s, text, type)
					//}
					if (win.$debugger) { debugger }
				}
				if (win.$record) {
					let val = rv_ok ? win.$rval : rs_ok ? win.$rcode : s;
					caputeRecord(val, _stack, text)
				}
			}
			before_text = text
			return s;
		};

		var bindf = win.$onfunc = {};
		win.$F = function (func, args, text) {
			if (bindf.hasOwnProperty(text)) {
				return bindf[text](func, args);
			}
			var is_win = func.name in win && win[func.name] == func;
			return func.apply(is_win ? win : func, args)
		};
		var bindm = win.$onmethod = {};
		win.$M = function (pro, name, args, text) {
			if (bindm.hasOwnProperty(text)) {
				return bindm[text](pro, name, args);
			}
			if (name == "apply") {
				return pro.apply(args[0], args[1])
			}
			if (name == "call") {
				return pro.apply(args[0], args.slice(1))
			}
			return pro[name].apply(pro, args)
		};
		win.$S = function (s) {
			var arr = [];
			if (typeof s == "object") {
				for (var k in db) {
					if (s.test(k)) {
						arr.push({
							name: k,
							position: db[k]
						})
					}
				}
			} else if (!db[s]) {
				log("无数据！！");
				return
			} else {
				arr = [{
					name: s,
					position: db[s]
				}]
			}
			for (let i = 0; i < arr.length; i++) {
				log("出现次数\t\t\t\t\t\t\t\t位置地址");
				let name = arr[i].name, position = arr[i].position;
				for (let ii = 0; ii < position.length; ii++) {
					if (position[ii]) {
						log(String(position[ii].count), "\t\t\t\t\t\t\t\t", name, " => ", position[ii].stack);
					}
				}
			}
		};
		win.$C = function () {
			filter = {}
			db = {}
		}
		function onExit (e) {
			if (win.$debugger) {
				debugger;
			}
		}
		win.addEventListener("unload", onExit)
		win.addEventListener("beforeunload", onExit)

		if (win.$debugger) {
			debugger;
		}
	}
})(window);
