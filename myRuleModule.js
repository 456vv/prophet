const astHook = require("./astHook");
const handleCode = require("./handleCode");


module.exports = {
	*beforeSendResponse (requestDetail, responseDetail) {
		if (typeof requestDetail.url != "string") {
			return null;
		}
		//正常的js和html文件
		return astHook.astHook(requestDetail, responseDetail);
	},

	*beforeSendRequest (requestDetail) {
		if (typeof requestDetail.url != "string") {
			return null;
		}

		var code = requestDetail.requestData.toString();
		if (requestDetail.requestOptions.path == "/hook_jscode") {
			//eval("内容")
			try {
				let head = "(function $$() {", tail = "})( /**/);";
				code = handleCode.jsCode(head + code + tail, true).replace(head, "").replace(tail, "")
			} catch (err) {
				console.log("请求解析失败", err, code);
			}
		} else if (requestDetail.requestOptions.path == "/hook_config") {
			//配置
			astHook.config(code)
		} else {
			return null
		}

		return {
			response: {
				statusCode: 200,
				header: {
					"content-type": "text/plain; charset=utf-8",
					"access-control-allow-origin": "*",
				},
				body: code,
			},
		};
	},
};

