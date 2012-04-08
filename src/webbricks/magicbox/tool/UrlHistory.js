/**
 * @fileOverview Url History管理器
 * @author Jady Yang
 */

kola('webbricks.magicbox.tool.UrlHistory', [
	'kola.lang.Function',
	'kola.bom.Event'
], function(KolaFunction, Event) {
	
	/**
	 * Url History管理器
	 */
	var exports = {
		
		/**
		 * 初始化方法
		 * @param {Function} callbackfn 历史变更时的回调方法
		 */
		create: function(callbackfn) {
			if (callbackfn) {
				Event.on(window, 'popstate', KolaFunction.bindEvent(
					this._e_window_popstate, this, callbackfn));
			}
		},
		
		/**
		 * 增加一个state
		 */
		add: function(url, title, data) {
			history.pushState(data, title, url);
		},
		
		/**
		 * window.popstate事件
		 */
		_e_window_popstate: function(event, callbackfn) {
			callbackfn(location.pathname);
		}
		
	};
	
	return exports;
	
});