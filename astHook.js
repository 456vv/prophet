const handleCode = require("./handleCode");
const fs = require("fs");



var default_exclude = /jquery|layui|swiper|element|framework|vue/
var config_path = "./config.json", conf = {};
/*
config:{
	url:{
		include://,
		exclude://,
	},
	content:{
		replace:{
			url:{
				"a":"b",
			}
		},
	}
}
*/
function _stringLeft (s, n) {
	return s.slice(0, n - s.slice(0, n).replace(/[\x00-\xff]/g, "").length)
}
function _stringRight (s, n) {
	return s.slice(s.slice(-n).replace(/[\x00-\xff]/g, "").length - n)
}
function toPattern (p) {
	if (p instanceof RegExp) {
		return p
	}
	var l = _stringLeft(p, 1),
		r = _stringRight(p, 5),
		pat = "",
		cas = "";
	var start = 0,
		end = -1;
	var epos = r.lastIndexOf("/")
	if (epos != -1 && r[epos - 1] != "\\") {
		cas = r.substr(epos + 1)
		end = p.lastIndexOf("/" + cas)
	}
	start = (l == "/") ? 1 : 0;
	pat = (end != -1 && start) ? p.substring(start, end) : p.substr(start)
	return new RegExp(pat, cas)
}
function changeContent (body, url_path) {
	//替换内容
	if (conf?.content?.replace) {
		for (var k_url in conf.content.replace) {
			//路径匹配
			if (url_path.match(k_url)) {
				//内容替换
				var pobj = conf.content.replace[k_url];
				for (var find in pobj) {
					var val = pobj[find]
					body = body.replace(toPattern(find), function () {
						for (var i = 0; i < arguments.length - 2; i++) {
							val = val.replace("$" + i, arguments[i])
						}
						return val
					})
				}
			}
		}
	}
	return body
}
function config (json) {
	try {
		conf = JSON.parse(json)
	} catch (err) {
		console.log(err)
	}
}
function astHook (requestDetail, responseDetail) {
	let newResponse = Object.assign({}, responseDetail.response);

	//更新配置
	if (fs.existsSync(config_path)) {
		config(fs.readFileSync(config_path, "utf8"))
	}

	let hostname = requestDetail.requestOptions.hostname,
		port = requestDetail.requestOptions.port,
		path = new URL(requestDetail.url).pathname.replace(/[\<\>\:\"\/\\\|\?\*]+/g, "_"),
		fileDir = "cache/" + hostname + "/" + port,
		filePath = fileDir + "/" + path,
		source_filePath = fileDir + "/source/" + path,
		url_path = requestDetail.requestOptions.path;

	if (default_exclude.test(url_path) || conf?.url?.exclude?.test(url_path)) {
		if (fs.existsSync(source_filePath)) {
			newResponse.body = fs.readFileSync(source_filePath, { flag: "r", encoding: "utf8", }).toString();
		}

		if (!conf?.url?.include.test(url_path)) {
			return { response: newResponse };
		}
	}
	// 处理Js文件
	if (url_path.match("\.js$")) {
		//从缓存目录中读取
		if (fs.existsSync(filePath)) {
			newResponse.body = fs.readFileSync(filePath, { flag: "r", encoding: "utf8", }).toString();
			return { response: newResponse };
		}

		let body = newResponse.body.toString();
		try {
			//处理js内容
			newResponse.body = changeContent(handleCode.jsCode(body), url_path)
			//创建缓存目录
			fs.mkdirSync(fileDir + "/source", { recursive: true })
			//写入缓存文件
			fs.writeFileSync(source_filePath, handleCode.format(body), { encoding: "utf8", flag: "w+" });
			fs.writeFileSync(filePath, newResponse.body, { encoding: "utf8", flag: "w+" });
		} catch (err) {
			console.log("解析js文件错误:", err, requestDetail.url);
			return null;
		}

		return { response: newResponse };
	}

	// 处理Html文件
	if (newResponse.header["Content-Type"] && newResponse.header["Content-Type"].match("text/html")) {
		let body = newResponse.body.toString();
		//只保存，不从缓存读取
		try {
			//处理html内容
			newResponse.body = changeContent(handleCode.htmlCode(body), url_path)
			//创建缓存目录
			fs.mkdirSync(fileDir + "/source", { recursive: true })
			//写入缓存文件
			fs.writeFileSync(source_filePath, body, { encoding: "utf8", flag: "w+" });
			fs.writeFileSync(filePath, newResponse.body, { encoding: "utf8", flag: "w+" });
		} catch (err) {
			console.log("解析html文件错误:", err, requestDetail.url);
			return null;
		}


		return { response: newResponse };
	}

	return { response: responseDetail.response };
}

module.exports.astHook = astHook;
module.exports.config = config;
