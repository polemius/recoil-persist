import { useTransactionObservation_UNSTABLE } from 'recoil'

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
export function recoilPersist(paths = [], config = {}) {
  const key = config.key || 'recoil-persist'
  const storage = config.storage || localStorage

  function RecoilPersist() {
    useTransactionObservation_UNSTABLE(persistState)
    return null
  }

  function persistState(event) {
    const toStore = {}
    event.atomValues.forEach((value, atomName) => {
      const name = atomName.split('__')[0]
      if (paths.length === 0 || paths.includes(name)) {
        toStore[name] = value
      }
    })
    try {
      storage.setItem(key, JSON.stringify(toStore))
    } catch (e) {}
  }

  function updateState({ set }) {
    const toParse = storage.getItem(key)
    let state
    try {
      state = JSON.parse(toParse)
    } catch (e) {
      return
    }
    if (state === null) {
      return
    }
    Object.keys(state).forEach((key) => {
      if (paths.length === 0 || paths.includes(key)) {
        try {
          set({ key }, state[key])
        } catch (e) {}
      }
    })
  }

  return { RecoilPersist, updateState }
}

export default recoilPersist
