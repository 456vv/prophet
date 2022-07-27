const hc = require("./handleCode");

let test1 = hc.handleJsCode("var fun2 = Function('a', 'b', 'return(a+b);');fun2(8, 6);", true);
console.log(test1);
