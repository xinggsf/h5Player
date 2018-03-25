class Netease extends Site {
	constructor() {
		super();
		this.plid = ''; // playlist id
		this.mid = ''; // video id
		this.raw_vid = '';
		this.pl_title = ''; // playlist title
		this.videos = {
			sd: '',
			hd: '',
			shd: ''
		};
		this.levelNum = 0;
		this.types = {
			sd: '标清',
			hd: '高清',
			shd: '超清'
		};
		this.curUrl = '';//当前视频地址
		this.subs = {};
		this.hls = null;
		this.subtitleNum = 0;
	}

	run() {
		this.getOpenCourseSource();
		if (this.mid) {
			super.run();
			browser.runtime.onMessage.addListener((message, sender) => {
				switch (message.id) {
				case 'm3u8-url':
					log('flv url:', message.url);
					this.doBlockUrl(message.url);
					break;
				}
			});
		}
	}

	getOpenCourseSource() {
		log('getOpenCourseSource() --');
		const url = location.pathname.split('/'),
		match = /([A-Z\d]{9})_([A-Z\d]{9})/.exec(url),
		len = url.length;

		if (!match || match.length !== 3) {
			console.error('Failed to get mid!', match);
			return;
		}
		this.raw_vid = match[0];
		this.plid = match[1];
		this.mid = match[2];
		const xmlUrl = `http://live.ws.126.net/movie/${url[len-3]}/${url[len-2]}/2_${this.raw_vid}.xml`;
		log('xmlUrl: ', xmlUrl);

		fetch(xmlUrl).then(r => r.text()).then(txt => {
			const xml = new DOMParser().parseFromString(txt, 'text/xml');

			for (let type in this.videos) {
				let video = xml.querySelector(type + ' > mp4') ||
					xml.querySelector(type.toUpperCase() + ' > mp4');
				if (video) {
					this.videos[type] = video.firstChild.data;//解密key
					this.levelNum++;
				}
			}
			if (1===this.levelNum) this.getMobileOpenCourse();

			const subs = xml.querySelectorAll('subs sub');
			for (let sub of subs) {
				let subName, b, s = sub.querySelector('name').innerHTML;
				b = encodeURIComponent(s).startsWith('%D3');//GBK“英文”的转码
				subName = b ? 'english' : '中文';
				this.subs[subName] = sub.querySelector('url').innerHTML;
				log(subName, this.subs[subName]);
				this.toWEBVTT(subName);
				this.subtitleNum++;
			}
		})
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}

	toWEBVTT(subName, codecs='') {
		log('toWEBVTT() --', subName);
		fetch(this.subs[subName])
		.then(r => codecs !=='' ? r.arrayBuffer() : r.text())
		.then(txt => {
			if (codecs !== '')
				txt = new TextDecoder(codecs).decode(new Uint8Array(txt));
			/*
			let s = txt.replace(/\r\n\d+\r\n/g, '\n')
				.replace(/,/g, '.')
				.replace(/^\s*1/, 'WEBVTT\n');
			log(subName, s); */
			let a = txt.trim().split('\r'),
			len = a.length,
			r = /^\s*$/,
			i = 0;
			do {
				r.test(a[i]) && ++i;
				a[i++] = '';//删除索引行，然后处理下一行
				if (!a[i])
					//throw new Error('不能识别"UCS-2 Little Endian"编码格式的字幕');
					return this.toWEBVTT(subName, 'UCS-2');
				a[i] = a[i].replace(/,/g, '.');//时间行时间格式转换
				i += 3;
			} while(len > i);
			a[0] = 'WEBVTT\n';
			this.subs[subName] = URL.createObjectURL(new Blob(a), {'type': 'text/vtt'});
		})
		.catch(e => {
			popupInfo(_t('fetchSourceErr'), e.message);
			delete this.subs[subName];
			this.subtitleNum--;
		});
	}
	//处理拦截的flv地址
	doBlockUrl(flvurl) {
		if (this.hls) return;
		let i = 0, type,
		//labels = {}; //清晰度切换标签
		baseUrl = flvurl.replace(/_\w+\.flv$/, '').replace('flv', 'mp4');
		for (type in this.videos) {
			if (this.videos[type]) {
				this.videos[type] = this.curUrl = `${baseUrl}_${type}.mp4`;//m3u8 too
				//labels[i] = this.types[type];
				//i++;
			}
		}
		this.createH5Player();
	}

	createH5Player() {
		log('createH5Player() -- url: ', this.curUrl);
		const e = this.flashplayer,
		cfg = {
			source: this.curUrl, //makeM3u8(this.videos),
			autoPlay: true,
			width: '100%',
			height: '100%',
			parentId: '#j-flashArea'
		};
		if (this.subtitleNum > 0) {
			cfg.events = { onReady: this.onSetSubtitles.bind(this) };
			/*
			let i, lang, a = [];//字幕: text track
			for (i in this.subs) {
				//if (!url.startsWith('blob:')) return;
				//setTimeout(() => URL.revokeObjectURL(url), 900);
				lang = i === 'english' ? 'en' : 'cn-zh';
				a.push({
					lang: lang,
					label: i,
					src: this.subs[i],
					kind: 'subtitles'
				});
			}
			cfg.playback = {
				preload: 'metadata',
				//controls: true,
				//playInline: true, // allows inline playback when running on iOS UIWebview
				//crossOrigin: 'use-credentials',
				//recycleVideo: Clappr.Browser.isMobile, // Recycle <video> element only for mobile. (default is false)
				// Add external <track> (if supported by browser, see also https://www.w3.org/TR/html5/embedded-content-0.html#the-track-element)
				externalTracks: a
			};
			cfg.closedCaptionsConfig = {
				title: '字幕', //Subtitles, default is none
				ariaLabel: '关闭字幕', //Closed Captions, Default is 'cc-button'
				labelCallback: function (track) { return track.name }, // track is an object with id, name and track properties (track is TextTrack object)
			}; */
		}
		this.hls = new Clappr.Player(cfg);
		e && e.remove();
	}

	onSetSubtitles() {
		log('onSetSubtitles start -- ');
		const v = $('video')[0];
		let html = '';
		for (let i in this.subs) {
			let url = this.subs[i];
			if (!url.startsWith('blob:')) {
				setTimeout(this.onSetSubtitles.bind(this), 99);
				return;
			}
			//setTimeout(() => URL.revokeObjectURL(url), 900);
			let lang = i === 'english' ? 'en' : 'cn-zh';
			html = `${html}<track kind="subtitles" label="${i}" src="${url}" srclang="${lang}" default>`;
		}
		v.parentNode.insertBefore(_('style', {}, [_('text',
		`::cue {
			color: #ACF;
			background: transparent;
			text-shadow: black 0 0 0.2em;
			font: 1.1em sans-serif;
		}`)]), v);
		v.innerHTML += html;
		setTimeout(() => {
			let x = v.textTracks;
			URL.revokeObjectURL(x[0].src);
			if (this.subtitleNum>1) {
				x[1].mode = 'showing';//disabled,hidden
				setTimeout(() => URL.revokeObjectURL(x[1].src), 99);
			}
		}, 99);
		log(html);
	}

	_findCallback(k) {
		if (1===this.levelNum) k.remove();
	}

	getMobileOpenCourse() {
		const url = `http://mobile.open.163.com/movie/${this.plid}/getMoviesForAndroid.htm`;
		log('getMobileOpenCourse() start -- url: ', url);
		fetch(url).then(r => r.json()).then(json => {
			const v = json.videoList.find(k => k.mid === this.mid);
			if (!v) return;
			this.videos.sd = this.curUrl = v.repovideourlOrigin || v.repovideourl
				|| v.repovideourlmp4Origin || v.repovideourlmp4;
			//this.pl_title = json.title;
			this.createH5Player();
		})
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}
}

new Netease().run();