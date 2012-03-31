/**
 * Created by shenglizhang
 * User: shenglizhang
 * Date: 11-2-15
 * Time: 下午6:12
 * To change this template use File | Settings | File Templates.
 */
kola('webbricks.magicbox.CssLoader', [
	'kola.html.Element',
	'kola.lang.Function'
], function($, KolaFunction) {


    var exports = function(urls, options) {

			//	预处理url，统一换成标准的格式
			if (typeof(urls) == 'string') {
				urls = [{
					src: urls
				}];
			}
			for (var i=0, l=urls.length; i<l; i++) {
				//	TODO: 暂时未作虑重的处理
				var url = urls[i];
				if (typeof(url) == 'string') {
					url = {
						src: url
					};
					urls[i] = url;
				}
				urls[url.src] = url;
			}
			this._urls = urls;

			this._options = options;
		}


    exports.prototype = {
		/**
		 * 加载所有的文件
		 */
		load: function() {
			//	拿到当前已经添加过的样式列表
			var links = document.getElementsByTagName('head')[0].getElementsByTagName('link'),
				linkLength = 0,
				loaded = {};
			if (links && (linkLength = links.length)) {
				for (linkLength=linkLength-1;linkLength>-1; linkLength--) {
					var link = links[linkLength];
					if (link && link.href) {
						loaded[link.href] = true;
					}
				}
			}

			//	循环所有需要添加的样式列表，逐个进行添加
            var ag = navigator.userAgent.toLowerCase();
			var urls = this._urls, canCatchLoad = (ag.indexOf('msie') != -1) || (ag.indexOf('opera') != -1), checkIds = [];
			for (var i=0, l=urls.length; i<l; i++) {
				var obj = urls[i], src = obj.src;

				//	如果已经加载过，那就不再加载
				//	TODO: 这里的判断虽然不太严谨，因为有可能之前虽然有连接，但是可能还没有加载完，或者加载失败，但是暂时不考虑这种情况
				if (loaded[src]) {
					urls.del(obj);
					i--;
					l--;
					break;
				}

				var link = $(document.createElement('link'));
				if (canCatchLoad) {
					link.on('load', KolaFunction.bind(this._loadSucc,this, src));
					link.on('readystatechange', KolaFunction.bind(this._readystate,this, src));
				} else {
					var checkId = '_CP_' + src.substr(src.indexOf('/r/c/') + 5).replace(/_v\d+/g, '').replace('.css', '').split('/').join('_');
					urls[checkId] = obj;

					var div = document.createElement('div');
					div.id = checkId;
					obj.checkEl = document.body.appendChild(div);

					checkIds.push(checkId);
				}

				link.attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', src);
			 	obj.link = link;
				$('head').append(link);
			}

			//	如果没有需要加载的样式，那就直接进行回调
			if (urls.length == 0) {
				this._callback();
				return;
			}

			//	如果没有load事件的话，那就启动另一个判断加载成功与否的程序
			if (!canCatchLoad) {
				this._checkTimer = window.setInterval(this._checkLink.bind(this), 100);
				this._checkIds = checkIds;
			}

			//	设定超时事件
			this._timeoutTimer = window.setTimeout(this._timeout.bind(this), 2000);
		},

		/**
		 * 验证样式是否加载成功
		 */
		_checkLink: function() {
			var ids, urls = this._urls;
			if (!(ids = this._checkIds)) return;

			//	循环判断样式是否加载成功
			for (var i=0, l=ids.length; i<l; i++) {
				var id = ids[i], obj = urls[id];
				if (!obj) continue;

				var style = window.getComputedStyle(obj.checkEl, null);
				if (style.getPropertyValue('display') == 'block') {
					this._setReady(id);
				}
			}

			this._check();
		},

		/**
		 * 设置某个样式加载成功
		 */
		_setReady: function(src) {
			var obj = this._urls[src];
			if (obj) {
				if (obj.checkEl && obj.checkEl.parentNode) {
					obj.checkEl.parentNode.removeChild(obj.checkEl);
					obj.checkEl = null;
				}
				obj.link = null;
				this._urls.del(obj);
			}
		},

		/**
		 * 一个样式文件加载成功后触发的方法
		 */
		_loadSucc: function(src) {
			this._setReady(src);
			this._check();
		},

		/**
		 * 一个样式文件的加载状态发生变更后触发的方法
		 */
		_readystate: function(src) {
			var obj = this._urls[src];
			if (obj && obj.link && obj.link.prop('readyState') == 'complete') {
				this._setReady(src);
				this._check();
			}
		},

		/**
		 * 超时的处理方法
		 */
		_timeout: function() {
			//	删除各种缓存
			this._clear();

			//	触发成功事件
			if (this._options && this._options.failure) {
				this._options.failure();
			}
		},

		/**
		 * 验证所有文件是否加载成功所调用的方法
		 */
		_check: function() {
			if (this._urls.length == 0) {
				this._callback();
			}
		},

		_callback: function() {
			//	删除各种缓存
			this._clear();

			//	触发成功事件
			if (this._options && this._options.success) {
				this._options.success();
			}
		},

		_clear: function() {
			//	删除各种缓存
			if (this._checkTimer) {
				window.clearInterval(this._checkTimer);
				this._checkTimer = null;
			}
			if (this._timeoutTimer) {
				window.clearTimeout(this._timeoutTimer);
				this._timeoutTimer = null;
			}
			var urls = this._urls;
			this._urls = null;
			if (urls) {
				for (var i=0, l=urls.length; i<l; i++) {
					var url = urls[i];
					if (url.checkEl && url.checkEl.parentNode) {
						url.checkEl.parentNode.removeChild(url.checkEl);
						url.checkEl = null;
					}
					url.link = null;
				}
			}
			this._checkIds = null;
		}
	};

    exports.load = function(urls, options) {
		var css = new sohu.node.Css(urls, options);
		css.load();
		return css;
	};

	exports.delHrefs = function(urls) {
		if (!urls || urls.length < 1) return;
		var obj = {};
		for (var i=urls.length-1; i>=0; i--) {
			obj[urls[i]] = true;
		}

		var links = document.getElementsByTagName('head')[0].getElementsByTagName('link'),
			l = 0;
		if (links && (l = links.length)) {
			for (l=l-1;l>-1; l--) {
				var link = links[l];
				if (link && link.href && obj[link.href]) link.parentNode.removeChild(link);
			}
		}
	};

	return exports;
});