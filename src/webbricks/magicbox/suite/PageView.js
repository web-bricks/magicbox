/**
 * @fileOverview 页面视图引擎套件
 * @author Jady Yang
 */

kola('webbricks.magicbox.suite.PageView', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'webbricks.magicbox.controller.FullPage',
	'webbricks.magicbox.trigger.UrlBaseOnContext',
	'webbricks.magicbox.requester.RemoteView',
	'webbricks.magicbox.switcher.UrlBaseOnContext'
], function(KolaClass, KolaFunction, Controller, Trigger, Requester, Switcher) {
	
	var exports = KolaClass.create({
		
		/**
		 * 初始化方法
		 */
		_init: function() {
			this._controller = Controller.create({
				trigger: 	Trigger,
				requester: 	Requester,
				switcher: 	Switcher
			});
		}
		
	});
	
	//	缓存的实例对象
	var instance;
	
	/**
	 * 构建一个实例
	 */
	exports.create = function() {
		if (!instance) {
			instance = new exports(); 
		}
		return instance;
	};
	
	return exports;
});