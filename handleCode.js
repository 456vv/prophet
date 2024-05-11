const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generator = require("@babel/generator").default;
const cheerio = require("cheerio");
const fs = require("fs");
const hookHeadJsCode = fs.readFileSync("./hookHead.js").toString();

function errLog (str, err, v) {
	console.log(str, err, v, generator(v).code);
}
function autoType (value, path) {
	switch (value.type) {
		case "Identifier":
			path = value.name; break;
		case "StringLiteral":
			path = value.value; break;
		case "NullLiteral":
			path = "null"; break;
		case "NumericLiteral":
			path = String(value.value); break;
		default:
			path = generator(value).code
	}
	return path || ""
}
function hookFunc (value, path, type) {
	var args = [value]
	if (value.type != "StringLiteral" && value.type != "NumericLiteral") {
		args.push(t.stringLiteral(autoType(value, path).toString().substring(0, 100)))
	}
	if (type) {
		args.push(t.numericLiteral(type))
	}
	return t.callExpression(t.identifier("$H"), args);
}
function availableType (type, success, fail) {
	switch (type) { case "Identifier": case "StringLiteral": case "NumericLiteral": case "CallExpression": case "MemberExpression": case "BinaryExpression": return success() }
	fail && fail(type)
}

function includeAllObjectProperty (node, path) {
	node.properties.forEach(function (v) {
		if (v.type == "ObjectProperty") {
			availableType(v.value.type, function () {
				v.value = hookFunc(v.value, path)
			})
		}
	})
}
function includeAllCallExpression (node, path) {
	if (node.type == "CallExpression") {
		if (node.callee.type == "Identifier" && node.callee.name.match(/^\$[FHM]$/)) {
			return
		}
		var f_args = node.arguments
		if (node.callee.type == "Identifier") {
			//A(1,2) to F(A,[1,2])

			var f_name = node.callee.name,
				f_code = generator(node).code.toString().substring(0, 100)
			node.callee.name = "$F"
			node.arguments = [t.identifier(f_name), t.arrayExpression(f_args), t.stringLiteral(f_code)]
		} else if (node.callee.type == "MemberExpression") {
			//A.B.C["D"](1,2) to $M(A.B.C,"D",[1,2])

			//A.B.C(1,2) >>C的类型是identifter
			//A.B["C"](1,2) >>C的类型是stringLiteral
			var o_name = node.callee.object,
				m_name = node.callee.property,
				f_code = generator(node).code.toString().substring(0, 100)

			if (!node.callee.computed && m_name.type == "Identifier") {
				m_name = t.stringLiteral(m_name.name)
			}
			node.callee = t.identifier("$M")
			node.arguments = [o_name, m_name, t.arrayExpression(f_args), t.stringLiteral(f_code)]
		} else {
			node.arguments.forEach(function (v, i) {
				availableType(v.type, function () {
					node.arguments[i] = hookFunc(v, path)
				})
			})
		}
	}
}


var visitor_for = ({ node }) => {
	if (node.body && node.body.type != "blockStatement") {
		node.body = t.blockStatement([node.body]);
	}
}, visitor_function = (path) => {
	let args = path.node.arguments;

	//eval("1")
	if (path.node.callee.name == "eval" && args.length) {
		if (args[0].type == "StringLiteral") {
			try {
				args[0].value = handleJsCode(args[0].value, true)
			} catch (err) {
				console.log("CallExpression解析失败:", err, args[0].value);
			}
			return
		}
		//其它变量
		args[0] = hookFunc(args[0], path, 1);
		return
	}

	//new Function('a', 'b', 'return(a+b);')
	if (path.node.callee.name == "Function" && args.length) {
		let last = args.length - 1;
		if (args[last].type == "StringLiteral") {
			try {
				args[last].value = handleJsCode(args[last].value, true)
			} catch (err) {
				console.log("NewExpression解析失败:", err, args[last].value);
			}
			return
		}

		//var ret = 'return(a+b);',fun2 = Function('a', 'b', ret);fun2(8, 6);
		args[last] = hookFunc(args[last], path, 1);
		return
	}

	includeAllCallExpression(path.node, path)
}, visitor_object = (path) => {
	includeAllObjectProperty(path.node, path)
}, visitor_array = (path) => {
	path.node.elements.forEach(function (av, ai) {
		availableType(av.type, function () {
			path.node.elements[ai] = hookFunc(av, path)
		})
	})
}

var visitor = {
	Identifier (path) {
	},
	enter (path) {
	},
	exit (path) {

	},
	// 补 for 括号{}
	ForInStatement: visitor_for,
	ForOfStatement: visitor_for,
	ForStatement: visitor_for,
	// 补while 括号{}
	WhileStatement: visitor_for,

	/// 补if else 括号{}
	IfStatement ({ node, path }) {
		if (node.consequent && node.consequent.type !== "BlockStatement") {
			node.consequent = t.BlockStatement([node.consequent]);
		}
		if (node.alternate && node.alternate.type !== "BlockStatement") {
			node.alternate = t.BlockStatement([node.alternate]);
		}
	},

	// hook return 值
	ReturnStatement (path) {
		if (path.node.argument != null) {
			availableType(path.node.argument.type, function () {
				path.node.argument = hookFunc(path.node.argument, path)
			})
		}
	},

	// hook 赋值
	AssignmentExpression (path) {
		if (path.node.operator == "=") {
			availableType(path.node.right.type, function () {
				path.node.right = hookFunc(path.node.right, path)

			})
		}
	},

	// hook 声明定义 值
	VariableDeclarator (path) {
		if (path.node.init != null) {
			availableType(path.node.init.type, function () {
				path.node.init = hookFunc(path.node.init, path)
			})
		}
	},

	// hook 字典value
	ObjectExpression: visitor_object,

	ArrayExpression: visitor_array,

	//eval 和 Function
	CallExpression: visitor_function,

	//new Function
	NewExpression: visitor_function,

	//函数参数
	FunctionDeclaration (path) {
		return
		var topVariable = []
		path.node.params.forEach(function (v) {
			if (v.type == "Identifier") {
				var newName = "$" + v.name + "$"
				topVariable.push(t.variableDeclarator(t.identifier(v.name), t.identifier(newName)))
				v.name = newName
			}
		})
		path.get("body").unshiftContainer("body", t.variableDeclaration("var", topVariable))
	},
}
function handleJsCode (jsText, noHead) {
	var ast = parser.parse(jsText, { sourceType: "unambiguous" });
	traverse(ast, visitor, false);

	let JsCode = generator(ast).code;
	return noHead ? JsCode : hookHeadJsCode + JsCode;
}

function handleHtmlCode (htmlCode) {
	let $ = cheerio.load(htmlCode);
	let scriptList = $("script");

	if (scriptList.length == 0) {
		// console.log("无scrpit标签");
		return htmlCode;
	}

	var addHookHeadJsCode = false;
	for (let script of scriptList) {
		// 忽略外部引用 和 无内容的标签
		if (script.attribs.src || script.children.length == 0 || script.attribs.type == "application/json") {
			continue;
		}

		let newJsCode = "";
		for (let child of script.children) {
			newJsCode += child.data;
		}

		if (newJsCode == "") {
			continue;
		}

		try {
			newJsCode = handleJsCode(newJsCode, addHookHeadJsCode);
			addHookHeadJsCode = true;
		} catch (err) {
			console.log("handleHtmlCode解析失败：", err, newJsCode);
			continue;
		}

		var newScript = cheerio.load("<script>" + newJsCode + "</script>")("script");
		newScript.attribs = script.attribs;
		$(script).replaceWith(newScript);
	}

	return $.html();
}

function format (jsText) {
	var ast = parser.parse(jsText, { sourceType: "unambiguous" });
	return generator(ast).code
}
module.exports = {
	format,
	jsCode: handleJsCode,
	htmlCode: handleHtmlCode,
}
