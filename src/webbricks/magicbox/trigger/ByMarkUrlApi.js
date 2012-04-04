/**
 * @fileOverview 基于标记api信息的触发器
 * @author Jady Yang
 */

kola('webbricks.magicbox.trigger.ByMarkUrlApi', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.bom.Event',
	'kola.html.Element'
], function(KolaClass, KolaFunction, Event, $) {
	
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
			
			//	监听全局单击事件
			$(document.body).on('click', KolaFunction.bindEvent(this._e_body_click, this));
		},
		
		/**
		 * 鼠标点击触发，分析是否为有效的A或Button标签
		 */
		_e_body_click: function(event) {
			//	如果点击的不是鼠标左键，或者当时还按住了ctrl键，那就不做处理
			//	TODO: 这里使用document.all来判断是否是ie，可能不是很严谨
			if ((document.all ? event.button != 0 : event.which != 1) || event.ctrlKey) return;
			
			//	如果点击的不是一个A标签，则不做处理
			var element = $(Event.element(event)).upWithMe('a[data-url],button[data-url],input[data-url]');
			if (!element) return;
			
			//	如果A标签的地址不是一个有效的地址，则不作处理。href="javascript:.."时，protocol为javascript:
			//	根据对象相应节点的类型，进行不同的判断，以避免进行了不必要的处理
			switch (element.prop('tagName').toLowerCase()) {
				case 'a':
					//	这是个A链接，需要保证没有href，protocol是javascript
					if (element.prop('href').length == 0 
						|| element.prop('protocol').toLowerCase() != 'javascript:'
						|| element.prop('target')
					) return;
					break;
				case 'input':
					//	这是个input，需要保证type=button
					if (element.prop('type').toLowerCase() != 'button') return;
					break;
				case 'button':
					//	这是个button，需要保证是type=button
					var type = element.prop('type').toLowerCase();
					if (type.length != 0 && type != 'button') return;
					break;
			}
			
			//	此时，才需要走特殊处理方式
			
			//	终止事件传递以及默认行为
			Event.stop(event);
			
			//	收集相关信息，并提交总控制器
			this._request(element);
		},
		
		/**
		 * 从节点上获取request信息
		 * @param {kola.html.Element} element 经过配置的元素容器对象
		 */
		_parseRequest: function(element) {
			return {
				url: 		element.attr('data-url'),
				method: 	element.attr('data-method'),
				target: 	element.attr('data-target'),
				element:	element
			};
		},
		
		/**
		 * 发送请求
		 * @param {kola.html.Element} element 要发起请求的元素  
		 */
		_request: function(element) {
			//	向controler发送请求
			this._controler.request(this._parseRequest(element));
		},
		
		/**
		 * 一次请求切换完成后的回调方法
		 */
		//	TODO: 不应该采用回调值，而是事件方式
		completeOnce: function(pageInfo, request) {
			//	这个模式下，不需要做任何处理
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