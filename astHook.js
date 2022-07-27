const handleCode = require("./handleCode");
const fs = require("fs");

function astHook(requestDetail, responseDetail) {
	let newResponse = Object.assign({}, responseDetail.response);

	// 跳过官方库
	if (typeof requestDetail.url == "string" && requestDetail.url.match("jquery|layui|swiper|element|webpack")) {
		return { response: newResponse };
	}

	// 处理Js文件
	if (typeof requestDetail.url == "string" && requestDetail.url.match(".js")) {
		let hostname = requestDetail.requestOptions.hostname,
			port = requestDetail.requestOptions.port,
			path = requestDetail.requestOptions.path.replace(/[\<\>\:\"\/\\\|\?\*]+/g, "_"),
			fileDir = "cache/" + hostname + "/" + port,
			filePath = fileDir + "/" + path;

		//从缓存目录中读取
		try {
			if (fs.existsSync(filePath)) {
				newResponse.body = fs
					.readFileSync(filePath, {
						flag: "r",
						encoding: "utf8",
					})
					.toString();
				return { response: newResponse };
			}
		} catch (err) {}

		let body = newResponse.body.toString();
		try {
			//处理js内容
			let newBody = handleCode.handleJsCode(body);
			newResponse.body = newBody;

			//创建缓存目录
			let fileDirNode = ".";
			fileDir.split("/").forEach(function (k) {
				fileDirNode += "/" + k;
				if (fs.existsSync(fileDirNode)) {
					return;
				}
				fs.mkdirSync(fileDirNode, 0o777);
			});
			//写入缓存文件
			fs.writeFileSync(filePath+".source.js", body, { encoding: "utf8", flag: "w+" });
			fs.writeFileSync(filePath, newBody, { encoding: "utf8", flag: "w+" });
		} catch (err) {
			console.log("解析js文件错误:", err, requestDetail.url);
			return null;
		}

		return { response: newResponse };
	}

	// 处理Html文件
	if (typeof requestDetail.url == "string" && newResponse.header["Content-Type"] && newResponse.header["Content-Type"].match("text/html")) {
		let body = newResponse.body.toString();
		let newBody = handleCode.handleHtmlCode(body);
		newResponse.body = newBody;
		return { response: newResponse };
	}

	return {
		response: responseDetail.response,
	};
}

module.exports.astHook = astHook;
