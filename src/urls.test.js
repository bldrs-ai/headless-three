import {
  maybeResolveLocalPath,
  parseUrl,
  SOURCE_TYPE
} from './urls.js'


// TODO(https://github.com/oven-sh/bun/issues/6492): switch back to toStrictEquals when fixed.

describe('parseUrl', () => {
  it('parses bldrs index.ifc', () => {
    const url = new URL('https://bldrs.ai/share/v/p/index.ifc#c:-133.022,131.828,161.85,-38.078,22.64,-2.314')
    const converted = new URL('https://raw.githubusercontent.com/bldrs-ai/Share/main/public/index.ifc')
    const parsed = parseUrl(url)
    expect(parsed).toEqual({
        original: url,
        type: SOURCE_TYPE.VCS,
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
    expect(parsed).toEqual({
        original: url,
        type: SOURCE_TYPE.VCS,
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
    const converted = new URL('https://raw.githubusercontent.com/buildingSMART/IFC/master/Examples/Building%20element%20standard%20case/Examples/Wall%20standard%20case/File.ifc')
    const parsed = parseUrl(url)
    const expected = {
        original: url,
        type: SOURCE_TYPE.VCS,
        target: {
          organization: 'buildingSMART',
          repository: 'IFC',
          ref: 'master',
          url: converted
        },
        params: {
          "": undefined,
        },
    }
    expect(parsed).toEqual(expected)
  })

  it('parses Share URL with express IDs', () => {
    const url = new URL('https://bldrs.ai/share/v/gh/OlegMoshkovich/Logo/main/IFC_STUDY.ifc/103/25873/113/122/743#c:148.452,-15.74,178.856,14.375,24.677,-9.003')
    const converted = new URL('https://raw.githubusercontent.com/OlegMoshkovich/Logo/main/IFC_STUDY.ifc')

    const parsed = parseUrl(url)
    const expected = {
      original: url,
      type: SOURCE_TYPE.VCS,
      target: {
        organization: 'OlegMoshkovich',
        repository: 'Logo',
        ref: 'main',
        url: converted
      },
      params: {
        'c': '148.452,-15.74,178.856,14.375,24.677,-9.003'
      },
    }

    expect(parsed).toEqual(expected)
  })


  it('parses localhost file ref', () => {
    const url = new URL('https://localhost:8090/models/bld/mix.bld')
    const parsed = parseUrl(url)
    expect(parsed).toEqual({
        original: url,
        type: SOURCE_TYPE.URL,
        target: {
          url: url
        },
        params: {
          "": undefined,
        },
      })
  })


  it('maybeResolveLocalPath', () => {
    const localUrl = maybeResolveLocalPath('models/index.bld')
    expect(localUrl.protocol).toBe('file:')
    expect(localUrl.pathname).toBeDefined()
    expect(localUrl.pathname.startsWith('/')).toBe(true)
    expect(localUrl.pathname.endsWith('models/index.bld')).toBe(true)
  })
})
