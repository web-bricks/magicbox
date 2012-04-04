/**
 * @fileOverview 页面切换控制器
 * @author Jady Yang
 */

kola('webbricks.magicbox.controller.FullPage', [
	'kola.lang.Class', 
	'kola.lang.Function'
], function(KolaClass, KolaFunction) {
	
	/**
	 * 页面切换控制器
	 * @class
	 */
	var exports = KolaClass.create({
		
		/**
		 * 初始化方法
		 * @param {Object} options 配置参数。其包括如下几个属性
		 * 		trigger: 触发器
		 * 		requester: 请求服务类
		 */
		_init: function(options) {
			this._trigger = options.trigger.create(this);
			this._requester = options.requester.create(this);
			this._switcher = options.switcher.create(this);
		},
		
		/**
		 * 发起一个页面切换请求，一般供触发器调用
		 * @param {Object} request 请求配置参数。其中至少需要包括这些信息
		 * 		url {String}: 请求的地址
		 * 		method {String}: 请求方法，一般为get或者post
		 * 		data {Object}: 要发送的数据
		 */
		request: function(request) {
			//	TODO: 如果存在正在进行的请求，可以中断掉
			
			//	调用请求服务类，来处理请求
			var url = request.url,
				options = {
					method:	request.method || 'get',
					data: 	request.data,
					succ: 	KolaFunction.bind(this._requestSucc, this, request),
					fail: 	KolaFunction.bind(this._requestFail, this, request)
				};
			this._requester.request(url, options);
		},
		
		/**
		 * 请求成功后的回调方法
		 */
		_requestSucc: function(request, data) {
			//	调用switcher，切换到相应的内容
			var response = this._switcher.switchTo(data, request);
			
			//	把最新页面的信息，告知触发器
			if (response) {
				this._trigger.completeOnce(response, request);
			}
		},
		
		/**
		 * 请求失败后的回调方法
		 */
		_requestFail: function(request, error) {
			this._switcher.switchError(error, request);
		}
		
	});
	
	/**
	 * 构建一个实例
	 */
	exports.create = function(options) {
		var instance = new exports(options);
		return instance;
	};
	
	return exports;
	
});