import { AtomEffect } from 'recoil'

export interface PersistStorage {
  setItem(key: string, value: string): void | Promise<void>
  mergeItem?(key: string, value: string): Promise<void>
  getItem(key: string): null | string | Promise<null | string>
}

export interface PersistConverter {
  stringify: (value: any) => string
  parse: (value: string) => any
}

export interface StorageEvent {
  readonly key?: string | null;
  readonly newValue?: string | null;
}

export interface PersistConfiguration {
  key?: string
  storage?: PersistStorage
  addStorageListener?: ((listener: (e: StorageEvent) => void) => ReturnType<AtomEffect<any>>) | null
  converter?: PersistConverter
}

/**
 * Recoil module to persist state to storage
 *
 * @param config Optional configuration object
 * @param config.key Used as key in local storage, defaults to `recoil-persist`
 * @param config.storage Local storage to use, defaults to `localStorage`
 * @param config.addStorageListener Optional method to listen to storage events
 * enabling external events to trigger application updates
 * defaults to `localStorage` events synchronizing multiple windows
 */
export const recoilPersist = (
  config: PersistConfiguration = {},
): { persistAtom: AtomEffect<any> } => {
  if (typeof window === 'undefined') {
    return {
      persistAtom: () => {},
    }
  }

  const {
    key = 'recoil-persist',
    storage = localStorage,
    converter = JSON,
    addStorageListener = (listener) => {
      window.addEventListener('storage', listener)
      return () => window.removeEventListener('storage', listener)
    },
  } = config

  const persistAtom: AtomEffect<any> = ({ onSet, node, trigger, setSelf, resetSelf }) => {
    if (trigger === 'get') {
      const state = getState()
      if (typeof state.then === 'function') {
        state.then((s) => {
          if (s.hasOwnProperty(node.key)) {
            setSelf(s[node.key])
          }
        })
      }
      if (state.hasOwnProperty(node.key)) {
        setSelf(state[node.key])
      }
    }

    onSet(async (newValue, _, isReset) => {
      const state = getState()
      if (typeof state.then === 'function') {
        state.then((s: any) => updateState(newValue, s, node.key, isReset))
      } else {
        updateState(newValue, state, node.key, isReset)
      }
    })

    if(addStorageListener) {
      const removeStorageListener = addStorageListener((e: StorageEvent) => {
        if(e.key == key) {
          const state = parseState(e.newValue)
          if(node.key in state) {
            setSelf(state[node.key])
          } else {
            resetSelf()
          }
        }
      });
      return removeStorageListener;
    }
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

  const getState = (): any => {
    const toParse = storage.getItem(key)
    if (toParse === null || toParse === undefined) {
      return {}
    }
    if (typeof toParse === 'string') {
      return parseState(toParse)
    }
    if (typeof toParse.then === 'function') {
      return toParse.then(parseState)
    }

    return {}
  }

  const parseState = (state?: string | null) => {
    if (!state) {
      return {}
    }
    try {
      return converter.parse(state)
    } catch (e) {
      console.error(e)
      return {}
    }
  }

  const setState = (state: any): void => {
    try {
      if (typeof storage.mergeItem === 'function') {
        storage.mergeItem(key, converter.stringify(state))
      } else {
        storage.setItem(key, converter.stringify(state))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return { persistAtom }
}
