
const a = require("./handleCode.js");

let jsText = `
v.utf8to16(v.base64decode(h.data.outParam)).replace(/\s*/g, "")
`

let jsCode = a.jsCode(jsText, true)
console.log(jsCode);