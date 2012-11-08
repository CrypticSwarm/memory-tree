var test = require('tap').test
var MemoryTree = require('./memory')

test('match vars', function (t) {
  var init = { a: {}, b: {} }
  a = new MemoryTree(init)
  t.same(a.value, { a: {}, b: {} })

  a = a.set('a.b', 7)
  t.same(a.value, { a: { b: 7 } })

  a = a.set('b.b', 9)
  t.same(a.value.a, { b: 7 })
  t.same(a.value, { b: { b: 9 } })

  a = a.set('a.c', 43)
  t.same(a.value, { a: { c: 43 } })

  a = a.set('a.d', 97)
  t.same(a.value, { a: { d: 97 } })

  a = a.set('c.z', 84).previous.previous
  t.same(a.value, { a: { c: 43 } })
  t.same(a.next.value, { a: { d: 97 } })

  t.end()
})

/*
print(a.previous.value)
console.log(a.value)
print(a.tnext.value)
console.log(a.value)
function print(obj, sp) {
  sp = sp || ''
  var delim = ''
  if ( typeof obj == 'object') {
    process.stdout.write(sp + '{ ')
    for(var i in obj) {
      process.stdout.write(sp + delim + i + ':')
      if (typeof obj[i] == 'object') process.stdout.write('\n')
      print(obj[i], sp + '  ')
      delim = ', '
    }
    console.log(sp + '}')
  }
  else console.log(sp + obj)
}
*/
