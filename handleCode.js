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
	var args = [value, t.stringLiteral(autoType(value, path).toString().substring(0, 100))]
	if (type) {
		args.push(t.numericLiteral(type))
	}
	return t.callExpression(t.identifier("$H"), args);
}
function availableType (type, func) {
	switch (type) { case "Identifier": case "StringLiteral": case "NumericLiteral": case "CallExpression": case "MemberExpression": return func() }
}


function includeAllCallExpression (node, path) {
	if (node.type == "CallExpression") {
		if (node.callee.type == "Identifier" && node.callee.name == "$H") {
			return
		}
		node.arguments.forEach(function (v, i) {
			node.arguments[i] = hookFunc(v, path)
		})
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
			path.node.argument = hookFunc(path.node.argument, path)
		}
	},

	// hook 赋值
	AssignmentExpression (path) {
		if (path.node.operator == "=") {
			path.node.right = hookFunc(path.node.right, path)
		}
	},

	// hook 声明定义 值
	VariableDeclarator (path) {
		if (path.node.init != null) {
			path.node.init = hookFunc(path.node.init, path)
		}
	},

	// hook 字典value
	ObjectExpression (path) {
		var v1;
		try {
			path.node.properties.forEach(function (v) {
				if (v.type == "ObjectProperty") {
					v1 = v;
					availableType(v.value.type, function () {
						v.value = hookFunc(v.value, path)
					})
				}
			})
		} catch (err) {
			errLog("ObjectExpression解析失败:", err, v1);
		}
	},

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
