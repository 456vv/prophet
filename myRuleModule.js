const astHook = require("./astHook");
const handleCode = require("./handleCode");

module.exports = {
	*beforeSendResponse (requestDetail, responseDetail) {
		//正常的js和html文件
		return astHook.astHook(requestDetail, responseDetail);
	},

	*beforeSendRequest (requestDetail) {
		//eval("内容")
		if (typeof requestDetail.url == "string") {
			if (requestDetail.url.match("handleJsCode")) {
				let code = requestDetail.requestData.toString();
				try {
					code = handleCode.handleJsCode(code, true)
				} catch (err) {
					console.log("请求解析失败", err, code);
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
			}
		}
		return null;
	},
};
