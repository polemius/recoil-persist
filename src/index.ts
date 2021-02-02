import { AtomEffect } from 'recoil'

export interface PersistConfiguration {
  key?: string
  storage?: Storage
}

/**
 * Recoil module to persist state to storage
 *
 * @param config Optional configuration object
 * @param config.key Used as key in local storage, defaults to `recoil-persist`
 * @param config.storage Local storage to use, defaults to `localStorage`
 */
export const recoilPersist = (
  config: PersistConfiguration = {},
): { persistAtom: AtomEffect<any> } => {
  const { key = 'recoil-persist', storage = localStorage } = config

  if (typeof window === 'undefined') {
    return {
      persistAtom: () => {},
    }
  }

  const persistAtom: AtomEffect<any> = ({ onSet, node, trigger, setSelf }) => {
    if (trigger === 'get') {
      if (containsKey(node.key)) setSelf(retrieveValue(node.key))
    }
    onSet(persistValue(node.key))
  }

  const containsKey = (key: string): boolean => {
    const state = getState()
    return state.hasOwnProperty(key)
  }

  const retrieveValue = (key: string): any => {
    const state = getState()
    return state[key]
  }

  const persistValue = (name: string) => (newValue: any): void => {
    let state = getState()
    state[name] = newValue
    setState(state)
  }

  const getState = (): any => {
    const toParse = storage.getItem(key)
    if (toParse) {
      try {
        return JSON.parse(toParse)
      } catch (e) {
        console.error(e)
        return {}
      }
    } else {
      return {}
    }
  }

  const setState = (state: any): void => {
    try {
      storage.setItem(key, JSON.stringify(state))
    } catch (e) {
      console.error(e)
    }
  }

  return { persistAtom }
}
