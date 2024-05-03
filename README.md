# prophet

JAVASCRIPT AST HOOK JS逆向快速定位

### 这个项目是用AST语法树进行改写JavaScript代码,实现hook保存return值等等,以达到快速定位,指定参数值的相关代码位置。核心逻辑代码查看handleCode.js 。内置缓存，第二次不再对原JS代码处理，方便了加速。如果需要删除缓存，可以删除`cache`目录下相应文件即可。


# 文件说明

- JSON.prune.js 用于浏览打印出所有属性，如：`JSON.prune(window.screen, {inheritedProperties:true})`
- webpack_mixer.js 用于webpack包合并，如：`node webpack_mixer.js -l loader.js -m module.js -m module1.js -m module2.js`
- env_add.js 用于补环境，内有注释，需要改一下就可以。如：`node env_add.js`
- server.js 用于代理服务器，，如：`node server.js`

# 浏览器内使用

> 为什么要使用$符号作为变量，原因是以最少字符串，并不与其它全局变量冲突。

- `$record=true` 表示开启记录，记录所有 。可以设置刷新页面自动开启：`localStorage.setItem("$record","true")`
- `$S("abcd")` 表示查找字符串，如果找到将停止记录，原因是记录存储会吃完你的浏览器内存。
- `$rcode=/正则/` 表示正则匹配的代码文本，并在控制台打印出来。可以设置刷新页面自动开启：`localStorage.setItem("$rcode","正则")`
- `$rval=/正则/` 表示正则匹配的值，并在控制台打印出来。可以设置刷新页面自动开启：`localStorage.setItem("$rval","正则")`
- `$debugger=true` 表示`$rcode`或`$rval`匹配后，是否暂停在断点处。可以设置刷新页面自动开启：`localStorage.setItem("$debugger","true")`

# 使用方法

### 第一步:下载文件 点击Download ZIP 直接下载文件到本地

### 第二步:先安装node环境 在安装依赖库

- 需要安装的依赖库一共6个，安装命令：npm i --save anyproxy cheerio @babel/parser @babel/traverse @babel/types @babel/generator

### 第三步:启动+使用

- 打开server.js文件 设置参数主要有 port(代理端口) throttle（传输速度）一般默认无须修改 anyoroxy安装遇到坑查百度一般都能解决，详细查看官方地址anyoroxy.io里面例子通俗易懂
- 直接命令启动 node .\\server.js 下面是启动成功的输出信息 Http proxy started on port 8001

![image](https://user-images.githubusercontent.com/44369205/170855448-3cee7ee9-765c-4a28-a2cc-8cd6d27f8fee.png)

### 浏览器挂上代理端口8001，打开网站等待加载完成,

![image](https://user-images.githubusercontent.com/44369205/170857331-5f4c23eb-75d2-4834-ab41-897b344bc0e7.png)

![138J1B5VMOH399(~3ET~ @J](https://user-images.githubusercontent.com/44369205/170857154-5f252ec8-6c2f-4bb8-983b-073c5cdd4178.png)

### 搜索参数值,ting_search(str) ,点击跳转到相应位置

![image](https://user-images.githubusercontent.com/44369205/170857206-10b86214-42db-4122-883c-d34cb9525a68.png)

### 极验 geetest

![image](https://user-images.githubusercontent.com/44369205/170858598-a181daed-b18c-42d0-a15d-c11f20e7f399.png)

### 本人是个js逆向安全小白5月开始接触学习逆向，欢迎交流讨论共同进步，最好有大佬带带我。

### 做这个项目原因是从别人那里了解到github上的ast-hook-for-js-RE内存漫游工具用了一下觉得ast语法树挺强的，所以自己也从0学起来了。

### 这个小项目是从0开始学ast语法树，边学，边写，边查，短时间内写出来的东西，肯定还有很多bug，有更好的想法和意见欢迎提出，希望让它越来越完善，能力越来越强大。