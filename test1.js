
const a = require("./handleCode.js");

let jsText = `

function printTips(abc, def) {

	var a = bb(cc(dd)),
	b = Function(a),
	c = eval(b)
	return a
}`

let jsCode = a.jsCode(jsText)
console.log(jsCode);