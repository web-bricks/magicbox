/**
 * @fileOverview 以context为基础构建的、基于Url的触发器
 * @author Jady Yang
 */

kola('webbricks.magicbox.trigger.UrlBaseOnContext', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.bom.Event',
	'kola.html.Element',
	'lib.history.History'
], function(KolaClass, KolaFunction, Event, $, History) {
	
	/**
	 * 基于Url的触发器
	 * @class
	 */
	var exports = KolaClass.create({
		
		/**
		 * 初始化方法
		 * @param {Object} controler 流程控制器对象
		 */
		_init: function(controler) {
			this._controler = controler;
			
			//	初始化context
			this._initContext();
			
			//	监听全局单击事件
			$(document.body).on('click', KolaFunction.bindEvent(this._e_body_click, this));
			
			//	初始化历史处理对象
			History.init(KolaFunction.bind(this._historyChange, this));
		},
		
		/**
		 * 初始化context
		 */
		_initContext: function() {
			var context = $(document.body).attr('data-context').split('\\n\\n').join('\n\n');
			if (context.charAt(-1) == '\n') {
				context = context.substr(0, context.length - 1);
			}
			this._context = context;
		},
		
		/**
		 * 鼠标点击触发，分析是否点击的是A标签
		 */
		_e_body_click: function(event) {
			//	如果点击的不是鼠标左键，或者当时还按住了ctrl键，那就不做处理
			//	TODO: 这里使用document.all来判断是否是ie，可能不是很严谨
			if ((document.all ? event.button != 0 : event.which != 1) || event.ctrlKey) return;
			
			//	如果点击的不是一个A标签，则不做处理
			var element = $(Event.element(event)).upWithMe('a');
			if (!element) return;
			
			//	如果A标签的地址不是一个有效的地址，则不作处理。href="javascript:.."时，protocol为javascript:
			if (element.prop('href').length == 0) return;
			
			//	如果A标签上url的协议和域名不一致，则不作处理
			if (element.prop('protocol').toLowerCase() != location.protocol.toLowerCase() || 
				element.prop('host').toLowerCase() != location.host.toLowerCase()) return;
			
			//	如果A标签存在target属性，那就不作处理
			if (element.prop('target')) return;
			
			//	此时，才需要走特殊处理方式
			
			//	终止事件传递以及默认行为
			Event.stop(event);
			
			//	收集相关信息，并提交总控制器
			this._request({
				url: 		element.prop('href'),
				method: 	element.attr('data-http-method'),
				element: 	element
			});
		},
		
		/**
		 * 历史改变事件处理方法
		 * @param {String} hash 新的hash值
		 */
		_historyChange: function(hash) {
			if (hash == '') hash = location.href;
			this._request({
				url: hash
			});
		},
		
		/**
		 * 发送请求
		 * @param {Object} request  
		 */
		_request: function(request) {
			if (!request.data) request.data = {};
			request.data._context = this._context;
			request.context = this._context;
			
			//	向控制申请切换
			this._controler.request(request);
		},
		
		/**
		 * 一次请求切换完成后的回调方法
		 */
		//	TODO: 不应该采用回调值，而是事件方式
		completeOnce: function(pageInfo, request) {
			//	保存新的context
			this._context = pageInfo.context;
			
			var a = document.createElement('a');
			a.href = request.url;
			
			//	记录历史
			History.add(a.pathname, '');
		}
		
	});
	
	/**
	 * 构建一个新的触发器
	 * @param {Object} controler 流程控制器对象
	 */
	exports.create = function(controler) {
		var instance = new exports(controler);
		return instance;
	};
	
	return exports;
	
});