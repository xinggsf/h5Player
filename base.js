class Site {
	constructor() {
		const noticeWidth = Math.min(500, innerWidth - 50),
		css = `#YHP_Notice{
position:fixed;left:0;right:0;top:0;height:0;z-index:20000;transition:.5s;cursor:default
}
.YHP_down_banner{
margin:2px;padding:2px;color:#FFFFFF;font-size:13px;font-weight:bold;background-color:green
}
.YHP_down_btn{
margin:2px;padding:4px;color:#1E90FF;font-size:14px;font-weight:bold;border:#1E90FF 2px solid;display:inline-block;border-radius:5px
}
@keyframes pop-iframe-in{0%{opacity:0;transform:scale(.7);}100%{opacity:1;transform:scale(1)}}
@keyframes pop-iframe-out{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(.7)}}
#YHP_Notice>div{
position:absolute;bottom:0;left:0;right:0;font-size:15px
}
#YHP_Notice>div>div{
    border:1px #AAA solid;width:${noticeWidth}px;margin:0 auto;padding:20px 10px 5px;background:#EFEFF4;color:#000;border-radius:5px;box-shadow:0 0 5px -2px
}
#YHP_Notice>div>div *{
    margin:5px 0;
}
#YHP_Notice input[type=text]{
    border: none;border-bottom: 1px solid #AAA;width: 60%;background: transparent
}
#YHP_Notice input[type=text]:active{
    border-bottom-color:#4285f4
}
#YHP_Notice input[type=button] {
    border-radius: 2px;
    border: #adadad 1px solid;
    padding: 3px;
    margin: 0 5px;
    width:50px
}
#YHP_Notice input[type=button]:hover {
    background: #FFF;
}
#YHP_Notice input[type=button]:active {
    background: #CCC;
}`;
		setTimeout(() => document.head.appendChild(_('style', {}, [_('text', css)])), 168);
		this.flashplayer = null;
	}

	//查找Flash，找到后H5化
	_findFlash() {
		for (let k of document.querySelectorAll('object,embed')) {
			if (this.isPlayer(k)) {
				log('_findFlash() -- found: ', k);
				this.flashplayer = k;
				this._findCallback(k);
				break;
			}
		}
	}

	run() {
		webExt.runtime.sendMessage({
			icon: true,
			state: 'playing'
		});
		if (!this.flashplayer) {
			let observer = new MutationObserver(() => {//箭头函数锁定this
				this._findFlash();
				if (this.flashplayer instanceof Node) {
					observer.disconnect();
					observer = undefined;
				}
			});
			observer.observe(document.body || document.documentElement, {
				childList: true,
				subtree: true
			});
		}
	}

	_findCallback(k) {
		if (k) k.style.display = 'none';
	}

	isPlayer(e) {
		const isEmbed = e.matches('embed');
		let s = isEmbed ? e.src : (e.data || e.children.movie.value);
		if (!s || !/\.swf(?:$|\?)/.test(s)) return !1;
		const w = e.clientWidth, h = e.clientHeight;
		if (w > 188 && h > 111) return !0;
		if (isEmbed) return !1;
		s = e.querySelector('embed');
		return !!(s && this.isPlayer(s));
	}
}

const popupInfo = (title, info) => createPopup({
	content: [_('p', { style: {fontSize: '16px'} }, [_('text', _t('title'))]), _('text', info)],
	showConfirm: false
});

function createPopup(param) {
	if (!param.content)
		return;
	$('#YHP_Notice').remove();

	let div = _('div', {id: 'YHP_Notice'});
	let childs = [];
	if (param.showConfirm) {
		childs.push(_('input', {
			value: param.confirmBtn,
			type: 'button',
			className: 'confirm',
			event: {
				click: param.onConfirm
			}
		}));
	}
	childs.push(_('input', {
		value: _t('close'),
		type: 'button',
		className: 'close',
		event: {
			click: function () {
				div.style.height = 0;
				setTimeout(function () {
					div.remove()
				}, 500);
			}
		}
	}));
	div.appendChild(_('div', {}, [_('div', {},
		param.content.concat([_('hr'), _('div', {
			style: {textAlign: 'right'}
		}, childs)]))]));
	document.body.appendChild(div);
	div.style.height = div.firstChild.offsetHeight + 'px';
}