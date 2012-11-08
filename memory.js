function get(root, path, force) {
  var context = root, paths = (Array.isArray(path) ? path : path.split('.'));
  return paths.every(function(path){
    var cur = context;
    if (path in context) context[path] = Object.create(context[path])
    if (force && !(path in context)) context[path] = {};
    return context = context[path];
  }) && context || null;
};

function set(memTree, path, val) {
  path = path.split('.');
  var prop = path.pop()
    , temp
    , parent = memTree.current

  obj = Object.create(memTree.current.obj)
  temp = get(obj, path, true)
  temp[prop] = val
  Object.defineProperties(obj, { $$historyEntry: { enumerable: false, value: { obj: obj, parent: parent } } });
  memTree.backqueue.length = 0
  memTree.queue.push(obj.$$historyEntry);
  memTree.current = obj.$$historyEntry;
  return memTree;
  
}

function MemoryTree(obj) {
  Object.defineProperties(obj, 
    { $$historyEntry: { enumerable: false, value: { obj: obj, parent: null } }});
  Object.defineProperties(this,
    { 'queue': { enumerable: false, value: [obj.$$historyEntry] }
    , 'backqueue': { enumberable: false, value: [] }
    , 'current': { enumberable: false, value: obj.$$historyEntry, writable: true }
    })
  this.set = function(path, val) {
    return set(this, path, val);
  }
  this.__defineGetter__('previous', function() {
    if (this.current.parent) {
      this.backqueue.push(this.current)
      this.current = this.current.parent;
    }
    return this
  })
  this.__defineGetter__('next', function(){
    if (this.backqueue.length) this.current = this.backqueue.pop()
    return this;
  })
  this.__defineGetter__('value', function() {
    return this.current.obj
  })
  this.__defineGetter__('tnext', function() {
    var index = this.queue.indexOf(this.current)
    console.log(index)
    if (index != -1 && index + 1 < this.queue.length) this.current = this.queue[index + 1]
    return this
  })
  this.__defineGetter__('tprev', function() {
    var index = this.queue.indexOf(this.current)
    if (index != -1 && index != 0) this.current = this.queue[index - 1]
    return this
  })
}

module.exports = MemoryTree
