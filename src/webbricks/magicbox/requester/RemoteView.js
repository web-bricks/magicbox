/**
 * @fileOverview 用于获取存放在远程网络上的、基于View接口格式的内容
 * @author Jady Yang
 */

kola('webbricks.magicbox.requester.RemoteView', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.net.Ajax'
], function(KolaClass, KolaFunction, Ajax) {
	
	/**
	 * 页面切换控制器
	 * @class
	 */
	var exports = KolaClass.create({
		
		/**
		 * 初始化方法
		 * @param {Object} controler 流程控制器对象
		 */
		_init: function(controler) {
			this._controler = controler;
		},
		
		/**
		 * 发起一个页面切换请求，一般供触发器调用
		 * @param {String} url 接口地址
		 * @param {Object} options 请求配置参数。其中至少需要包括这些信息
		 * 		method {String}: 请求方法，一般为get或者post
		 * 		data {Object}: 要发送的数据
		 */
		request: function(url, options) {
			//	收集要发送的参数
			var data = options.data || {},
				params = [];
			for (var name in data) {
				var value = data[name],
					type = typeof value;
				if (type == 'string' || type == 'number') {
					params.push(name + '=' + encodeURIComponent(value));
				}
			}
			data = params.join('&');
			
			//	请求数据
			var _this = this;
			Ajax.json(url, {
				method: options.method || 'get',
				data: 	data,
				succ: 	KolaFunction.bind(this._succ, this, options),
				fail: 	KolaFunction.bind(this._fail, this, options)
			});
		},
		
		/**
		 * 成功后的回调方法
		 */
		_succ: function(options, json) {
			if (json.status >= 200 && json.status < 300) {
				options.succ(json.data);
			} else {
				//	TODO: 302状态需要进行额外的处理
				
				//	其他状态需要交给失败处理方法
				this._fail(options, json);
			}
		},
		
		/**
		 * 失败后的回调方法
		 */
		_fail: function(options, json) {
			options.fail(json);
		}
		
	});
	
	/**
	 * 构建一个新的请求处理类
	 * @param {Object} controler 流程控制器对象
	 */
	exports.create = function(controler) {
		var instance = new exports(controler);
		return instance;
	};
	
	return exports;
	
});