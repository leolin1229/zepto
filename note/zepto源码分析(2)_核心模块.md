# 架构
研究一个框架或者库, 一般先画出框架的架构图, 明白了架构很多事情都会事半功倍.
祭出Zepto的核心模块架构图:
![zepto架构图](http://i3.tietuku.com/6c5d67bfec77a6c9.png)

# 核心代码
```js
var zepto = {};

function Z(dom, selector) {
  var i, len = dom ? dom.length : 0
  for (i = 0; i < len; i++) this[i] = dom[i]
  this.length = len
  this.selector = selector || ''
}

zepto.Z = function(dom, selector) {
  return new Z(dom, selector)
}

zepto.init = function(selector, context) {
  // init方法做了很多判断
  // 包括
  // 1) selector是字符串
  //  1.1) 没有context
  //    1.1.1) selector是html字符串, 则创建html碎片
  //    1.1.2) selector是CSS选择器, 则querySelectorAll
  //  1.2) 有context, 则返回查找context下的符合selector的子节点结果
  // 2) selector是function, 则作为`$(document).ready`的回调函数
  // 3) selector是Z的实例, 则直接返回
  // 4) selector是DOM节点数组, 则直接赋值给变量dom
  // 5) selector是单个DOM节点对象, 则用数组封装
  // 
  // 最后返回Z的实例
  var dom
  return zepto.Z(dom, selector)
}

// 创建zepto实例的入口
$ = function(selector, context){
  return zepto.init(selector, context)
}

// `$.`挂载的是类型判断, 还有数组, 字符串, JSON等工具方法
$.type = type
$.isFunction = isFunction
$.isWindow = isWindow
$.isArray = isArray
$.isPlainObject = isPlainObject
$.map = function(elements, callback){}
$.parseJSON = JSON.parse

// `$.fn`挂载的基本是DOM操作方法, 还有部分数组方法
$.fn = {
  constructor: zepto.Z,
  length: 0,
  css:　function(property, value){},
  addClass: function(name){},
  removeClass: function(name){}
  // ......
}

zepto.Z.prototype = Z.prototype = $.fn

// Export internal API functions in the `$.zepto` namespace
zepto.uniq = uniq
zepto.deserializeValue = deserializeValue
$.zepto = zepto
```

# 分析
考虑这么一段简单代码

`$('#foo')`

`$`方法调用了zepto.init,  zepto.init返回的是zepto.Z, 而zepto.Z又是返回一个Z实例, Z构造器继承了`$.fn`, 其中`$.fn`挂载的大部分是DOM操作方法, 因此`$('#foo')`返回一个zepto集合, 这个集合继承了`$.fn`. 而`$`挂载的是一些基础工具函数.