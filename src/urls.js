/**
 * Parses a BLDRS Share URL and returns its parameters
 * @param {URL} url
 * @return {Object} Share URL object
 */
export const parseURLFromBLDRS = (url) => {
  if (url === undefined || url === null) {
    throw new Error('No URL provided')
  }

  if (url.hostname !== 'bldrs.ai') {
    throw new Error('Non-BLDRS URL provided')
  }

  if (url.pathname.indexOf('/share/v/new') !== -1) {
    throw new Error('Local imports are not supported')
  }

  const parsed = {
    original: url,
    type: undefined,
    target: undefined,
    params: undefined
  }

  const params = {}
  const paramsList = url.hash.substring(1).split('::')
  paramsList.forEach((p) => {
    const [k, v] = p.split(':', 2)
    params[k] = v
  })
  parsed.params = params

  if (url.pathname.indexOf('/share/v/p') !== -1) {
    parsed.type = 'url'
    parsed.target = {
      url: new URL(url.pathname.substring('/v/p'.length), parsed.original)
    }
  }

  if (url.pathname.indexOf('/share/v/gh') !== -1) {
    const p = url.pathname.substring('/share/v/gh'.length)
    const [org, repo, ref, path] = p.substring(1).split('/', 4)

    parsed.type = 'vcs:github'
    parsed.target = {
      organization: org,
      repository: repo,
      ref: ref,
      url: new URL(`/${org}/${repo}/blob/${ref}/${path}`, 'https://github.com')
    }
  }

  return parsed
}
