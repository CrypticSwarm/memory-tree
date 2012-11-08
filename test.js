var MemoryTree = require('./memory')

var a = { a: {}, b: {} }
a = new MemoryTree(a)

a.set('a.b', 7)
.set('b.b', 9)
.set('a.c', 43)
.set('a.d', 97)
.set('b.z', 9)
.set('c.z', 84).previous.previous.set('j.z', 92)
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
