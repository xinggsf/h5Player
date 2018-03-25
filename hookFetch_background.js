/*
  fetch hooking code from https://github.com/spacemeowx2/DouyuHTML5Player/blob/b5a54240f1b31d53a8530af83444b10027fe6dca/src/background.js#L8
*/
const browser = chrome || browser;
function convertHeader(headers) {
  let out = {}
  for (let key of headers.keys()) {
    out[key] = headers.get(key)
  }
  return out
}
function Object2Headers(headers) {
  let out = new Headers()
  for (let key of Object.keys(headers)) {
    out.set(key, headers[key])
  }
  return out
}
browser.runtime.onConnect.addListener(port => {
  if (port.name === 'fetch') {
    let response
    let reader
    port.onDisconnect.addListener(() => {
      reader && reader.cancel()
    })
    port.onMessage.addListener(msg => {
      let chain = Promise.resolve()
      if (msg.method === 'fetch') {
        if (msg.args[1].headers != undefined)
          msg.args[1].headers = Object2Headers(msg.args[1].headers);
        chain = chain.then(() => fetch.apply(null, msg.args)).then(r => {
          response = r
          return {
            bodyUsed: r.bodyUsed,
            ok: r.ok,
            status: r.status,
            statusText: r.statusText,
            type: r.type,
            url: r.url,
            headers: convertHeader(r.headers)
          }
        })
      } else if (msg.method === 'json') {
        chain = chain.then(() => response.json())
      } else if (msg.method === 'body.getReader') {
        chain = chain.then(() => {
          reader = response.body.getReader()
        })
      } else if (msg.method === 'reader.read') {
        chain = chain.then(() => reader.read()).then(r => {
          if (r.value != undefined)
            r.value = Array.from(r.value)
          return r
        })
      } else if (msg.method === 'reader.cancel') {
        chain = chain.then(() => reader.cancel())
      } else {
        port.disconnect()
        return
      }
      chain.then((...args) => {
        const outMsg = {
          method: msg.method,
          args: args
        }
        port.postMessage(outMsg)
      })
    })
  }
})

let playerCount = {};
let _t=function(s){return browser.i18n.getMessage(s)}
browser.runtime.onMessage.addListener((message, sender) => {
  let id = sender.tab.id;
  if (message.icon) {
    browser.browserAction.enable(id);
    switch (message.state) {
      case 'playing':
        playerCount[id].playing++;
        break;
      case 'pending':
        playerCount[id].pending++;
        break;
      case 'pending-dec':
        playerCount[id].pending--;
        break;
    }
    let titleStr = [];
    if (playerCount[id].pending != 0)
      titleStr.push(playerCount[id].pending + _t('iconPending'));
    if (playerCount[id].playing != 0)
      titleStr.push(playerCount[id].playing + _t('iconPlaying'));
    browser.browserAction.setTitle({ title: titleStr.join('\n'), tabId: id });
  }
});

const tabIdList = new Set();
browser.tabs.onCreated.addListener((tab) => {
	tab.url && tab.url.startsWith('https://www.mgtv.com/') && tabIdList.add(tab.id);
});
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	if (tab.url) {
		if (tab.url.startsWith('https://www.mgtv.com/'))
			tabIdList.add(id);
		else if (tabIdList.has(id))
			tabIdList.delete(id);
	}
	if (changeInfo.status != 'loading') return;
	playerCount[id] = {
		playing: 0,
		pending: 0
	}
	browser.browserAction.disable();
	browser.browserAction.setTitle({ title: _t('iconIdle'), tabId: id });
});
browser.tabs.onRemoved.addListener((id, removeInfo) => {
	tabIdList.has(id) && tabIdList.delete(id);
	delete playerCount[id];
});

//用onBeforeSendHeaders更具体
browser.webRequest.onBeforeRequest.addListener(details => {
        let allow = details.url.startsWith('http://cctv5');//资源地址，非网页地址
        if (!allow) {
            browser.tabs.sendMessage(details.tabId, {
                id: 'm3u8-url',
                url: details.url
            });
            browser.browserAction.enable(details.tabId);
        }
        return {cancel: !allow};
    },
    //{urls: [{pathSuffix: '.m3u8'}]
    { urls: [
        'http://*.live.cntv.dnion.com/cache/cctv*',
        'http://*.vtime.cntv.cloudcdn.net/cache/cctv*',
        'http://mov.bn.netease.com/*.flv',
        'http://cemov.bn.netease.com/*.flv',
    ], types: ['object']},
    ["blocking"]
);

browser.webRequest.onBeforeRequest.addListener(details => {
        const tab = details.tabId,
		block = tabIdList.has(tab);
        if (block) {
            browser.tabs.sendMessage(tab, {
                id: 'm3u8-url',
                url: details.url
            });
            browser.browserAction.enable(tab);
        }
        return {cancel: block};
    },
    { urls: ['http://*/*.m3u8?*','https://*/*.m3u8?*'], types: ['object']},
    ["blocking"]
);