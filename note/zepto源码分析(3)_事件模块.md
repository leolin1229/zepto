# zepto源码分析(3)_事件模块

## 初探
![zepto](http://i1.tietuku.com/ffb7abaa0ac75307.png)

## 分析
从上图可以看出, `add()`和`remove()`是最核心的两个方法.
首先, 我们要知道js的事件移除很严格, 必须与绑定时参数一致, 包括引用也要一致, 例如:
```js
el.addEventListerner(type, fn, capture);
el.removeEventListerner(type, fn, capture);
```
下面来看`add()`函数
```js
function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = [])) // set取上一次的handler
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
 
      // 把鼠标的mouseenter, mouseleave事件统一转为mouseover, mouseout
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn // 这个细节要注意, 优先取代理函数, 因为若代理函数存在则证明已经把fn重新绑定好
 
      // handler.proxy用于保存回调函数的引用
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      // 回调函数id, set临时存储保证递增
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        // 调用addEventListener绑定
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
```
`add()`方法会为每个原生DOM对象调用`zid()`方法, 而`zid()`方法的作用就是保持回调函数的id, 以便`remove`和`findHandlers()`等方法调用.
zepto的事件模块还维护着一个名为`handlers`的对象, 它是长这个样子的:
![handlers](http://i1.tietuku.com/89515a4e76cef668.png)
可以看到, `handlers`对象是的key是`_zid`递增的值, `_zid`维护着所有事件回调函数的引用, `handlers`的value是绑定在同一DOM的事件数组(包括代理在DOM上的事件).

再看看`remove()`
```js
function remove(element, events, fn, selector, capture){
    var id = zid(element) // 取得DOM的id
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i] // 删除handlers对象相应的handler对象
      if ('removeEventListener' in element) // 调用removeEventListener
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }
```
`remove()`显得比较简单, 先取DOM的id也就是`_zid`的值, 然后遍历事件类型参数, 每一次遍历中拿着DOM, 事件类型, 回调引用和选择器去调用`findHandlers()`查询`handlers`相应value, 最后删除`handlers`对应的值并且调用removeEventListener. 

### 更多
更多代码注释请看[这里](https://github.com/leolin1229/zepto/blob/master/src/note_event.js)