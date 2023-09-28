/**
 * Use like:
 *
 *   matcher('foo', /bar/)
 *   .then((match) => {
 *     // use match
 *   })
 *   .orMatch(/baz/)
 *   .then((match) => {
 *     // use match
 *   })
 *   .or(() => {
 *     // no match!
 *   })
 *
 * @param {string} The string to text
 * @param {RegExp} The regex to use
 * @return {function} A fluent continuation
 */
export default function matcher(str, regex) {
  return new Matcher(str).test(regex)
}


class Matcher {
  constructor(str) {
    this.str = str
    this.thenCalled = false
  }


  test(regex) {
    // console.log('test')
    this.match = this.str.match(regex)
    return this
  }


  then(cb) {
    // console.log('then')
    if (this.match && !this.thenCalled) {
      cb(this.match)
    }
    this.thenCalled = true
    return this
  }


  noop() {
    // console.log('noop')
    return this
  }


  or(regexOrElse) {
    // console.log('or')
    if (regexOrElse instanceof RegExp) {
      if (this.match) {
        return this
      } else {
        this.thenCalled = false
        return this.test(regexOrElse)
      }
    } else if (typeof regexOrElse === 'function') {
      if (!this.thenCalled) {
        regexOrElse()
      }
    } else {
      throw new Error('Mathcer.or expected regex or fn, got: ' + regexOrElse)
    }
    // expected fallthru
  }
}

