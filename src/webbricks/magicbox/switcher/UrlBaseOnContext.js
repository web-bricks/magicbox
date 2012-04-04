/**
 * @fileOverview 用于获取存放在远程网络上的、基于View接口格式的内容
 * @author Jady Yang
 */

kola('webbricks.magicbox.switcher.UrlBaseOnContext', [
	'kola.lang.Class', 
	'kola.lang.Function',
	'kola.html.Element',
	'webbricks.magicbox.switcher.ShowView'
], function(KolaClass, KolaFunction, $, Super) {
	
	/**
	 * 页面切换控制器
	 * @class
	 */
	var exports = KolaClass.create(Super, {
		
		/**
		 * 切换到指定的视图
		 */
		switchTo: function(data, request) {
			//	获取应该替换的context
			request.target = this._getCanvas(data.context, request.context);
			
			//	开始加载数据
			var returnValue = Super.prototype.switchTo.apply(this, arguments);
			
			//	返回当前页面的信息
			return {
				url: 		request.url,
				context: 	data.context
			};
		},
		
		/**
		 * bootload处理完之后额回调方法
		 */
		_afterBeforeLoad: function(data) {
			//	设置title
			this._showPageTitle(data.title);
			
			//	调用父类的处理方法
			Super.prototype._afterBeforeLoad.apply(this, arguments);
			
			//	调用后续处理方法
			this._switchAfter();
		},
		
		/**
		 * 视图切换之后的处理方法
		 */
		_switchAfter: function() {
			//	滚动到顶部
			document.body.scrollTop = 0;
		},
		
		/**
		 * 根据context获取要填充的位置
		 */
		_getCanvas: function(context, beforeContext) {
	        var srcs = beforeContext.split('\n\n'),
                tos = context.split('\n\n'),
                containerPrefix = 'MB-',
                lastEqualIndex = -1,
                containerSuffix = '';

            if (srcs.join('\n\n') == context) {
                 containerSuffix =  tos[tos.length-2].split('\n');
                 containerSuffix =  containerSuffix &&  containerSuffix[0] || tos[tos.length-2];
            } else {
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

                if (lastEqualIndex < 0) return;
            }

	        return '#' + containerPrefix + containerSuffix;
	    },
	    
		/**
		 * 显示页面标题
		 */
		_showPageTitle: function(title) {
            if (title) document.title = title;
		},
		
		/**
		 * 切换到错误视图
		 */
		switchError: function(error) {
			var status = error.status;
			if (status == 404) {
				window.location.href = '/404.html';
			} else if (status == 500) {
				window.location.href = '/500.html';
			} else if (status == 401) {
				var d = error.data;
                if (d.toView) {
                   location.href = d.toView;
                }
			}
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