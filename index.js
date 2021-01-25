/**
 * Recoil module to persist state to passed storage (it use localStorage by default)
 *
 * @param {String[]} paths The keys of state object
 *    that will be store in storage
 * @param {Object} config The config object
 * @param {String} [config.key='recoil-persist'] The default key
 *    to use in local storage
 * @param {Storage} [config.storage] Can be set as `sessionStorage` or
 *    `localStorage`. Defaults value is `localStorage`.
 */
function recoilPersist(paths = [], config = {}) {
  if (typeof window === 'undefined') {
    return {
      RecoilPersist: () => null,
      updateState: () => {},
    }
  }

  const key = config.key || 'recoil-persist'
  const storage = config.storage || localStorage

  function persistStateEffect({ onSet, node }) {
    const name = node.key
    if (paths.includes(name)) {
      onSet(persistState(name))
    }
  }

  function setState(state) {
    try {
      storage.setItem(key, JSON.stringify(state))
    } catch (e) {
      console.error(e)
    }
  }

  function persistState(name) {
    let state = getState()
    if (state === null) {
      return () => {}
    }

    return (newValue) => {
      state[name] = newValue
      setState(state)
    }
  }

  function getState() {
    const toParse = storage.getItem(key)
    try {
      return JSON.parse(toParse) || {}
    } catch (e) {
      console.error(e)
      return null
    }
  }

  function updateState({ set }) {
    let state = getState()
    if (state === null) {
      return
    }
    Object.keys(state).forEach((key) => {
      if (paths.length === 0 || paths.includes(key)) {
        try {
          set({ key }, state[key])
        } catch (e) {
          console.error(e)
        }
      }
    })
  }

  return { updateState, persistStateEffect }
}

module.exports = { recoilPersist }
