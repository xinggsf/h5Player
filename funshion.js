class Funshion extends Site {
	constructor() {
		super();
		this.vLevels = {sdvd:'', hd:'', dvd:'', tv:''};
		this.levelLables = {sdvd:'超清', hd:'高清', dvd:'标清', tv:'流畅'};
		this.hls = null;
	}

	getVid() {
		let s = location.pathname;
		this.vid = s.r1(/^\/vplay\/v-(\d+)/);
		if (this.vid) {
			this.fetchVideoInfo();
			return;
		}
		this.mid = s.r1(/^\/vplay\/g-(\d+)/);
		this.vid = s.r1(/^\/vplay\/g-\d+\.v-(\d+)/);
		if (!this.vid) {
			const e = $('li.torr-list.nowplay,a.vd-list-item.nowplay');//clappr播放器内置jQuery
			if (e.length) this.vid = e.attr('data-vid');
		}
		this.vid && this.fetchDramaInfo();
	}

	run() {
		this.getVid();
		if (this.vid) {
			super.run();
		}
	}

	getUrlList() {
		let s, url = `http://pv.funshion.com/v5/video/play/?id=${this.vid}&cl=aphone&uc=5`;
		log('getUrlList() -- url: ', url);
		//Promise.all全部完成或有一个失败则返回；race有一个完成或失败则返回
		fetch(url).then(r => r.json())
		.then(json => json.mp4.forEach(k => fetch(k.http)
			.then(r => r.json()).then(json => {
				//if (k.code in this.vLevels)
				this.vLevels[k.code] = s = getRandom(json.playlist[0].urls);//随机取数组中的一项值:伪负载平衡
				this.createH5Player(s);
			})
		))
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}

	createH5Player(url) {
		if (this.hls) return;
		log('createH5Player() -- url: ', url);
		this.hls = new Clappr.Player({
			source: url, //makeM3u8(this.videos),
			autoPlay: true,
			parentId: 'div.player',
			width: '100%',
			height: '100%',
			plugins: {
				'core': [LevelSelector]
			}
		});
		log('createH5Player() -- end');
	}
	//单视频取信息
	fetchVideoInfo() {
		url = `http://api1.fun.tv/ajax/new_playinfo/video/${this.vid}/`;
		fetch(url).then(r => r.json()).then(json => {
			if (json.status !== 200) throw 'API地址失效，请向扩展开发者反馈';
			json.data.files.forEach(k => {
				//k.clarity 为清晰度： sdvd, hd, dvd, tv
			}
		})
	}
	//剧集取信息
	fetchDramaInfo() {
		url = `http://api1.fun.tv/ajax/new_playinfo/gallery/${this.vid}/?user=funshion&mid=${this.mid}`;
		fetch(url).then(r => r.json()).then(json => {
			if (json.status !== 200) throw 'API地址失效，请向扩展开发者反馈';
			json.data.playinfos.forEach(k => {
				//k.clarity 为清晰度： sdvd, hd, dvd, tv
			}
		})
	}

	_findCallback(k) {
		k.remove();
	}
}

new Funshion().run();