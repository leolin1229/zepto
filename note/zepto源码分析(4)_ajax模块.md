# zepto源码分析(4)_ajax模块
## Ajax原理
先说一下Ajax的过程:
1) 创建请求
```js
var xhr = new XMLHttpRequest();
```
2) 连接服务器
```js
xhr.open('GET', 'foo/bar.html', true);// open(方法GET/POST，请求地址， 异步传输)
```
3) 发送请求
```js
xhr.send(null);//如果是GET传入null，是POST则传入数据
```
4) 等待响应
```js
// 处理返回数据
/*
** 每当readyState改变时，就会触发onreadystatechange事件
** readyState属性存储有XMLHttpRequest的状态信息
** 0 ：未打开服务器连接，open()方法还未被调用
** 1 ：未发送，send()方法还未被调用
** 2 ：已获取响应头，send()方法已被调用，响应头和响应状态已经返回
** 3 : 正在下载响应体，responseText中已经获取了数据部分
** 4 ：请求已完成，整个请求过程已完毕
*/
xhr.onreadystatechange = function(){
    if(xhr.readyState == 4){
        /*
        ** Http状态码
        ** 1xx ：信息展示
        ** 2xx ：成功
        ** 3xx ：重定向
        ** 4xx : 客户端错误
        ** 5xx ：服务器端错误
        */
        if(xhr.status == 200){
            success(xhr.responseText);
        } else {
            if(failed){
                failed(xhr.status);
            }
        }
    }
}
```
一个原生的ajax的流程大概就是这样, 当然还有一些细节就不叙述了.

## zepto的Ajax事件
### zepto的Ajax分为全局事件和局部事件.
在Ajax的生命周期中, 以下全局事件将会触发:
1. `ajaxStart`: 如果没有其他Ajax请求当前活跃将会被触发.
2. `ajaxBeforeSend`: 在发送请求前，可以`return false`取消.
3. `ajaxSend`: 类似 `ajaxBeforeSend`, 但不能取消.
4. `ajaxSuccess`: 返回成功时触发.
5. `ajaxError`: 请求过程中error时触发.
6. `ajaxComplete`: 请求已经完成后, 无论请求是成功或者失败都会触发.
7. `ajaxStop`: 如果这是最后一个活跃的Ajax请求，将会被触发.

全局事件的意思是可以在document对象上触发, 如果指定参数context是一个DOM节点, 则该事件会在此节点上触发然后DOM中冒泡. 唯一例外是`ajaxStart`和`ajaxStop`只能在document触发.

至于局部事件就是使用`$.ajax()`方法
```js
$.ajax({
    type: 'GET',
    url: 'http://example.com/get',
    dataType: 'json',
    success: function(data) {},
    error: function(xhr, type) {}
  });
```
### Ajax的完整事件流
![成功ajax事件流](http://i1.tietuku.com/822181847bb8ad04.png)
![失败ajax事件流](http://i1.tietuku.com/56ff5fdfb92fc94e.png)

## show me the code
### $.ajax()
核心方法是`$.ajax()`, 以下是去掉一些无关逻辑后的代码
```js
$.ajax = function(options){
  var settings = $.extend({}, options || {}), // 防止options没有传入
      deferred = $.Deferred && $.Deferred() // 如果开启了deferred
 
  if ('jsonp' == dataType) {
    return $.ajaxJSONP(settings, deferred)
  }
 
  var headers = { },
      xhr = settings.xhr(), // 创建XMLHttpRequest对象
      nativeSetHeader = xhr.setRequestHeader,// ???不懂为啥需要保存原始`setRequestHeader`方法???
      abortTimeout
 
  // xhr.onreadystatechange事件函数
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4) {
      xhr.onreadystatechange = empty
      clearTimeout(abortTimeout)
      var result, error = false
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
        if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
        else ajaxSuccess(result, xhr, settings, deferred)
      } else {
        ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
      }
    }
  }
 
  // 全局`ajaxBeforeSend()`方法return false则终止Ajax
  if (ajaxBeforeSend(xhr, settings) === false) {
    xhr.abort()
    ajaxError(null, 'abort', xhr, settings, deferred)
    return xhr
  }
 
  // xhr.open()
  xhr.open(settings.type, settings.url, async, settings.username, settings.password)
 
  // 设置http头部
  for (name in headers) nativeSetHeader.apply(xhr, headers[name])
 
  // 设置超时
  if (settings.timeout > 0) abortTimeout = setTimeout(function(){
      xhr.onreadystatechange = empty
      xhr.abort()
      ajaxError(null, 'timeout', xhr, settings, deferred)
    }, settings.timeout)
 
  // xhr.send()
  xhr.send(settings.data ? settings.data : null)
  return xhr
}
```
### $.ajaxJSONP()
另外, jsonp跟ajax原理不一样, 单独有别的逻辑, 代码如下:
```js
$.ajaxJSONP = function(options, deferred){
  var _callbackName = options.jsonpCallback,// jsonpCallback全局jsonp回调函数名, 设置后会有缓存
      callbackName = ($.isFunction(_callbackName) ?
      _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)), // zepto默认把jsonp1, jsonp2, jsonp3...作为回调函数名
    script = document.createElement('script'),// 创建<script>
    // 保存原始全局回调函数
    // 这里有个trick: 利用当script加载完成后调用window[callbackName]函数的时机, 把responseData赋值为传入的参数arguments
    // 然后在onload事件重新把window[callbackName]指向originalCallback, 达到获取responseData的目的
    originalCallback = window[callbackName],
    responseData,
    abort = function(errorType) {
      $(script).triggerHandler('error', errorType || 'abort')
    },
    xhr = { abort: abort }, abortTimeout
 
  if (deferred) deferred.promise(xhr)
 
  // 给script绑定load和error监听器
  $(script).on('load error', function(e, errorType){
    clearTimeout(abortTimeout)
    $(script).off().remove()
 
    if (e.type == 'error' || !responseData) {
      ajaxError(null, errorType || 'error', xhr, options, deferred)
    } else {
      ajaxSuccess(responseData[0], xhr, options, deferred)
    }
 
    window[callbackName] = originalCallback // 重新指向原始回调函数
    if (responseData && $.isFunction(originalCallback))
      originalCallback(responseData[0]) // 执行回调函数
 
    originalCallback = responseData = undefined // ***个人觉得这里赋值null更好, 去掉引用***
  })
 
  if (ajaxBeforeSend(xhr, options) === false) {
    abort('abort')
    return xhr
  }
 
  // 上面提到的trick
  window[callbackName] = function(){
    responseData = arguments
  }
 
  // 添加回调函数名到script的url
  script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
  document.head.appendChild(script)
 
  // 利用setTime设置超时, outoptions.timeout后触发abort()
  if (options.timeout > 0) abortTimeout = setTimeout(function(){
    abort('timeout')
  }, options.timeout)
 
  return xhr
}
```
更多注释请看[这里](https://github.com/leolin1229/zepto/blob/master/src/note_ajax.js)

### 分析
1. zepto的ajax模块需要用到自定义事件, 因此依赖Event模块的`$.Event()`方法
2. zepto默认把jsonp1, jsonp2, jsonp3...作为回调函数名, 变量`jsonpID`用作此计数
3. 变量`$.active`作用是对活动的ajax请求计数(即当前未完成的ajax), 保证全局方法`ajaxStart()`和`ajaxStop()`只出现在所有Ajax之前或之后