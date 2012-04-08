/**
 * @fileOverview 显示一个view信息
 * @author Jady Yang
 */

kola('webbricks.magicbox.switcher.ShowView', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.html.Element',
	'webbricks.magicbox.tool.CssLoader'
], function(KolaClass, KolaFunction, $, CssLoader) {
	
	//	缓存信息，先主要用于缓存那些js和css已经加载过
	var Cached = {
		//	缓存数据
		data: {},
		
		//	设置缓存
		set: function(key, value) {
			this.data[key] = value;
		},
		
		//	获取缓存
		get: function(key) {
			return this.data[key];
		}
	};
	
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
		 * 切换到指定的视图
		 */
		switchTo: function(data, request) {
			this._target = request.target;
			
			//	开始加载数据
			this._dealBeforeLoad(data);
			
			//	返回当前页面的信息
			return true;
		},
		
		/**
		 * 处理beforeload队列
		 */
		_dealBeforeLoad: function(data) {
			
			var bootload,
				viewCss = [],	//	解析出的，仅在视图内有用的CSS
                i,l; 			//	循环中使用的变量
            
            //	判断是否存在bootload，如果存在的话，需要优先处理bootload
			if ((bootload = data.beforeload) && bootload.length > 0) {
			 	for ( i = 0, l = bootload.length; i<l; i++) {
			 		var it = bootload[i];
			 		if (it.type == 'javascript') {
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
		 		var func = KolaFunction.bind(this._afterBeforeLoad, this, data);

		 		CssLoader.load(viewCss.concat(), {
		 			timeout: 1500,
		 			success: func,
		 			failure: func
		 		});

		 	} else {
		 		this._afterBeforeLoad(data);
		 	}
		},
		
		/**
		 * bootload处理完之后额回调方法
		 */
		_afterBeforeLoad: function(data) {
			this._showView(data.body);
			this._onload(data.onload);
		},
		
		/**
		 * 显示视图
		 */
		_showView: function(view) {
			var element = $(this._target);
			if (element) element.html(view);
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

		 	if (typeof(list) == 'object') {
			 	for (var i= 0 ; i<list.length ; i++) {
			 		var it = list[i];
			 		if (it.type == 'javascript') {
			 			if (typeof(it.src) == 'string' && it.src != '') {
			 				if (!Cached.get(it.src)) {
			 					this.loadJs(it.src);
			 					Cached.set(it.src,true)
			 				}
			 			}
			 			if(typeof(it.text) == 'string' && it.text != '') {
			 				this.evalJs(it.text);
			 			}
			 		} else if (it.type == 'css' ) {
			 			if (typeof(it.src) == 'string' && it.src != '') {
			 				if (!Cached.get(it.src)) {
			 					this.loadCss(it.src);
			 					Cached.set(it.src,true)
			 				}
			 			}
			 			if (typeof(it.text) == 'string' && it.text != '') {
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
			if (style.prop('styleSheet')) {
				style.prop('styleSheet').cssText = cssText; // 这种是IE可用
			} else {
				style.append(document.createTextNode(cssText)); // 这种是其它浏览器可用
			}
			$('head').append(style);
			return style;
		 },
		
		/**
		 * 切换到错误视图
		 */
		switchError: function(error) {
			//	TODO: 待写
		}
		
	});
	
	/**
	 * 构建一个实例
	 * @param {Object} controler 流程控制器对象
	 */
	exports.create = function(controler) {
		var instance = new exports(controler);
		return instance;
	};
	
	return exports;
	
});