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


