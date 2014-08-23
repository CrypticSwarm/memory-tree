var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter

function getSha(data) {
  var h = crypto.createHash('sha1')
  h.update(data)
  return h.digest('hex')
}

function wrapObj(parent, x) {
  var handler = {
    get: function(receiver, name) {
      if (name === 'toJSON') return function() { return JSON.stringify(curObj) }
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
      return handler.getPropertyDescriptor(name)
    },
    getPropertyDescriptor: function (name) {
      var obj = curObj
      var desc
      while(obj) {
        desc = Object.getOwnPropertyDescriptor(obj, name)
        if (desc) obj = null
        else obj = obj.__proto__
      }
      // a trapping proxy's properties must always be configurable
      if (desc !== undefined) { desc.configurable = true }
      return desc
    },
    getOwnPropertyNames: function() {
      return handler.getPropertyNames()
    },
    getPropertyNames: function() {
      return Object.getOwnPropertyNames(obj)
    },
    enumerate: function() {
      var result = []
      for (var name in curObj) { result.push(name) }
      return result
    },
    keys: function() {
      if (!emitter.viewAll) return Object.keys(curObj)
      var result = []
      for (var name in curObj) { result.push(name) }
      return result
    }
  }

  var proxy = Proxy.create(handler)
  var emitter = new EventEmitter()
  var shaList = {}
  var objList = new WeakMap()
  var curSha = getSha(parent + JSON.stringify(x))
  var curObj = x
  shaList[curSha] = curObj
  function getObjSha(obj) {
    var oldJSON = Function.prototype.toJSON
    Function.prototype.toJSON = function () { return this + '' }
    var sha = getSha(curSha + JSON.stringify(obj))
    Function.prototype.toJSON = oldJSON
    return sha
  }

  emitter.handler = handler
  emitter.getSha = function getSha() {
    return curSha
  }

  emitter.setSha = function setSha(sha) {
    if (!shaList[sha]) return false
    curSha = sha
    curObj = shaList[sha]
    emitter.emit('change', curObj, curSha)
    return true
  }

  function setObject(name, val) {
    var newObj = Object.create(curObj)
    newObj[name] = val
    var sha = getObjSha(newObj)
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
    if (objList.has(obj)) return objList.get(obj)[0]
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


function createMemoryScope(initialObject, parentScopeInfo) {
  var varDiffInfo = createMemProxy(initialObject)
  var parentScope = parentScopeInfo[0]
  var parentScopeMeta = parentScopeInfo[1]
  var emitter = new EventEmitter()
  var varDiff = varDiffInfo[0]
  var varDiffMeta = varDiffInfo[1]
  var get = varDiffMeta.handler.get
  var set = varDiffMeta.handler.set
  var shaList = {}
  var curSha
  var curObj
  setObject(parentScopeMeta.getSha(), varDiffMeta.getSha())

  parentScopeMeta.on('change', objChange)
  varDiffMeta.on('change', objChange)

  function setObject(parent, diff) {
    var sha = getObjSha(parent, diff)
    curSha = sha
    if (shaList[sha]) curObj = shaList[sha]
    else {
      curObj = { parentScope: parent, diffVar: diff }
      shaList[sha] = curObj
    }
    emitter.emit('change', curObj, curSha)
  }

  function getObjSha(parent, diff) {
    return getSha(parent + diff)
  }

  function objChange() {
    return setObject(parentScopeMeta.getSha(), varDiffMeta.getSha())
  }

  varDiffMeta.handler.set = function setTrap(receiver, name, val) {
    if (Object.hasOwnProperty.call(initialObject, name)) return set.apply(this, arguments)
    else return parentScope[name] = val
  }

  varDiffMeta.handler.get = function getTrap(receiver, name) {
    if (Object.hasOwnProperty.call(initialObject, name)) return get.apply(this, arguments)
    else return parentScope[name]
  }

  emitter.getSha = function getSha() {
    return curSha
  }

  emitter.setSha = function setSha(sha) {
    if (!shaList[sha]) return false
    curSha = sha
    var obj = curObj = shaList[sha]
    parentScopeMeta.setSha(obj.parentScope)
    varDiffMeta.setSha(obj.diffVar)
    emitter.emit('change', curObj, curSha)
    return true
  }

  emitter.parentScope = parentScopeInfo[1]
  emitter.scope = varDiff

  emitter.__defineSetter__('viewAll', function (val) {
    varDiffMeta.viewAll = val
    return true
  })

  return [varDiff, emitter]
}

var dummyStackInfo = [null, { getSha: function () { return "" }, setSha: function() {}, on: function () {} }]

function createMemoryStack(parentStackInfo, scopeInfo, callInfo, scopeIndex) {
  var emitter = new EventEmitter()
  parentStackInfo = parentStackInfo || dummyStackInfo
  var parentStack = parentStackInfo[0]
  var parentStackMeta = parentStackInfo[1]
  var scope = scopeInfo[0]
  var scopeMeta = scopeInfo[1]
  var shaList = {}
  var curSha
  var curObj

  setObject(parentStackMeta.getSha(), scopeMeta.getSha())
  parentStackMeta.on('change', objChange)
  scopeMeta.on('change', objChange)

  function getObjSha(parent, scope) {
    return getSha(parent + scope)
  }

  function objChange() {
    return setObject(parentStackMeta.getSha(), scopeMeta.getSha())
  }

  function setObject(parent, scope) {
    var sha = getObjSha(parent, scope)
    curSha = sha
    if (shaList[sha]) curObj = shaList[sha]
    else {
      curObj = { parentStack: parent, scope: scope }
      shaList[sha] = curObj
    }
    emitter.emit('change', curObj, curSha)
  }

  emitter.getSha = function getSha() {
    return curSha
  }

  emitter.setSha = function setSha(sha) {
    if (!shaList[sha]) return false
    curSha = sha
    curObj = shaList[sha]
    parentStackMeta.setSha(curObj.parentStack)
    scopeMeta.setSha(curObj.scope)
    emitter.emit('change', curObj, curSha)
    return true
  }

  var stackObj = { scope: scope
                 , caller: parentStack
                 , callInfo: callInfo 
                 , scopeMeta: scopeMeta
                 }

  return [stackObj, emitter]
}

module.exports = createMemProxy
createMemProxy.Scope = createMemoryScope
createMemProxy.Stack = createMemoryStack
