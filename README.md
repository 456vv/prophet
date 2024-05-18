# prophet

JAVASCRIPT AST HOOK JS逆向快速定位，HOOK代码

### 这个项目是用AST语法树进行改写JavaScript代码,实现hook保存return值等等,以达到快速定位,指定参数值的相关代码位置。核心逻辑代码查看handleCode.js 。内置缓存，第二次不再对原JS代码处理，方便了加速。如果需要删除缓存，可以删除`cache`目录下相应文件即可。
### 哎，前端不好玩，扣代码不简单，如有其它方法逆向还是算了吧！

# 文件说明

- JSON.prune.js 用于浏览打印出所有属性，如：`JSON.prune(window.screen, {inheritedProperties:true})`
- webpack_mixer.js 用于webpack包合并，如：`node webpack_mixer.js -l loader.js -m module.js -m module1.js -m module2.js`
- env.js 用于补环境
- server.js 用于代理服务器，，如：`node server.js`
- config.json 用于过滤url和内容替换

# 浏览器内使用

> 为什么要使用$符号作为变量，原因是以最少字符串，并不与其它全局变量冲突。

- `$record=boolean` true表示开启记录，记录所有 。可以设置刷新页面自动开启：`localStorage.setItem("$record","1")`
- `$rcode=/正则/` 表示正则匹配的代码文本，并在控制台打印出来。可以设置刷新页面自动开启：`localStorage.setItem("$rcode","正则")`
- `$rval=/正则/` 表示正则匹配的值，并在控制台打印出来。可以设置刷新页面自动开启：`localStorage.setItem("$rval","正则")`
- `$S(string/regexp)` 表示查找字符串出现的位置。
- `$C()` 表示清除所有记录，否则记录存储会吃完你的浏览器内存
- `$debugger=boolean` true表示`$rcode`或`$rval`匹配后，是否暂停在断点处。可以设置刷新页面自动开启：`localStorage.setItem("$debugger","1")`
- `$onhook["代码字符"]=function(val, text, type){/*这里?*/return val} 表示Hook一个变量改变它，或使用config.json文件的配置硬替换。`
- `$onfunc["代码字符"]=function(f,[arg]){/*这里?*/return $F(f,arg)}` 表示Hook一个函数，如：A(1,2) to $F(A,[1,2])
- `$onmethod["代码字符"]=function(p,n,[arg]){/*这里?*/return $M(p,n,arg)}` 表示Hook一个方法，如：A.B(1,2) to $M(A,"B",[1,2])

# 使用方法

- 需要安装的依赖库一共6个，安装命令：npm i --save anyproxy cheerio @babel/parser @babel/traverse @babel/types @babel/generator
- node server.js





