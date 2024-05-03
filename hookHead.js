(function (win) {
	if (!win.$W) {
		let W = win.$W = win,
			db = win.$DB = {},
			MyXhr = XMLHttpRequest,
			captureStackTrace = Error.captureStackTrace;
		Error.captureStackTrace = function (s) { s.stack = "" };

		function LS (a) {
			W[a] = localStorage.getItem(a),
				localStorage.removeItem(a)
		}
		Object.defineProperty(W, "onerror", {
			set: function () { }
		}),
			LS("$rcode"),//判断代码
			LS("$rval"),//判断值
			LS("$debugger"),//断点
			LS("$record");//记录

		function caputeRecord (s, _stack) {
			if (!(db[s] instanceof Array)) {
				db[s] = [];
			}

			let arr = db[s], exists = false;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i].stack == _stack) {
					if (arr[i].count > 1000) {
						console.log("怀疑进入循环，可使用$goto跳过:", _stack)
						debugger;
					}
					arr[i].count++;
					exists = true;
					break;
				}
			}
			var trackObj = {}
			if (!exists) {
				trackObj.count = 1;
				trackObj.stack = _stack;
				db[s].push(trackObj)
			}
		}

		W.$H = function (s, text, type) {
			let st = (typeof s == "string"), nt = typeof s == "number";

			var goto = (W.$goto && (new RegExp(W.$goto).test(text)))
			if (goto) {
				W.$goto = null
				debugger
			}
			if (!st && !nt || (W.$goto && !goto)) { return s; }
			if (type == 1) {
				console.log("解析(" + text + "): ", s);
				let xhr = new MyXhr();
				xhr.open("POST", "/handleJsCode", false);
				xhr.send(s);
				return xhr.responseText;
			}

			let rs_ok = (W.$rcode && new RegExp(W.$rcode).test(text)),
				rv_ok = (W.$rval && new RegExp(W.$rval).test(String(s))),
				trackObj = {}, _stack = "";

			if (rs_ok || rv_ok || W.$record) {
				captureStackTrace(trackObj);
				_stack = trackObj.stack.split("\n")[2];
				_stack = "源代码:" + text + " " + _stack;

				if (rs_ok || rv_ok) {
					console.log(s, _stack);
					if (W.$debugger) { debugger }
				}
				if (W.$record) {
					caputeRecord(s, _stack)
				}
			}
			return s;
		};
		W.$S = function (s) {
			let arr = db[s];
			if (arr) {
				W.$record = false;
				console.log("出现次数\t\t\t\t\t\t\t\t位置地址");
				for (let i = 0; i < arr.length; i++) {
					if (arr[i]) {
						console.log(arr[i].count, "\t\t\t\t\t\t\t\t", arr[i].stack);
					}
				}
				return;
			}
			console.log("无数据！！");
		};
	}
})(window);
