import matcher from './matcher.js'

matcher('blee', /bar/)
  .then((match) => {
    console.log('bar match: ', match)
  })
  .or(/baz/)
  .then((match) => {
    console.log('baz match: ', match)
  })
  .or(/blee/)
  .then((match) => {
    console.log('blee match: ', match)
  })
  .or(() => {
    console.log('no match!')
  })
