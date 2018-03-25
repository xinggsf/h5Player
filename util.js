const browser = chrome;
//生成主M3u8文件，并返回blob地址
const makeM3u8 = urls => {
	let a = ['#EXTM3U'];
	const videos = {
		ld: '\n#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=204800, RESOLUTION=320x180\n',
		sd: '\n#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=460800, RESOLUTION=480x270\n',
		hd: '\n#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=870400, RESOLUTION=640x360\n',
		shd: '\n#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=1228800, RESOLUTION=960x720\n',
		"1080P": '\n#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=2048000, RESOLUTION=1280x1080\n'
	};
	for (let i in urls) {
		urls[i] && a.push(videos[i] || '\n#EXT-X-STREAM-INF:PROGRAM-ID=1\n', urls[i]);
	}
	a = new Blob(a, {'type': 'application/vnd.apple.mpegurl'});//application/x-mpegURL video/mp2t
	const url = URL.createObjectURL(a);
	//setTimeout(() => URL.revokeObjectURL(url), 3300);
	return url;
}

const getRandom = a => {
	return Array.isArray(a) ? a[getRandom(a.length)] : Math.random()*a |0;
}

const _ = function (type, props, children) {
	if (type === "text") {
		return document.createTextNode(props);
	}
	const elem = document.createElement(type);
	for (let n in props) {
		if (n === "style") {
			for (let x in props.style) {
				elem.style[x] = props.style[x];
			}
		}
		else if (n === "className") {
			elem.className = props[n];
		}
		else if (n === "event") {
			for (let x in props.event) {
				elem.addEventListener(x, props.event[x]);
			}
		} else {
			elem.setAttribute(n, props[n]);
		}
	}
	if (children) {
		for (let k of children) {
			k && elem.appendChild(k);
		}
	}
	return elem;
};

NodeList.prototype[Symbol.iterator] = HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];

String.prototype.r1 = function(r) {
	return r.test(this) && RegExp.$1;
};
const isChrome = navigator.userAgent.includes('Chrome');
const _t = s => browser.i18n.getMessage(s);
const firefoxVer = !isChrome && navigator.userAgent.r1(/Firefox\/(\d+)/) || 0;

function readStorage(name, cb) {
	if (!isChrome && firefoxVer < 53)
		//ff52-无sync
		browser.storage.local.get(name, cb);
	else
		browser.storage.sync.get(name, cb);
}
function saveStorage(save) {
	if (!isChrome && firefoxVer < 53)
		browser.storage.local.set(save);
	else
		browser.storage.sync.set(save);
}
//由jQuery.cookie.js改写 http://blog.wpjam.com/m/jquery-cookies/
function cookie(name, value, options) {
	let s;
	if (typeof value === 'undefined') { //read cookie
		s = document.cookie;
		s = s && s.r1(new RegExp(name +'=([^;]+)'));
		return s && decodeURIComponent(s) || '';
	}
	options = options || {};//options: expires,path,domain,secure
	if (value == null) {
		value = '';
		options.expires = -1;//delete cookie
	}
	s = name + '=' + encodeURIComponent(value);
	if (options.expires && (typeof options.expires === 'number' || options.expires.toUTCString)) {
		let date;
		if (typeof options.expires === 'number') {
			date = new Date();
			date.setTime(date.getTime() + (options.expires * 24 * 36e5));
		} else {
			date = options.expires;
		}
		s += '; expires=' + date.toUTCString();
	}
	delete options.expires;
	for (let i in options)
		s = `${s}; ${i}=${options[i]}`;
	document.cookie = s;
}

//const _log = console.log.bind(console);
function log(...a) {
	// let s = log.caller && log.caller.name || '';
	// _log(s, ...a);
	console.log(...a);
}