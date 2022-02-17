import { AtomEffect } from 'recoil'

type PersistItemValue = string | undefined | null

export interface PersistStorage {
  setItem(key: string, value: string): any
  mergeItem?(key: string, value: string): any
  getItem(key: string): PersistItemValue | Promise<PersistItemValue>
}

export interface PersistState {}

export interface PersistConfiguration {
  key: string
  storage: PersistStorage
}

/**
 * Recoil module to persist state to storage
 *
 * @param config Optional configuration object
 * @param config.key Used as key in local storage, defaults to `recoil-persist`
 * @param config.storage Local storage to use, defaults to `localStorage`
 */
export const recoilPersist = (
  config: Partial<PersistConfiguration> = {},
): { persistAtom: AtomEffect<any> } => {
  if (typeof window === 'undefined') {
    return {
      persistAtom: () => {},
    }
  }

  const {
    key = 'recoil-persist' as PersistConfiguration['key'],
    storage = localStorage as PersistConfiguration['storage'],
  } = config

  const persistAtom: AtomEffect<any> = ({ onSet, node, trigger, setSelf }) => {
    if (trigger === 'get') {
      getState().then((s) => {
        if (s.hasOwnProperty(node.key)) {
          setSelf(s[node.key])
        }
      })
    }

    onSet(async (newValue, _, isReset) => {
      getState().then((s) => updateState(newValue, s, node.key, isReset))
    })
  }

  const updateState = (
    newValue: any,
    state: any,
    key: string,
    isReset: boolean,
  ) => {
    if (isReset) {
      delete state[key]
    } else {
      state[key] = newValue
    }

    setState(state)
  }

  const parseState = (toParse: string | null | undefined): PersistState => {
    if (toParse === null || toParse === undefined) {
      return {}
    }
    try {
      return JSON.parse(toParse)
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  const getState = (): Promise<PersistState> =>
    Promise.resolve(storage.getItem(key)).then(parseState)

  const setState = (state: PersistState): void => {
    try {
      if (typeof storage.mergeItem === 'function') {
        storage.mergeItem(key, JSON.stringify(state))
      } else {
        storage.setItem(key, JSON.stringify(state))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return { persistAtom }
}
