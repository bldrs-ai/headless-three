import {parseUrl} from './urls.js'


describe('parseUrl', () => {
  it('parses bldrs index.ifc', () => {
    const url = new URL('https://bldrs.ai/share/v/p/index.ifc#c:-133.022,131.828,161.85,-38.078,22.64,-2.314')
    const converted = new URL('https://raw.githubusercontent.com/bldrs-ai/Share/main/public/index.ifc')
    const parsed = parseUrl(url)
    expect(parsed).toStrictEqual({
        original: url,
        type: 'vcs:github',
        target: {
          organization: 'bldrs-ai',
          repository: 'Share',
          ref: 'main',
          url: converted
        },
        params: { c: '-133.022,131.828,161.85,-38.078,22.64,-2.314' }
      })
  })


  it('parses bldrs index.ifc', () => {
    const url = new URL('https://bldrs.ai/share/v/gh/Swiss-Property-AG/Momentum-Public/main/Momentum.ifc#c:-38.64,12.52,35.4,-5.29,0.94,0.86')
    const converted = new URL('https://raw.githubusercontent.com/Swiss-Property-AG/Momentum-Public/main/Momentum.ifc')
    const parsed = parseUrl(url)
    expect(parsed).toStrictEqual({
        original: url,
        type: 'vcs:github',
        target: {
          organization: 'Swiss-Property-AG',
          repository: 'Momentum-Public',
          ref: 'main',
          url: converted
        },
        params: { c: '-38.64,12.52,35.4,-5.29,0.94,0.86' }
      })
  })


  it('parses bldrs index.ifc', () => {
    const url = new URL('https://github.com/buildingSMART/IFC/blob/master/Examples/Building%20element%20standard%20case/Examples/Wall%20standard%20case/File.ifc')
    const converted = new URL('https://raw.githubusercontent.com/buildingSMART/IFC/master/Examples/Building%20element%20standard%20cas\
e/Examples/Wall%20standard%20case/File.ifc')
    const parsed = parseUrl(url)
    expect(parsed).toStrictEqual({
        original: url,
        type: 'vcs:github',
        target: {
          organization: 'buildingSMART',
          repository: 'IFC',
          ref: 'master',
          url: converted
        },
        params: {
          "": undefined,
        },
      })
  })


  it('parses localhost file ref', () => {
    const url = new URL('https://localhost.8090/models/bld/mix.bld')
    const parsed = parseUrl(url)
    expect(parsed).toStrictEqual({
        original: url,
        type: 'url',
        target: {
          url: url
        },
        params: {
          "": undefined,
        },
      })
  })
})
