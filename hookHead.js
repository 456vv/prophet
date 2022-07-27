if (!window.$W$) {
	$W$ = window;
}
if (!$W$.MyDb) {
	$W$.MyDb = {};
	$W$.MyXhr = XMLHttpRequest;
}

if (!$W$.$H$ || !$W$.$S$) {
	$W$.$H$ = function (s, n, functionType) {
		if (typeof s !== "string") {
			return s;
		}

		if (n == 3) {
			console.log("解析:", functionType, "内容");
			let xhr = new $W$.MyXhr();
			xhr.open("POST", "/handleJsCode", false);
			xhr.send(s);
			return xhr.responseText;
		}
		if(!$W$.$hooked$){
			return s
		}
		let trackObj = {};
		Error.captureStackTrace(trackObj);
		let _stack = trackObj.stack.split("\n")[n];

		if (functionType != "eval" && functionType != "Function") {
			_stack = "源代码:" + functionType + " " + _stack;
		}
		
		if(!($W$.MyDb[s] instanceof Array)){
			$W$.MyDb[s]=[];
		}
		
		let arr = $W$.MyDb[s],
			exists= false;
		for(let i = 0; i < arr.length; i++){
			if(arr[i].stack == _stack){
				arr[i].count++;
				exists=true;
				break;
			}
		}
		if(!exists){
			trackObj.count=1;
			trackObj.stack = _stack;
			$W$.MyDb[s].push(trackObj)
		}
		return s;
	};
	$W$.$S$ = function $S$(s) {
		let arr = $W$.MyDb[s];
		if (arr) {
			$W$.$hooked$=false;
			console.log("\t\t\t\t\t\t\t\t出现次数\t\t\t\t\t\t\t\t位置地址");
			for (let i = 0; i < arr.length; i++) {
				if (arr[i]) {
					console.log("\t\t\t\t\t\t\t\t", arr[i].count, "\t\t\t\t\t\t\t\t", arr[i].stack);
				}
			}
			return;
		}
		console.log("无数据！！");
	};
}
