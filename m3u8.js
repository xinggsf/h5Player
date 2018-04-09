class M3u8 extends Site {
	run() {
		log('class M3u8.run() --');
		webExt.runtime.onMessage.addListener((message, sender) => {
			switch (message.id) {
			case 'm3u8-url':
				log(message.url);
				this.url = message.url;
				this._findFlash();
				break;
			}
		});
	}

	_findCallback(flash) {
		if (this.hls) return;
		log('new Clappr.Player() --');
		this.hls = new Clappr.Player({
			source: this.url,
			autoPlay: true,
			width: flash.width || '100%',
			height: flash.height || '100%',
			parent: flash.parentNode
		});
		flash.remove();
	}
}

if (location.hostname === "www.mgtv.com") new M3u8().run();