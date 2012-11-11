var Memory = require('./memoryProxy')

var mem = Memory({ a: 123, b: 345, c: { b: 1} })
var obj = mem[0]

obj.a = 456
obj.c.b = 9
obj.c
var oldRef = mem[1].getSha()

obj.c.b = 12
var change1 = mem[1].getSha()

mem[1].setSha(oldRef)

obj.c.b = 12
var change2 = mem[1].getSha()

console.log(change1 === change2)

obj.x = { y: { z: { a: { b: { c: 21 }}}}}

var z = { a: 1, b: 2, c: 3, d: 4, e: 5 }

obj.x.y.z.a.b.c = 'Jump Street'

console.log(obj.x.y.z.a)
mem[1].viewAll = true
console.log(obj)
mem[1].setSha(oldRef)
console.log(obj)

var globScopeInfo = Memory.Scope({ a: 1, b: 2, c: { d: {} } }, Memory({}))
var glob = globScopeInfo[0]
var childInfo = Memory.Scope({ x: 1, y: 2 }, globScopeInfo)
var child = childInfo[0]

console.log('---')
console.log(glob)
console.log(child)
console.log(childInfo[1].getSha())

child.x = 7
console.log('---')
console.log(glob)
console.log(child)
console.log(childInfo[1].getSha())

child.c.d.f = 52
console.log('---')
console.log(glob)
console.log(child)
childInfo[1].viewAll = true
globScopeInfo[1].viewAll = true
console.log(glob)
console.log(child)
childInfo[1].viewAll = false
globScopeInfo[1].viewAll = false
console.log(childInfo[1].getSha())