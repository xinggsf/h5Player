class Mgtv extends Site {
	constructor() {
		super();
		this.vLevels = {};
		this.vStart = this.vEnd = 0; //片头片尾
		this.levelLabels = {3: '蓝光', 2: '超清', 1: '高清', 0: '标清'};
	}

	getUrlList() {
		let url = 'http://pcweb.api.mgtv.com/player/video?video_id='+ this.vid;
		log('getUrlList() -- ', url);
		fetch(url)
		.then(r => r.json()).then(json => {
			if (json.code !== 200) throw 'API地址失效，请向扩展开发者反馈';
			//let seqid = json.seqid;
			let data = json.data;
			//this.duration = data.info.duration |0;
			//this.poster = data.info.thumb;
			this.vStart = data.points.start.r1(/(\d+)/) |0;
			this.vEnd = data.points.end.r1(/(\d+)/) |0;
			let k, domain = getRandom(data.stream_domain);
			data = data.stream.filter(k => k.url);

			//跳出then，方便Promise.all调用
			setTimeout(this.skipFetch.bind(this), 0, domain, data);
			/*
			for (k of data.stream) {
				if (!k.url) break;
				fetch(domain + k.url.replace(/&arange=\d+/, ''))
				.then(r => r.json()).then(json => {
					this.vLevels[k.name] = json.info;
					log('m3u8-url: ', json.info);
					this.createH5Player(json.info);
				});
			} */
		})
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}

	run() {
		this.vid = location.pathname.r1(/\/\d+\/(\d+)\.html$/);
		if (this.vid) {
			this.getUrlList();
			super.run();
		}
	}

	createH5Player(url) {
		if (this.hls) return;
		log('createH5Player() -- url: ', url);
		this.hls = new Clappr.Player({
			source: url,
			autoPlay: true,
			parentId: '#mgtv-player-wrap',
			width: '100%',
			height: '100%',
			plugins: {
				'core': [LevelSelector]
			},
			levelSelectorConfig: { labels: this.levelLabels }
			//events: { onReady: this.onReady.bind(this) }
		});
		//log('createH5Player() -- end');
	}

	skipFetch(domain, arr) {
		log('skipFetch() -- begin', arr);
		const levelMap = {'蓝光': "1080P", '超清': 'shd', '高清': 'hd', '标清': 'sd'};
		Promise.all(arr.map(k => {
			let url = domain + k.url.replace(/&arange=\d+/, '');
			return fetch(url)
			.then(r => r.json()).then(json => {
				let s = levelMap[k.name];
				this.vLevels[s] = json.info;
				log(json.info)
			});
		}))
		.then(urls => {
			//this.createH5Player(makeM3u8(this.vLevels));
			for (let i in this.vLevels) if (this.vLevels[i]) {
				this.createH5Player(this.vLevels[i]);
				return;
			}
		})
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}

	_findCallback(k) { k.remove() }
}

new Mgtv().run();