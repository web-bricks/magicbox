/**
 * @fileOverview 构造类
 * @author Jady Yang
 */

kola('webbricks.magicbox.Builder',
null
function() {


    if(typeof sohu === 'undefined') var  sohu = {};
	/********************************************* log *********************************************/
	
	sohu.log = function(data) {
		if (window.console) console.log(data);
	};
	
	sohu.error = function(data) {
		if (window.console) console.error(data);
	};

    /********************************************* 工具方法 *********************************************/

    /**
     * 对象属性的复制
     */
    Object.extend = function(target, src) {

        for (var it in src) {
            target[it] = src[it];
        }

        return target;
    }
     Object.each = function(obj, iterator) {
        //	TODO: 临时去掉了所有的try catch，以便于更方便的调试程序
            var i = 0;
            for (var it in obj) {
                iterator(obj[it], it, i++);
            }
    }
     Object.clone = function(obj, options) {
        var n = {};

        if (options && options.items) {
            options.items.each(function(it, i) {
                n[it] = obj[it];
            });
        } else {
            for (var it in obj) {
                n[it] = obj[it];
            }
	}

	return n;
}


    var unescapeHTML = function(str) {
	    var div = document.createElement('div');
	    div.innerHTML = str;
	    if (div.childNodes.length > 0) {
    		var str = [], i, il;
    		for (i=0, il=div.childNodes.length, il; i<il; i++) {
    			str.push(div.childNodes[i].nodeValue);
    		}
    		return str.join('');
	    }
	    return '';
	}





    if(typeof sohu.view === 'undefined') sohu.view = {};
    var PACK = sohu.view.Page;
	
	/********************************************* View *********************************************/
	//=====================SNS 自动绘制视图类=======================
	
	 /**
	 * @description  微博自动绘制所请求的视图工具类实现
	 * @author  slalx@126.com
	 * @version  0.1
	 * @requires sohu.tool.History	packages
	 */
	
	PACK = {
		/**
		 * 初始化自动切换视图对象
		 */
		init: function(){
			this._initEvents();
			this._initHistory();
			this._firstLoad();
		},
		
		/**
		 * 切换视图
		 */
		switchView: function(href, options) {
			var validResult = this._validLocation(href);
			if(validResult){
				this._switchView(validResult, options);
			} else{
				window.location.href = href;
			}
		},
		
		/**
		 * 切换视图
		 */
		_switchView: function(href, options) {
			//this._startLoading();
		//	if(!/^\//.test(href)){
		//		//临时处理页面跳转错误问题。
		//		return;
		//	}
			this._setProperties(href);
			
			//	获取提交方法
			if (!options) options = {};
			var method = options.method;
			options.method = null;
			var noTimestamp = options.noTimestamp;
			options.noTimestamp = null;
			
			this._setOptions(options);

            if(this._switchBefore(href,options)){
                this._requestView(href, {
                    method: method,
                    noTimestamp: noTimestamp,
                    data: options.data
                }); // 同一App内部的处理方式
            }
		},
		
		/**
		 * 设置历史
		 */
		setHistory: function(href){
			this._setReferrer();
			// 第一次加载不设置历史记录
			if(this._firstLoad){
				this._firstLoad = false;
			} else{
				History.add(href,'');
			}
		},
		
		/**
		 * 设置referrer
		 */
		_setReferrer: function(){
			if(this._firstLoad){
				PACK.referrer = document.referrer;
			} else{
				var hash = location.hash;
				if(hash == ""){
					PACK.referrer = location.href;
				}
				else{
					PACK.referrer = 'http://' + PACK.domain + location.hash.split('#')[1];
				}
			}
		},
		
		/**
		 * 暂停histroyChange时的自动视图切换
		 */
		pause: function(autoSetHistory,autoProceed){
			this._isPause = true;
			this._autoSetHistory = typeof(autoSetHistory) == 'boolean' ? autoSetHistory : true;
			this._autoProceed = typeof(autoProceed) == 'boolean' ? autoProceed : true;
		},
		
		/**
		 * 视图切换监听停止
		 */
		stop: function(autoStart){
			this._isStop = true;
			this._autoStart = typeof(autoStart) == 'boolean' ? autoStart : true;
			History.stopListen();
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
		 * 设置切换视图之前需要调用的方法
		 */
		switchBefore: function(bfCallback){
			this._beforeCb = bfCallback;
		},
		
		/**
		 * 设置切换视图之后需要调用的方法
		 */
		switchAfter: function(afCallback){
			this._afterCb = afCallback;
		},
		
		/**
		 * 设置相关属性
		 * params {string} href 视图URL地址
		 */
		_setProperties: function(href){
			href = this._getAbsoluteUrl(href);

			this.location = href;
			// 此视图URL对应的接口URL
			this._intUrl = href/*this._assembleIntUrl(href)*/;
			// 此视图的层级模式,当前页面的上下文,通过后端直接输出到页面上
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
			// 自定义事件绑定OK
			this._vState = 0;
		},
		
		/**
		 * 设置配置参数
		 */
		_setOptions: function(options){
			this._options = Object.extend({
				bfCallback: typeof(this._beforeCb)== 'function' ? this._beforeCb : function(){ return true; },
				afCallback:  typeof(this._afterCb)== 'function' ? this._afterCb : function(){ return true; },
				erCallback: function(){ return true; }
			},options || {});
			this._beforeCb = null;
			this._afterCb = null;
		},
		
		/**
		 * 视图切换之前的处理方法
		 */
		_switchBefore: function(href,opt){
			return this._options.bfCallback(href,opt);
		},
		_switchTab:function(opt){
            var element=opt.element,
				tabs,//所有的tab容器
				tabTag,//需要tab聚焦的元素标签
				orgtab,//原来聚焦的tab
				curtab,//当前需要聚焦的tab
				tabC;//当前的tab容器

            if(!element)return ;

                tabs = element.up('[data-component=tab]');
                tabTag = '';
                orgtab = K('[data-tab-context='+this.orgTab+']');
                curtab =   K('[data-tab-context='+this.curTab+']');


             if(tabs && tabs._elements.length>0){

               tabC = K(tabs._elements[0]);
               tabTag = tabC.attr('data-component-tag') || 'a';

               if(tabTag == 'a'){
                   if( orgtab && curtab){
                         orgtab.removeClass('on');
                         curtab.addClass('on');
                   }else{
                        tabC.down(tabTag).removeClass('on');
                        element.addClass('on');
                   }
               }else{
                   tabC.down(tabTag).removeClass('on');
                   K(element.upWithMe(tabTag)._elements[0]).addClass('on');
               }
             }else{

                    orgtab && orgtab.removeClass('on');
                    curtab && curtab.addClass('on');

                    var title=element.attr('data-menu-title') && K(element.attr('data-menu-title'));
                    if(title){
                        title.addClass('on');
						
                        K(title.first()._elements[0]).html(element.html());
						
                        K(title._elements[0]).attr('href',element.attr('href'));
						
						window.groupID = element.attr('href').split('=')[1];
                    }
             }

        },
		/**
		 * 视图切换之后的处理方法
		 */
		_switchAfter: function(){
            //TODO:tab的切换，暂时先放到这里
             this._switchTab(this._options);
          //   if(TBrowser.aside)TBrowser._close();

			if(this._options.afCallback()){
				this.setHistory(this._sourceUrl);
				this.scroll2Top();
			}
			this._vState = this._vState +1;
			this._fireLoad();
		},

		/**
		 * 滚动到顶部
		 */
		scroll2Top: function(){
			//TODO:需要滚动条定位到要刷新的区域的上部
			document.getElementById('t-sys').scrollTop = 0;
		},
		
		/**
		 * 切换视图发生错误的处理方法
		 */
		_switchError: function(rsp){
			if(this._options.erCallback(rsp)){
				this.setHistory(this._sourceUrl);
				this._showError(rsp);
			}
			this._endLoading();
		},
		
		/**
		 * 绑定事件
		 */
		_initEvents: function(){
			// 给body绑定click事件，目的是统一捕获A标签的Click事件
            var that=this;

			K(document.body).on('click',function(e){
				that._onBodyClick( e || window.event);
			});
			// 增加自定义事件
            this._dispatcher = new Dispatcher();
            this._dataLoad = false;
		},

        _fireLoad:function(listener) {
            this._dispatcher.fire('dataload', {
                data:{url: this.location}
            }, listener);
        },

        on: function(name, listener) {
            //  调用Dispatcher对象，存储监听信息
            this._dispatcher.on.call(this._dispatcher, name, listener);

            //  如果是监听dataload事件，而且数据已经ok，那就触发该事件
            if (name == 'dataload' && this._dataLoad) {
                //  同时传入当前的监听方法，以便于只触发该方法，而不触发之前已经监听了该事件的方法
                this._fireDataLoad(arguments[1]);
            }
        },
        un: function() {
            //  调用Dispatcher对象，取消对某事件的监听
            this._dispatcher.un.apply(this._dispatcher, arguments);
        },

		
		/**
		 * 初始化历史处理对象
		 */
		_initHistory: function(){
			History.init(Function.bind(this._historyChange,this));
		},
		
		/**
		 * 第一次加载页面
		 */
		_firstLoad: function(){
			var location = window.location.href,
                 href = this._getAbsoluteUrl(location);
			//第一次已经加载完成
			this._firstLoad = false;
			
			// 只有app才使用这种方式
			if(location && location.indexOf('#')!=-1 && location.split('#')[1]){
				this._switchView(href);
			}
		},
		
		/**
		 * 鼠标点击触发，分析是否点击的是A标签
		 */
		_onBodyClick: function(e){

			//是否是左键点击
			var isLeftMouseKey = document.all ? e.button == 0 : e.which == 1,
				srcEl,//点击的元素
				el,//A标签
				href,//A标签的链接
				ts, noTimestamp;//判断是否采用缓存（固定连接地址）

			if(isLeftMouseKey && !e.ctrlKey){
				    srcEl = K(Event.element(e));
					el = srcEl && srcEl.upWithMe('a')  || null;

				if(srcEl && (srcEl.upWithMe("input") || srcEl.upWithMe("label"))) return;

				if(el && !el.attr('target') ){ // 如果没有指定target属性，才走视图模式
					href = el.attr('href');
					href = this._validLocation(href);
					
					if (typeof(href) == 'string' && href.length > 0 && href.indexOf('javascript') != 0) {
							Event.stop(e);

							noTimestamp = typeof(ts = el.attr('view-timestamp')) == 'string' && ts == 'false';
                        //    if(el.upWithMe('[data-browser-container=true]')){
							if(el.upWithMe('div.twi')){									

                                //对于评论区的特殊处理,如果不是评论区，并且
                                if(!srcEl.upWithMe('div.cmt')){
                                       this._requestInTBrowser(href,el);
                                       return true;
                                }else{//如果在评论区，但是点击的是A
                                    if(el._elements[0].tagName=='A'){
                                       this._requestInTBrowser(href,el);
                                       return true;
                                    }else{
                                        return true;
                                    }
                                }
                            }

							//	直接提交
							this._switchView(href, {
								method: el.attr('view-method') || 'get',
								noTimestamp: noTimestamp,
								afCallback: Function.bind(this.start,this),
                                element:el
							});
					} else {

						//	如果可以用局部视图的方法解决，那就采用局部视图的方式
						if (this._doAsLocalView(el)) {
							Event.stop(e);
						} else {

							return true;
						}
					}
				} else{
					return true;
				}
			}
		},
        _requestInTBrowser:function(href,el){	

            if(PACK.browserType.indexOf(el.attr("data-browser-type")) != -1
				|| /^\/n\//.test(href) || /#$/.test(href)){//对于timeline中提到的人url特殊处理
				//ie6下地址乱码的问题
				if(ie6 && /^\/n\//.test(href))href=escape(href);
                window.location.href=href;
//				TBrowser.request(href,{
//						container:'#t-browser',
//						element:el
//				});
				return;
			}else{
				window.location.href=href;
			}
        },
		/**
		 * 尝试按照局部视图的方法解决，可以的话返回true，否则返回false
		 */
		_doAsLocalView: function(el) {
/*			if (!this._localViewReady) {
				//	局部视图类还未加载完成
				return !!el.attr('data-view-url');
			}*/
			//如果有view-disabled属性，表示已经点击过，不能再点击了
			if(el.attr('data-view-disabled')=="true")return false;
			//	按照局部视图类的方法进行更为准备的判断
			var local = Local;
			if (local.canDoAsView(el)) {
				local.asView(el);
				return true;
			} else {
				return false;
			}
		},
		
		//把短域名的地址变换成带参数域名的形式
		_validLocation: function(url){
			var href = this._getAbsoluteUrl(url),
				uindex,
				startIndex, endIndex;

			if(/^http/.test(href)){
					//对于没有使用短域名只是用uid的用户
					uindex = href.indexOf('/u/');
				if(uindex != -1){
					href = PACK.domain+'/people?uid='+href.substring(uindex+3);
				}else{
					startIndex = href.indexOf('//')+2;
					endIndex = href.indexOf('.');
					href = PACK.domain+'/people?dm='+href.substring(startIndex,endIndex);				
				}
			}
			return href;
		},
		
		_getAbsoluteUrl: function(url){
			//对于使用短域名的情况，在页面中点击的还是改短域名
			if(PACK.domain!=url){
				url = url.replace(PACK.domain,'');
			}
			return url;
		},
		
		/**
		 * 获取当前需要请求的view_mode
		 */
		_getViewMode: function(target){
			var source = typeof(this._sourceUrl) == 'undefined' ? '':this._sourceUrl,
				s_nodes = source.split('/'),
				t_nodes = target.split('/'),
				arr = [];
			
			for(var i= 0,len = t_nodes.length; i< len; i++){
				if(t_nodes[i] != s_nodes[i]){
					for(var j = i; j< len; j++){
						if(j == (len - 1)){
							arr.push(t_nodes[j].split('.')[0]);
						} else{
							arr.push(t_nodes[j]);
						}
					}
					break;
				}
			}
			return arr.join('_');
		},
		

		
		/**
		 * 获取视图
		 */
		_requestView: function(url, options){
			var viewMdl = this._createModel(this._intUrl, options);
			
			this._startLoading();
			viewMdl.show(Object.extend({'_context':this._viewMode}, options.data || {}), {
					succ:Function.bind(this._manageView,this),
					fail:Function.bind(this._switchError,this)
			});
		},
		
		
		/**
		 * 进行视图管理，包括执行前置任务和后置任务，显示视图等
		 */
		_manageView: function(data){

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
			 				if (!this.Cache.get(it.src)) {
			 					this.loadJs(it.src);
			 					this.Cache.set(it.src,true);
			 				}
			 			}
			 			if (typeof(it.text) == 'string' && it.text != '') {
			 				this.evalJs(it.text);
			 			}
			 		} else if (it.type == 'csss' ) {
			 			var its = it.src;
			 			if (typeof(its) == 'string' && its != '') {
			 				var inView = typeof(it.scope) == 'string' && it.scope == 'view';
			 				if (inView) {
			 					viewCss.push(its);
			 				} else {
				 				if (!this.Cache.get(its)) {
				 					this.Cache.set(its,true);
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
			
			//处理表情
			kola('newt.composer.emote.Emote', function(){
				tw.emote.clearEm();
			});
			
		},
		/**
		 * 移除上一视图动态加载的JS和CSS
		 */
		_delLastLoad: function(){
			try{
				var jsTags = K('head [name=loadByJs]');
				if(jsTags) jsTags.remove();
			} catch(e){}
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
	                containerPrefix = 't-',
                    lastEqualIndex = -1,
                    containerSuffix = '';

            if(_view_context == to){
                 containerSuffix =  tos[tos.length-2].split('\n');
                 containerSuffix =  containerSuffix &&  containerSuffix[0] || tos[tos.length-2];
                 this._setTabFocus(tos[tos.length-1],tos[tos.length-1]);
            }else{
                for (var i = 0, il = Math.min(tos.length, srcs.length); i < il; i++) {
                    if (srcs[i] != tos[i]) {
                         lastEqualIndex=i-1;
                          this._setTabFocus(srcs[i],tos[i]);
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

	        return containerPrefix+containerSuffix;
	    },
        _setTabFocus:function(orgtab,curtab){
            this.orgTab = orgtab.split('\n')[0];
            this.curTab = curtab.split('\n')[0];
        },
		/**
		 * 显示页面标题
		 */
		_showPageTitle: function(title){
            if(title){
			    document.title = (typeof(title) != 'string' ? '' : (unescapeHTML(title).split('-')[0]));
            }
		},
		
		/**
		 * 显示视图
		 */
		_showView: function(view){
			$('#'+this._canvas).find('*').unbind();
			if(ie6 && typeof CollectGarbage == 'function'){
				CollectGarbage();
			};
            view='<div style="display:none">&nbsp;</div>'+view;
			K('#'+this._canvas).html(view);

//			var dom = $('#'+this._canvas);
//			var id = this._canvas;
//			dom.find('*').unbind();
//			if(ie6 && typeof CollectGarbage == 'function'){
//				CollectGarbage();
//			};
//            dom.empty();
//            dom.append(view);

		},
		
		/**
		 * 执行前置任务，加载必须的JS和CSS文件和相关的片段
		 */
		_onload: function(list){
			//	TODO: 把内容放到了下一个执行队列中
            setTimeout(Function.bind(this._load,this, list),0);
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
			 				if(!this.Cache.get(it.src)){
			 					this.loadJs(it.src);
			 					this.Cache.set(it.src,true)
			 				}
			 			}
			 			if(typeof(it.text) == 'string' && it.text != ''){
			 				this.evalJs(it.text);
			 			}
			 		} else if(it.type == 'css' ){
			 			if(typeof(it.src) == 'string' && it.src != ''){
			 				if(!this.Cache.get(it.src)){
			 					this.loadCss(it.src);
			 					this.Cache.set(it.src,true)
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
			
		 	K(script).attr('name','loadByJs').attr('type','text/javascript').attr('src',jsSrc);
			K('head').append(script);
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
			
		 	K(link).attr('name','loadByJs').attr('rel','stylesheet').attr('type','text/css').attr('href',cssSrc);
			K('head').append(link);
			return link;
		 },
		 
		 /**
		  * 执行 css 片段
		  */
		 evalCss: function(cssText){
		 	var style = kola.Element.create('style');
			
		 	style.attr('name','loadByJs').attr('type','text/css');
			if(style.prop('styleSheet')){
				style.prop('styleSheet').cssText = cssText; // 这种是IE可用
			} else{
				style.append(document.createTextNode(cssText)); // 这种是其它浏览器可用
			}
			K('head').append(style);
			return style;
		 },
		 
		/**
		 * 显示错误
		 */
		_showError: function(rsp){
			 var status=rsp.status;
		//		alert(status);
/*			if(rsp.data){
				if(rsp.data.title){
					this._showPageTitle(rsp.data.title);
				}
				if(rsp.data.body){
					this._showView(rsp.data.body);
				}
				else if(rsp.data.location){
					window.location.href = rsp.data.location;
				}
			} else{			
				this._showView(this.ERROR.get(rsp.status));
			}*/
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
		 * 创建数据处理模型
		 */
		_createModel: function(intUrl, options){
			return new Model({
				actions: {
					show: {
						url:	intUrl,
						method:	(!!options && options.method) ? options.method : 'get',
						cache: false,
						format:	'json',
                        encode:    'uri'
					}
				},
				url:	''
			});
		},
		/**
		 * 历史改变事件处理方法
		 */
		_historyChange : function(locHash){
			if(this._isPause){
				if(kola.Browser.ie){
					if(this._isFirstCall){
						this._isFirstCall = false;
					} else{
						this._isFirstCall = true;
						return 
					}
				} else if(this._autoSetHistory){
					this.setHistory(locHash);
				}
				if(this._autoProceed) this.proceed();
			} else{
				// hash为空，直接返回#前面的地址
				if(locHash == ''){
					locHash = window.location.href;
					// 处理首页不设置历史的问题
					this._firstLoad = true;
				}
				this._switchView(locHash);
			}
		},
		
		/**
		 * 开始加载视图，设置鼠标为loading状态
		 */
		_startLoading: function(){
			K(document.body).addClass('cursor-wait');
			K('#t-g-loading').removeClass('noVis');
		},
		
		/**
		 * 完成加载视图，恢复鼠标为默认状态
		 */
		_endLoading: function(){
			K(document.body).removeClass('cursor-wait');
			K('#t-g-loading').addClass('noVis');
		}
	};
	// 是否滚动到顶部
	PACK.scrollTop = true;
	
	PACK.toView = PACK.switchView;
	
	// 系统主域
	PACK.domain = 'http://'+location.host /*+ PATH.domain*/;
	
	// 所有需要在飘窗中打开的类型
	PACK.browserType='user,twi';
	
	// 代替系统的referrer
	PACK.referrer = document.referrer;
	
	// 缓存信息，先主要用于缓存那些js和css已经加载过
	PACK.Cache = {
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
	 * 视图切换时的404和500错误信息
	 */
	PACK.ERROR = {
		get: function(status){
			if(status != 404) status = 500;
			if(typeof(viewLyoutType) =='string' && viewLyoutType == 'blank')
				return this.blank[status];
			else
				return this.systemApp[status];
		},
		
		systemApp:{
			404:'<div class="msg msg-404-full" style="margin-top: 100px;">'+
					'<h4>找不到你请求的页面</h4>'+
					'<p>你可能点击了过期的链接或者输入错误的链接，一些链接区分大小写。</p>'+
					'<p class="msgActs"><a href="javascript:history.go(-1)">返回上一页</a><span class="pipe">|</span><a title="去首页" href="/home.do">去首页</a></p>'+
				'</div>',
			500:'<div class="msg msg-404-full" style="margin-top: 100px;">'+
					'<h4>此服务暂时不可用</h4>'+
					'<p>可能运转出现了点小问题，请稍等片刻再尝试一下~如果一直无法解决，请联系客服热线</p>'+
					'<p class="msgActs"><a href="javascript:history.go(-1)">返回上一页</a><span class="pipe">|</span><a title="去首页" href="/home.do">去首页</a></p>'+
				'</div>'
		},
			
		blank: {
			404:'<div class="msg msg-404-full" style="margin-top: 100px;">'+
					'<h4>找不到你请求的页面</h4>'+
					'<p>你可能点击了过期的链接或者输入错误的链接，一些链接区分大小写。</p>'+
					'<p class="msgActs"><a href="javascript:location.reload()">尝试刷新</a><span class="pipe">|</span><a href="javascript:window.close()">关闭页面</a></p>'+
				'</div>',
			500:'<div class="msg msg-404-full" style="margin-top: 100px;">'+
					'<h4>此应用暂时不可用</h4>'+
					'<p>可能运转出现了点小问题，请稍等片刻再尝试一下~如果一直无法解决，请联系客服热线</p>'+
					'<p class="msgActs"><a href="javascript:location.reload()">尝试刷新</a><span class="pipe">|</span><a href="javascript:window.close()">关闭页面</a></p>'+
				'</div>'
		}
	};
	
	/**
	 * 事件列表
	 */
	PACK.EVENTS = {
		load: 'load'
	};
	
	var ag = navigator.userAgent.toLowerCase(),
        ie6 = (ag.indexOf('msie 6.0')!=-1&&ag.indexOf('msie 7.0')==-1&&ag.indexOf('msie 8.0')==-1);
	return PACK;
});
