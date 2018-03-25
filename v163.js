class V163 extends Site {
	constructor() {
		super();
		let p, isObserver = !1;
		if (location.hostname === 'v.163.com' && location.pathname=== '/') {
			isObserver = true;
			p = $('#living_video')[0];
		}
		else if (location.hostname === 'live.163.com' && $('ul.header-mutil-list').length) {
			isObserver = true;
			p = $('.header-video')[0];
		}
		if (isObserver) {
			console.log(p);
			this.observer = new MutationObserver(records => {
				for (let r of records) if (r.addedNodes) {
					for (let e of r.addedNodes) {
						if (e.nodeName === 'OBJECT') {
							this.flashplayer = e;
							this._findCallback(e);
							return;
						}
					}
				}
			});
			this.observer.observe(p, {
				childList: true,
				subtree: true
			});
		}
	}

	createH5Player() {
		if (this.hls) this.hls.destroy();
		this.hls = new Clappr.Player({
			source: this.m3u8_url,
			autoPlay: true,
			parent: this.playerParent,
			width: '100%',
			height: '100%',
		});
	}

	_findCallback(k) {
		if (this.getAddr()) {
			this.playerParent = this.flashplayer.parentNode;
			this.flashplayer.remove();
			this.createH5Player();
		}
	}

	getAddr() {
		const qingguo = location.hostname === 'qlive.163.com';//青果直播
		let s = this.flashplayer.children.flashvars.value;
		s = qingguo ? s.r1(/&rtmpFile=([^&]+)/) : s.r1(/&(?:sh|h|s)d=([^&]+)/);
		if (s) this.m3u8_url = qingguo ? decodeURIComponent(s).replace('rtmp://x.', 'http://v.').replace(/\?.*$/, '/playlist.m3u8') :
							s.replace('//flv', '//pullhls').replace('//live3', '//cnlive').replace('.flv', '/playlist.m3u8');
		return !!s;
	}
}

new V163().run();