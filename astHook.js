const handleCode = require("./handleCode");
const fs = require("fs");

function astHook (requestDetail, responseDetail) {
	let newResponse = Object.assign({}, responseDetail.response);

	if (typeof requestDetail.url != "string") {
		return { response: responseDetail.response };
	}
	// 跳过官方库
	if (requestDetail.url.match("jquery|layui|swiper|element|framework|vue")) {
		return { response: newResponse };
	}

	// 处理Js文件
	if (requestDetail.requestOptions.path.match("\.js$")) {
		let hostname = requestDetail.requestOptions.hostname,
			port = requestDetail.requestOptions.port,
			path = requestDetail.requestOptions.path.replace(/[\<\>\:\"\/\\\|\?\*]+/g, "_"),
			fileDir = "cache/" + hostname + "/" + port,
			filePath = fileDir + "/" + path;

		//从缓存目录中读取
		try {
			if (fs.existsSync(filePath)) {
				newResponse.body = fs.readFileSync(filePath, { flag: "r", encoding: "utf8", }).toString();
				return { response: newResponse };
			}
		} catch (err) { }

		let body = newResponse.body.toString();
		try {
			//处理js内容
			newResponse.body = handleCode.jsCode(body);
			//创建缓存目录
			fs.mkdirSync(fileDir, { recursive: true })
			//写入缓存文件
			fs.writeFileSync(filePath + ".source.js", handleCode.format(body), { encoding: "utf8", flag: "w+" });
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
		newResponse.body = handleCode.htmlCode(body);
		return { response: newResponse };
	}

	return { response: responseDetail.response };
}

module.exports.astHook = astHook;
