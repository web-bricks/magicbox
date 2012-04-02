/**
 * @fileOverview 构造类
 * @author Jady Yang
 */

kola('webbricks.magicbox.Builder', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.lang.Object', 
	'kola.bom.Event',
	'kola.html.Element', 
	'kola.net.Ajax',
	'lib.history.History', 
	'kola.bom.Browser'
], function(KolaClass, KolaFunction, KolaObject, Event, $, Ajax, History, Browser) {
	
	// 缓存信息，先主要用于缓存那些js和css已经加载过
	var Cached = {
		// 缓存数据
		data:{},
		
		// 设置缓存
		set: function(key,value){
			this.data[key] = value;
		},
		
		// 获取缓存
		get: function(key){
			return this.data[key];
		}
	};
	
	/**
	 * 引擎类
	 * @class
	 */
	var exports = KolaClass.create({
		
		/**
		 * 初始化方法
		 */
		_init: function() {
			this._initEvents();
			this._initHistory();
			this._firstLoad();
		},
		
		/**
		 * 开始全局事件的监听
		 */
		_initEvents: function(){
			//	监听全局事件
			$(document.body).on('click', KolaFunction.bindEvent(this._onBodyClick, this));
		},
		
		/**
		 * 初始化历史处理对象
		 */
		_initHistory: function(){
			History.init(KolaFunction.bind(this._historyChange, this));
		},
		
		/**
		 * 历史改变事件处理方法
		 * @param {String} hash 新的hash值
		 */
		_historyChange: function(hash) {
			//	TODO: 此方法需要补全注释
			if (this._isPause) {
				if (Browser.render() == 'ie') {
					if (this._isFirstCall) {
						this._isFirstCall = false;
					} else {
						this._isFirstCall = true;
						return; 
					}
				} else if (this._autoSetHistory) {
					this.setHistory(locHash);
				}
				if (this._autoProceed) this.proceed();
			} else {
				// hash为空，直接返回#前面的地址
				if (hash == '') {
					hash = window.location.href;
					// 处理首页不设置历史的问题
					this._firstLoad = true;
				}
				this._switchView(hash);
			}
		},
		
		/**
		 * 切换视图
		 * @param {String<url>} href 要去的页面URL地址
		 */
		_switchView: function(href, options) {
			this._setProperties(href);
			
			//	获取提交方法
			if (!options) options = {};
			var method = options.method;
			options.method = null;
			
			//	保存配置信息
			this._setOptions(options);
			
			//	如果允许切换的话，那就切换之
            if(this._switchBefore(href, options)) {
                this._requestView(href, {
                    method: method,
                    data: 	options.data
                });
            }
		},
		
		/**
		 * 设置相关属性
		 * params {string} href 视图URL地址
		 */
		_setProperties: function(href){
			//	href = this._getAbsoluteUrl(href);
			
			this.location = href;
			
			// 此视图URL对应的接口URL
			this._intUrl = href/*this._assembleIntUrl(href)*/;
			
			//	TODO: 需要消灭掉_view_context全局变量
			// 此视图的层级模式,当前页面的上下文,通过后端直接输出到页面上
			if (_view_context.length > 0 && _view_context.charAt(-1) == '\n') {
				_view_context = _view_context.substr(0, _view_context.length - 1);
			}
			this._viewMode = _view_context;
			
			// 保存当前的视图URL
			this._sourceUrl = href;
			// 是否暂停histroyChange时的自动视图切换
			this._isPause = false;
			// 是否自动设置历史
			this._autoSetHistory = true;
			// 是否自动继续historyChange时的自动视图切换
			this._autoProceed = true;
			// 是否停止了视图切换监听
			this._isStop = false;
			// 停止视图监听切换之后的自动开始
			this._autoStart = true;
			//	自定义事件绑定OK
			this._vState = 0;
		},
		
		/**
		 * 设置配置参数
		 */
		_setOptions: function(options) {
			this._options = KolaObject.extend({
				bfCallback: typeof(this._beforeCb) == 'function' ? this._beforeCb : null,
				afCallback: typeof(this._afterCb) == 'function' ? this._afterCb : null,
				erCallback: null
			}, options || {});
			this._beforeCb = null;
			this._afterCb = null;
		},
		
		/**
		 * 视图切换之前的处理方法
		 */
		_switchBefore: function(href, options) {
			var func = this._options.bfCallback;
			if (typeof func == 'function') {
				return func(href, options);
			}
			return true;
		},
		
		/**
		 * 视图切换之后的处理方法
		 */
		_switchAfter: function() {
			var func = this._options.afCallback;
            if (typeof func == 'function' && func()) {
				this.setHistory(this._sourceUrl);
				this.scroll2Top();
			}
			this._vState++;
		},

		/**
		 * 滚动到顶部
		 */
		scroll2Top: function() {
			document.body.scrollTop = 0;
		},
		
		/**
		 * 设置历史
		 */
		setHistory: function(href) {
			// 第一次加载不设置历史记录
			if (this._firstLoad) {
				this._firstLoad = false;
			} else {
				History.add(href, '');
			}
		},
		
		/**
		 * 切换视图
		 */
		switchView: function(href, options) {
			this._switchView(href, options);
		},
		
		/**
		 * 视图切换监听开始
		 */
		start: function(){
			this._isStop = false;
			History.startListen();
			return true;
		},
		
		/**
		 * 继续histroyChange时的自动视图切换
		 */
		proceed: function(){
			this._isPause = false;
		},
		
		/**
		 * 鼠标点击触发，分析是否点击的是A标签
		 */
		_onBodyClick: function(e) {

			// 是否是左键点击
			var isLeftMouseKey = document.all ? e.button == 0 : e.which == 1,
			//	点击的元素
				srcEl,
				el,//A标签
				href;//A标签的链接

			if (isLeftMouseKey && !e.ctrlKey) {
				srcEl = $(Event.element(e));
				el = srcEl && srcEl.upWithMe('a') || null;

				if(srcEl && (srcEl.upWithMe("input") || srcEl.upWithMe("label"))) return;

				if(el && !el.attr('target') ){ // 如果没有指定target属性，才走视图模式
					href = el.attr('href');
					
					if (typeof(href) == 'string' && href.length > 0 && href.indexOf('javascript') != 0) {
						Event.stop(e);

						//	直接提交
						this._switchView(el.prop('pathname') + el.prop('search'), {
							method: 	el.attr('data-http-method') || 'get',
							afCallback: KolaFunction.bind(this.start, this),
                            element:	el
						});
					}
				} else {
					return true;
				}
			}
		},
		
		/**
		 * 第一次加载页面调用的处理方法
		 */
		_firstLoad: function() {
			//	第一次已经加载完成
			this._firstLoad = false;
			
			//	如果路径中存在#!号，那就跳转之
			var href = window.location.href;
			if (href && href.indexOf('#!') != -1 && href.split('#!')[1]) {
				this._switchView(href);
			}
		},
		
		/**
		 * 获取视图
		 */
		_requestView: function(url, options) {
			this._startLoading();
			
			var data = KolaObject.extend({
				_context: this._viewMode
			}, options.data || {});
			
			var params = [];
			for (var name in data) {
				var value = data[name],
					type = typeof value;
				if (type == 'string' || type == 'number') {
					params.push(name + '=' + encodeURIComponent(value));
				}
			}
			params = params.join('&');
			
			//	请求数据
			var _this = this;
			Ajax.json(this._intUrl, {
				method: options.method || 'get',
				data: 	params,
				succ: 	function(json) {
					_this._manageView(json.data);
				},
				fail: 	function(json) {
					_this._switchError(json);
				}
			});
		},
		
		
		/**
		 * 进行视图管理，包括执行前置任务和后置任务，显示视图等
		 */
		_manageView: function(data) {

			//	如果存在location参数的话，那就直接跳转
			if (data.location) {
				this.switchView(data.location);
			}
			
			//	判断是否存在bootload，如果存在的话，需要优先处理bootload
			var bootload,
				viewCss = [],     //	解析出的，仅在视图内有用的CSS
                i,l; 		//循环中使用的变量
			if ((bootload = data.beforeload) && bootload.length > 0) {
			 	for ( i=0, l=bootload.length; i<l; i++) {
			 		var it = bootload[i];
			 		if(it.type == 'javascript'){
			 			if (typeof(it.src) == 'string' && it.src != '') {
			 				//	TODO: 其实对于外链形式的js处理并不严谨，因为理论上是需要等待加载完才做处理的
			 				if (!Cached.get(it.src)) {
			 					this.loadJs(it.src);
			 					Cached.set(it.src, true);
			 				}
			 			}
			 			if (typeof(it.text) == 'string' && it.text != '') {
			 				this.evalJs(it.text);
			 			}
			 		} else if (it.type == 'css' ) {
			 			var its = it.src;
			 			if (typeof(its) == 'string' && its != '') {
			 				var inView = typeof(it.scope) == 'string' && it.scope == 'view';
			 				if (inView) {
			 					viewCss.push(its);
			 				} else {
				 				if (!Cached.get(its)) {
				 					Cached.set(its,true);
				 					this.loadCss(its);
				 				}
			 				}
			 			}
			 			if (typeof(it.text) == 'string' && it.text != '') {
		     	 			this.evalCss(it.text);
			 			}
			 		}
			 	}
			}
			 	
		 	//	判断是否存在需要删除和添加的样式
		 	var viewCssUrls = this._viewCssUrls,
		 		needCss = viewCss.length > 0;
		 	if (viewCssUrls && viewCssUrls.length) {
		 		needDel = true;
			 	if (viewCss && viewCssUrls.length == viewCss.length) {
			 		var hadDis = false;
		 			for ( i=0, l=viewCssUrls.length; i<l; i++) {
		 				if (viewCssUrls[i] != viewCss[i]) {
		 					hadDis = true;
		 					break;
		 				}
		 			}
		 			
		 			//	判断之前和现在是否存在不同
		 			if (!hadDis) {
		 				needDel = false;
		 				needCss = false;
		 			}
			 	}
			 	
			 	//	存在需要删除的样式
			 	if (needDel) {
			 		CssLoader.delHrefs(viewCssUrls);

			 		this._viewCssUrls = null;
			 	}
		 	}
		 	
		 	//	如果需要添加样式，那就添加之
		 	if (needCss) {
		 		this._viewCssUrls = viewCss;
		 		var func = this._afterBootload.bind(this, data);

		 		CssLoader.load(viewCss.concat(), {
		 			timeout: 1500,
		 			success: func,
		 			failure: func
		 		});

		 	} else {
		 		this._afterBootload(data);
		 	}
		},
		
		/**
		 * bootload处理完之后额回调方法
		 */
		_afterBootload: function(data) {
            this._canvas = this._getCanvas(data.context);
			this._showView(data.body);
			//flash影响页面title的改进测试
			this._showPageTitle(data.title);
			this._onload(data.onload);
			
			this._endLoading();
			this._switchAfter();
			this._destroy();
		},
		
		//每次加载完成后,需要销毁资源，释放内存
		_destroy: function(){
			this._canvas = null;
			this.orgTab = null;
			this.curTab = null;
			this._options = null;

			this.location = null;
			this._intUrl = null;
			this._viewMode = null;
			this._sourceUrl = null;
		},
		
		//根据context，来确定要填充的位置
		_getCanvas: function(to) {
	        var srcs = _view_context.split('\n\n'),
	                tos = to.split('\n\n'),
	                containerPrefix = 'MB-',
                    lastEqualIndex = -1,
                    containerSuffix = '';

            if (_view_context == to) {
                 containerSuffix =  tos[tos.length-2].split('\n');
                 containerSuffix =  containerSuffix &&  containerSuffix[0] || tos[tos.length-2];
            }else{
                for (var i = 0, il = Math.min(tos.length, srcs.length); i < il; i++) {
                    if (srcs[i] != tos[i]) {
                         lastEqualIndex=i-1;
                        break;
                    } else {
                        continue;
                    }
                }
                containerSuffix =  tos[lastEqualIndex].split('\n');
                containerSuffix =  containerSuffix && containerSuffix[0] || tos[lastEqualIndex];

                if(lastEqualIndex < 0)return;
            }
	        _view_context = to;

	        return containerPrefix + containerSuffix;
	    },
	    
		/**
		 * 显示页面标题
		 */
		_showPageTitle: function(title) {
            if (title) {
			    document.title = title;
            }
		},
		
		/**
		 * 切换视图发生错误的处理方法
		 */
		_switchError: function(rsp) {
			var func = this._options.erCallback;
			if (typeof func == 'function' && func(rsp)) {
				this.setHistory(this._sourceUrl);
				this._showError(rsp);
			}
			this._endLoading();
		},
		
		/**
		 * 显示视图
		 */
		_showView: function(view){
			$('#'+this._canvas).html(view);
		},
		
		/**
		 * 执行前置任务，加载必须的JS和CSS文件和相关的片段
		 */
		_onload: function(list) {
			//	TODO: 把内容放到了下一个执行队列中
            setTimeout(KolaFunction.bind(this._load, this, list), 0);
		},
		
		/**
		 * 加载需要的文件和执行片段
		 */
		_load: function(list){

		 	if(typeof(list) == 'object'){
			 	for(var i= 0 ; i<list.length ; i++){
			 		var it = list[i];
			 		if(it.type == 'javascript'){
			 			if(typeof(it.src) == 'string' && it.src != ''){
			 				if(!Cached.get(it.src)){
			 					this.loadJs(it.src);
			 					Cached.set(it.src,true)
			 				}
			 			}
			 			if(typeof(it.text) == 'string' && it.text != ''){
			 				this.evalJs(it.text);
			 			}
			 		} else if(it.type == 'css' ){
			 			if(typeof(it.src) == 'string' && it.src != ''){
			 				if(!Cached.get(it.src)){
			 					this.loadCss(it.src);
			 					Cached.set(it.src,true)
			 				}
			 			}
			 			if(typeof(it.text) == 'string' && it.text != ''){
		     	 				this.evalCss(it.text);
			 			}
			 		}
			 	}
		 	}
		 },
		 
		 /**
		  * 加载 javascript 文件
		  */
		 loadJs: function(jsSrc){
		 	var script = document.createElement('script');
			
		 	$(script).attr('name','loadByJs').attr('type','text/javascript').attr('src',jsSrc);
			$('head').append(script);
			return script;
		 },
		 
		 /**
		  * 执行 javascript 片段
		  */
		 evalJs: function(jsText){
		//	eval(unescapeHTML(jsText));
             var scr = document.createElement("script");
             scr.type="text/javascript";
             scr.text = jsText;
             document.getElementsByTagName("head")[0].appendChild(scr);
		 },
		 
		  /**
		  * 加载 css 文件
		  */
		 loadCss: function(cssSrc){
		 	var link = document.createElement('link');
			
		 	$(link).attr('name','loadByJs').attr('rel','stylesheet').attr('type','text/css').attr('href',cssSrc);
			$('head').append(link);
			return link;
		 },
		 
		 /**
		  * 执行 css 片段
		  */
		 evalCss: function(cssText){
		 	var style = $(document.createElement('style'));
			
		 	style.attr('name', 'loadByJs').attr('type', 'text/css');
			if(style.prop('styleSheet')){
				style.prop('styleSheet').cssText = cssText; // 这种是IE可用
			} else{
				style.append(document.createTextNode(cssText)); // 这种是其它浏览器可用
			}
			$('head').append(style);
			return style;
		 },
		 
		/**
		 * 显示错误
		 */
		_showError: function(rsp) {
			 var status = rsp.status;
			if(status==404){
				window.location.href = '/404.html';
			}
			else if(status==500){
				window.location.href = '/500.html';
			}
			else if(status=="401"){
				var d = rsp.data;
                if(d.toView){
                   location.href = d.toView;
                }

			}
		},
		
		/**
		 * 开始加载视图，设置鼠标为loading状态
		 */
		_startLoading: function() {
			$(document.body).addClass('cursor-wait');
		},
		
		/**
		 * 完成加载视图，恢复鼠标为默认状态
		 */
		_endLoading: function(){
			$(document.body).removeClass('cursor-wait');
		}
		
	});
	
	/**
	 * 构建一个新的引擎
	 */
	exports.build = function() {
		var instance = new exports();
		return instance;
	};
	
	return exports;
});
