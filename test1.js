
const a = require("./handleCode.js");

let jsText = `
eval("abc")
C(1,2)
A.B["C"](1,2)
A.B[C](1,2)
A.B.C(1,2)
A["B"].C(1,2)
A.B.C[1](1,2)
A.B.C.call(D, 51,2)
A.B.C.apply(D, [1,2])
!(function(){})(1,2)
`

let jsCode = a.jsCode(jsText, true)
console.log(jsCode);