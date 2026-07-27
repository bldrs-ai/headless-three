import {
  FilenameParseError,
  isExtensionSupported,
  pathSuffixSupported,
  splitAroundExtension,
  supportedTypes,
} from './Filetype'


describe('Filetype', () => {
  const unsupportedFiletypes = ['arff', 'zip']
  it('supports only known extensions', () => {
    for (const ext of supportedTypes) {
      expect(isExtensionSupported(ext)).toBe(true)
      const path = `foo/bar/baz.${ext}`
      expect(pathSuffixSupported(path)).toBe(true)
    }
    for (const ext of unsupportedFiletypes) {
      expect(isExtensionSupported(ext)).toBe(false)
      const path = `foo/bar/baz.${ext}`
      expect(pathSuffixSupported(path)).toBe(false)
    }
  })


  it('splitAroundExtension', () => {
    for (const ext of supportedTypes) {
      const {parts, extension} = splitAroundExtension(`asdf.${ext}/blah`)
      expect(parts).toStrictEqual(['asdf', '/blah'])
      expect(extension).toStrictEqual(`.${ext}`)
    }
    expect(() => {
      splitAroundExtension(`asdf.com/blah`)
    }).toThrow(FilenameParseError)
  })


  // Matching is case-insensitive but the extension is returned as it appears
  // in the path, so callers that compare it must normalize the case first.
  it('splitAroundExtension matches uppercase and returns the extension as-matched', () => {
    for (const ext of supportedTypes) {
      const upperExt = ext.toUpperCase()
      const {parts, extension} = splitAroundExtension(`asdf.${upperExt}/blah`)
      expect(parts).toStrictEqual(['asdf', '/blah'])
      expect(extension).toStrictEqual(`.${upperExt}`)
    }
  })
})
