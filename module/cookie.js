var sCook = require('simple-cookie');
function arrayUnique (arr) {
	var f = [];
	var s = [];
	for (var i in arr) {
		var g = JSON.stringify(arr[i]);
		if (f.indexOf(g) == -1) {
			s.push(arr[i]);
			f.push(g);
		}
	}

	return s;
}

class Cookie {
	constructor() {
		this.domains = [];
		this.domainReg = [];
		this.list = {};
		this.length = 0;
	}
	expire (domain_key, token_name) {
		var T = this, time = new Date()
		for (var name in T.list) {
			var domain = T.list[name]
			for (var key in domain) {
				var cookie = domain[key]

				//设置过期
				if (token_name == key && domain_key && new RegExp(domain_key + "$").test(name)) {
					cookie.expires = "0"
				}
				if (cookie.expires) {
					if (typeof cookie.expires == "string") {
						cookie.expires = new Date(cookie.expires)
					}
					var timeDiff = cookie.expires.getTime() - time.getTime()
					if (timeDiff <= 0) {
						delete domain[key]
					}
				}
				if (!Object.keys(domain).length) {
					var pos = T.domains.indexOf(name)
					if (pos != -1) {
						//删除
						T.domainReg.splice(pos, 1)
						T.domains.splice(pos, 1)
					}
					T.length--
					delete T.list[name]
				}
			}
		}
	}
	reset (opt) {
		var T = this;
		T.domains = opt.domains || [];
		T.domainReg = opt.domainReg || [];
		T.list = opt.list || {};
		T.length = opt.length || 0;

		T.expire()
	}
	toString () {
		this.expire()
		return JSON.stringify(this)
	}
	set (url, cook) {
		if (!cook) { return }

		var T = this,
			u = new URL(url),
			time = new Date();

		if (typeof cook == 'string') cook = [cook];

		cook.forEach(function (c, i) {
			if (/;\s*Domain=/.test(c)) {
				c += "; Domain=" + u.hostname
			}
			if (/;\s*Path=/.test(c)) {
				c += "; Path=/"
			}
			c = c.replace(/Domain=(.*?);/, function ($0, $1) {
				var newDonmain = "\\." + $1 + "$"
				if (u.hostname.match(newDonmain)) {
					return $0.replace($1, "." + $1)
				}
				return $0
			})
			cook.splice(i, 1, c)
		})

		for (var i in cook) {
			(function () {
				var objs = sCook.parse(cook[i], u.pathname, u.hostname);

				objs.pathReg = '^' + objs.path;

				var pos = T.domains.indexOf(objs.domain)
				if (pos > -1) {
					T.list[objs.domain][objs.name] = objs;
				} else {
					T.list[objs.domain] = {};
					T.list[objs.domain][objs.name] = objs;

					T.domains.push(objs.domain);
					var reg = objs.domain.match(/^\./) ? objs.domain + '$' : '^' + objs.domain + '$';
					T.domainReg.push(reg);
				}
			})();
		}

		//calculate length
		this.length = 0;
		for (var i in T.list) {
			for (var j in T.list[i]) this.length++;
		}

	}
	search (domain, path, date, browser, secure) {
		var cookies = [];
		for (var i in this.domainReg) {
			if (!new RegExp(this.domainReg[i]).test(domain)) {
				continue
			};
			var domain = this.domains[i]
			for (var list in this.list[domain]) {
				var cookie = this.list[domain][list]
				cookies.push(cookie);
			}
		}

		if (typeof date == 'string') date = new Date(date);
		date = date.valueOf();

		path = (path ? path : '/').replace(/\?.*$/, '').replace(/\#.*$/, '');

		var g = [];
		for (var i in cookies) {
			if (new RegExp(cookies[i].pathReg).test(path) &&
				(!cookies[i].expires || date < cookies[i].expires.valueOf()) &&
				!(browser && cookies[i].httponly) &&
				!(!secure && cookies[i].secure)) g.push(cookies[i]);
		};

		return g;

	}
	tokenize (arr) {

		return sCook.tokenize(arrayUnique(arr));

	}
	get (url, browser) {
		var u = new URL(url);
		var d = new Date();
		return this.tokenize(this.search(
			u.hostname,
			u.pathname,
			d,
			browser,
			u.protocol == 'https:'
		).concat(
			this.search(
				'.' + u.hostname,
				u.pathname,
				d,
				browser,
				u.protocol == 'https:'
			)
		));

	}

}



module.exports = exports = Cookie;