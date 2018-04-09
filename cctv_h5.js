/*
function level2label(level) {
	if (level.name) return level.name;
	if (level.height)
		return `${level.height}p / ${level.bitrate >>>10}kb`;
	if (level.bitrate)
		return (level.bitrate >>> 10) + 'kb';
	return null;
}

function setQualityUI(levels) {
	//$('.BiliPlus-Scale-Menu .Video-Defination>div').remove();
	const e = abpinst.playerUnit.querySelector('.BiliPlus-Scale-Menu .Video-Defination');
	for (let [i, k] of levels.entries()) {
		let txt = level2label(k);
		e.appendChild(_('div', {
			changeto: JSON.stringify([i, txt]),
			name: i
		}, [_('text', txt)]));
	}
	e.appendChild(_('div', {
		changeto: JSON.stringify([-1, 'auto']),
		name: '-1'
	}, [_('text', 'auto')]));
	e.querySelector(`div[name="${curQuality}"]`).className = 'on';
}
*/
class Cctv extends Site {
	getVid() {
		this.vid = location.href.r1(/^http:\/\/tv\.cntv\.cn\/video\/\w+\/(\w+)/) ||
			location.href.r1(/^http:\/\/xiyou\.cctv\.com\/\w\-([\w\-]+)\.html/);

		if (!this.vid){
			let c = $('div>script:not([src])');
			c.each((i, e) => {
				let s = $(e).text();
				this.vid = s.r1(/var guid = "(\w+)"/) || s.r1(/"videoCenterId","(\w+)"/);
				if (this.vid) return !1;
			});
			c.remove();
		}

		this.vid ? this.fetchSrc() : this._findFlash();
	}

	_findCallback(k) {
		if (!this.vid) {
			let s = k.matches('embed') ? k.getAttribute('flashvars') : k.children.flashvars.value;
			s += '';
			this.vid = s.r1(/\b(?:videoCenterId|item_id)=([^&]+)/);//|vdnSID|id
		}
		this.vid && this.fetchSrc();
	}

	run() {
		this.levelLabels = {5: '2K', 4: '1080P', 3: '超清', 2: '高清', 1: '标清',0: '渣清'};
		if (location.pathname.startsWith('/live/cctv')) {
			webExt.runtime.onMessage.addListener((message, sender) => {
				switch (message.id) {
				case 'm3u8-url':
					log('m3u8 url:', message.url);
					this.openLiveHls(message.url);
					break;
				}
			});
		} else {
			this.getVid();
		}
		super.run();
	}

	fetchSrc() {
		log(this.vid);
		fetch('http://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid='+ this.vid)
		.then(r => r.json())
		.then(json => this.createH5Player(json.hls_url, '100%'))
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}

	createH5Player(url, width) {
		log(url);
		if (this.hls) return;
		let e;
		if (this.flashplayer) {
			e = this.flashplayer.parentNode;
		} else {
			e = $('#myFlash')[0];
		}
		$(e).empty().css('height', '100%')
			.parent().css('height', '100%');
		this.hls = new Clappr.Player({
			source: url,
			autoPlay: true,
			width: '100%',
			height: '100%',
			parent: e,
			plugins: [LevelSelector],
			levelSelectorConfig: {
				labels:this.levelLabels
				/*
				labelCallback: (playbackLevel, customLabel) => level2label(playbackLevel.level)
				labelCallback: function(playbackLevel, customLabel) {
					return playbackLevel.level.height + 'p';
				} */
			}
		});
	}

	openLiveHls(url) {
		const channel = location.pathname.split('/')[2];
		fetch(`http://vdn.live.cntv.cn/api2/liveHtml5.do?channel=pa://cctv_p2p_hd${channel}&client=html5`)
		.then(r => r.text())
		.then(txt => {
			let s = txt.replace(/^.+?'|'.+$/g, '');
			s = JSON.parse(s).hls_url;
			s = s.hls1 || s.hls2 || s.hls4 || s.hls5;
			if (!s) return;
			s = s.split('?')[0] + '?' + url.split('?')[1];
			this.createH5Player(s);
		})
		.catch(e => popupInfo(_t('fetchSourceErr'), e.message));
	}
}

new Cctv().run();