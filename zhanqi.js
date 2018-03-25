class Zhanqi extends Site {
	createH5Player() {
		if (this.hls) return;
		this.hls = new Clappr.Player({
			source: this.m3u8_url,
			autoPlay: true,
			parent: this.playerParent,
			width: '100%',
			height: '100%',
		});
	}

	isPlayer(e) {
		return e.matches('#BFPlayerID');
	}

	_findCallback(k) {
		let s = k.children.flashvars.value;
		this.m3u8_url = s.r1(/PlayUrl=([^&]+)/);//视频
		if (!this.m3u8_url) {
			s = s.r1(/VideoLevels=([^&]+)/);//直播
			if (!s) return;
			s = atob(s);
			this.m3u8_url = JSON.parse(s).streamUrl;
		}
		this.playerParent = k.parentNode;
		k.remove();
		this.createH5Player();
	}
}

new Zhanqi().run();