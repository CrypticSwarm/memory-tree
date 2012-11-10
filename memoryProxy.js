var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter

function getSha(parent, obj) {
  var oldJSON = Function.prototype.toJSON 
  Function.prototype.toJSON = function () { return this + '' }
  var h = crypto.createHash('sha1')
  if (parent != null) h.update(parent)
  h.update(JSON.stringify(obj))
  Function.prototype.toJSON = oldJSON
  return h.digest('hex')
}


// need to be able to Ref() -> get sha
// reset -> set proxy to sha

function wrapObj(parent, x) {
  var handler = {
    get: function(receiver, name) {
      var x = curObj[name]
      if (x == null) return x
      if (typeof x === 'object') return getWrappedObject(x, name)
      // Do something for functions?
      return x
    },
    set: function(receiver, name, val) {
      setObject(name, val)
      return true
    },
    getOwnPropertyDescriptor: function (name) {
      var obj = curObj
      var desc
      while(obj) {
        desc = Object.getOwnPropertyDescriptor(obj, name);
        if (desc) obj = null
        else obj = obj.__proto__
      }
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true; }
      return desc;
    },
    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(obj);
    },
    enumerate: function() {
      var result = []
      for (name in curObj) { result.push(name) }
      return result
    },
    keys: function() {
      if (!emitter.viewAll) return Object.keys(curObj)
      var result = []
      for (name in curObj) { result.push(name) }
      return result
    }
  }
  var proxy = Proxy.create(handler)
  var emitter = new EventEmitter()
  var shaList = {}
  var objList = new WeakMap()
  var curSha = getSha(parent, x)
  var curObj = x

  emitter.getSha = function getSha() {
    return curSha
  }

  emitter.setSha = function setSha(sha) {
    if (!shaList[sha]) return false
    curSha = sha
    curObj = shaList[sha]
    return true
  }
  
  function setObject(name, val) {
    var newObj = Object.create(curObj)
    newObj[name] = val
    var sha = getSha(curSha, newObj)
    curSha = sha
    if (shaList[sha]) {
      curObj = shaList[sha]
    }
    else {
      curObj = newObj
      shaList[sha] = newObj
    }
    emitter.emit('change', curObj, curSha)
  }

  function getWrappedObject(obj, name) {
    if (objList.has(obj)) return objList.get(obj)
    var wrapped = wrapObj(curSha, obj)
    objList.set(obj, wrapped)
    wrapped[1].on('change', setObject.bind(null, name))
    return wrapped[0]
  }

  return [proxy, emitter]
}

function createMemProxy(initialObject) {
  return wrapObj(null, initialObject)
}

module.exports = createMemProxy
