/**
 * Process URL to find common redirect targets and parse hash param.
 * @param {URL} url
 * @return {Object} Share URL object
 */
export function parseUrl(url) {
  if (url === undefined || url === null) {
    throw new Error('No URL provided')
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
      url: parsed.original
    }
  }

  if (url.pathname.indexOf('/share/v/gh') !== -1) {
    const p = url.pathname.substring('/share/v/gh'.length)
    const parts = p.substring(1).split('/')
    const [org, repo, ref] = parts
    const path = parts.slice(3).join('/')

    parsed.type = 'vcs:github'
    parsed.target = {
      organization: org,
      repository: repo,
      ref: ref,
      url: new URL(`/${org}/${repo}/${ref}/${path}`, 'https://raw.githubusercontent.com')
    }
  }

  return parsed
}


export function parseCoords(url) {
  let c = [0,0,0,0,0,0]
  if (url.hash) {
    let params = url.hash.split('::')
    const paramsList = url.hash.substring(1).split('::')
    paramsList.forEach((p) => {
      const [k, v] = p.split(':', 2)
      params[k] = v
    })
    params = params
    if ('c' in params) {
      c = params['c'].split(',').map(f => parseFloat(f))
    }
  }
  return c
}
