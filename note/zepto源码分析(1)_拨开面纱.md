![zepto](http://zeptojs.com/logo.png)
# 前言
相信不少人知道甚至使用过Zepto, 因为它的API跟jQuery特别类似. 根据官网介绍, Zepto是一个轻量级的js库, 可以兼容jQuery, 上手特别容易, 只要你会jQuery. 

事实上, 我觉得jQuery已经变得越来越笨重, 像个胖子一样, 毕竟这家伙为了兼容不同浏览器(当然少不了IE6/7/8), 实现上使用了各种奇技淫巧. 网上已经有不少人研究过jQuery源码, 甚至一部分变成书籍, 但是我依然觉得jQuery实在是为了兼容"不择手段", 个人不建议研究源码. 反而我个人偏向于Zepto这样轻量级的瘦子, 作为一个有追求有理想的程序员, 时刻要保持着"钻牛角尖"的态度去研究技术, 特意找来源码去学习.

# 兼容性
截止于目前, Zepto的版本号是1.1.6, github至少有半年没有提交代码, 相信这一版本已经比较稳定.
官网显示浏览器支持情况如下:

(100%支持)
- Safari 6+ (Mac)
- Chrome 30+ (Windows, Mac, Android, iOS, Linux, Chrome OS)
- Firefox 24+ (Windows, Mac, Android, Linux, Firefox OS)
- iOS 5+ Safari
- Android 2.3+ Browser
- **Internet Explorer 10+ (Windows, Windows Phone)**

(大部分支持)
- iOS 3+ Safari
- Chrome <30
- Firefox 4+
- Safari <6
- Android Browser 2.2
- Opera 10+
- webOS 1.4.5+ Browser
- BlackBerry Tablet OS 1.0.7+ Browser
- Amazon Silk 1.0+
- Other WebKit-based browsers/runtimes

特意把IE加粗, 说明Zepto比jQuery更新"现代化".

# 性能
这时候要祭出官网的这张图:
![intro](http://i3.tietuku.com/55c510bb264eaffc.png)
虽然图上没有说具体数值, 但是既然作者能够敢于放在官网首页, 就说明性能上确实比jQuery优秀.

# 模块
 模块          |  默认   |  描述
------------|--------|--------
zepto         |    √     | 核心模块, 包含大部分方法
event         |    √     | ```on```和```off```的事件处理
ajax            |    √     | XMLHttpRequest和JSONP模块
form          |     √     | 序列化并提交表单
ie               |     √     | 添加对桌面版和WP8版IE 10+的支持
detect        |            | 提供```$.os``` 和 ```$.browser```的信息
fx               |             | 动画```animate()```方法
fx_methods|            | ```show```, ```hide```, ```toggle```, 和 ```fade*()```等动画方法
assets         |             | 支持从DOM中移除图片后清理iOS内存, 属于实验性功能
data           |             | ```data()```方法的完全实现, 能够支持在内存里存储任意对象
deferred    |             | 提供一个```$.Deferred```promise的API, 依赖于"callbacks"模块. 当被包含时, ```$.ajax```支持promise的链式调用
callbacks   |             | 对"deferred"模块提供```$.Callbacks```方法
selector     |             | 对jQuery的CSS扩展实验性支持, 例如```$('div:first')``` 和 ```el.is(':visible')```
touch        |              | 触发触屏设备的触摸和滑动事件, 例如iOS, Android的"touch"事件和Windows Phone的"pointer"事件
gesture     |              | 触发触屏设备的手势事件
stack         |              | 为```andSelf```和```end()```提供链式方法支持
ios3           |              | 兼容iOS 3.x 的String.prototype.trim 和 Array.prototype.reduce 方法

# 与jQuery的差异

1. 这个```width()```和```height()```

  - Zepto.js: 由盒模型（```box-sizing```）决定

  - jQuery: 忽略盒模型，始终返回内容区域的宽/高（不包含 ```padding```、```border```）


2. 还有```offset()```

  - Zepto.js: 返回 ```top```、```left```、```width```、```height```

  - jQuery: 返回 ```width```、```height```

3. ```$(htmlString, attributes)```

  - [jQuery文档](http://api.jquery.com/jQuery/#jQuery-html-attributes])

  - [Zepto文档](http://zeptojs.com/#$)

**DOM操作区别**
```
$(function() {
  var $list = $('<ul><li>jQuery 插入</li></ul>', {
    id: 'insert-by-jquery'
  });
  $list.appendTo($('body'));
});
```
jQuery 操作``` ul``` 上的 ```id``` 不会被添加；Zepto 可以在 ```ul``` 上添加 ```id```。

 **事件触发区别**

```
$script = $('<script />', {
  src: 'http://cdn.amazeui.org/amazeui/1.0.1/js/amazeui.min.js',
  id: 'ui-jquery'
});

$script.appendTo($('body'));

$script.on('load', function() {
  console.log('jQ script loaded');
});
```
使用 jQuery 时 ```load``` 事件的处理函数不会执行；使用 Zepto 时 ```load``` 事件的处理函数会执行。

