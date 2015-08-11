//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},// 存储所有回调函数
      specialEvents={},
      focusinSupported = 'onfocusin' in window,// 'onfocusin'支持冒泡
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  // zid保存DOM事件回调函数的id
  // 这里element参数有两种可能值
  // 一是原生DOM对象
  // 二是事件回调函数引用
  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }

  //查找绑定在元素上的指定类型的事件处理函数集合
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e) //判断事件类型是否相同
        && (!event.ns || matcher.test(handler.ns)) //判断事件命名空间是否相同
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }

  // 解析事件的命名空间
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)') // (?:pattern)匹配pattern但不获取匹配结果
  }

  // focus, blur只支持捕获
  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

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

  $.event = { add: add, remove: remove }

  // 接受一个函数，然后返回一个新函数，并且这个新函数始终保持了特定的上下文(context)语境，新函数中this指向context参数。
  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      // 对三大事件状态进行标记, 如event.isDefaultPrevented()可获取preventDefault的值
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped', // 阻止当前事件的冒泡行为并且阻止当前事件所在元素上的所有相同类型事件的事件处理函数的继续执行
        stopPropagation: 'isPropagationStopped'
      }

  // 对preventDefault, stopImmediatePropagation, stopPropagation三个事件进行兼容性处理
  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      // 调用事件的preventDefault()方法后,会引起该事件的 event.defaultPrevented 属性值变为true.
      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  // 对event部分属性进行抽取到proxy对象
  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  /**
   * 绑定事件
   * 
   * @param  {[string]} event    事件名, 多个事件使用空格隔开, 或者以事件类型为键、以函数为值的对象方式{ type: handler, type2: handler2, ... }
   * @param  {[type]}   selector 选择器
   * @param  {[type]}   data     event.data的数据
   * @param  {Function} callback 回调函数
   * @param  {[type]}   one      是否执行一次
   */
  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this

    // event是k-v对象时候遍历绑定
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this // 返回this以便链式调用
    }

    /*** 参数调整start ***/
    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse
    /*** 参数调整end ***/

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      // 匹配事件代理有两个方案, 一是从上往下检索,
      // 二是从下往上检索, 这里是使用了方案二
      // 原因是方案一查找不方便, 子节点不是唯一, 
      // 即使用childNodes也需要进一步遍历,
      // 而parentNode是唯一的
      if (selector) delegator = function(e){
        // 从e.target向上查找离selector最近的父节点
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          // 重新扩展封装event
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }

  /**
   * 移除通过 on 添加的事件
   * @param  {[type]}   event    事件名字符串或者k-v对象
   * @param  {[type]}   selector 选择器
   * @param  {Function} callback 绑定时的回调函数
   */
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    /*** 参数调整start ***/
    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse
    /*** 参数调整end ***/

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // dom.dispatchEvent(eventObject) 参数eventObject表示事件对象，是createEvent()方法返回的创建的Event对象
      if('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // 不能触发原生事件, 不能冒泡
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      //遍历元素上绑定的指定类型的事件处理函数集，按顺序执行，如果执行过stopImmediatePropagation，
      //那么e.isImmediatePropagationStopped()就会返回true,再外层函数返回false
      //注意each里的回调函数指定返回false时，会跳出循环，这样就达到的停止执行回面函数的目的
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })


  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type

    // createEvent()方法返回新创建的Event对象
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true) // initEvent(eventName, canBubble, preventDefault)
    return compatible(event)
  }

})(Zepto)
