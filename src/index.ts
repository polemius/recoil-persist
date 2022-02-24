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

interface PendingChanges {
  queue: Promise<any> | null
  updates: Partial<PersistState>
  reset: Record<string, boolean>
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

  const pendingChanges: PendingChanges = {
    queue: null,
    updates: {},
    reset: {},
  }

  const persistAtom: AtomEffect<any> = ({ onSet, node, trigger, setSelf }) => {
    if (trigger === 'get') {
      getState().then((s) => {
        if (s.hasOwnProperty(node.key)) {
          setSelf(s[node.key])
        }
      })
    }

    onSet((newValue, _, isReset) => {
      if (isReset) {
        pendingChanges.reset[node.key] = true
        delete pendingChanges.updates[node.key]
      } else {
        pendingChanges.updates[node.key] = newValue
      }
      if (!pendingChanges.queue) {
        pendingChanges.queue = getState().then((state) => {
          updateState(state, pendingChanges)
          pendingChanges.queue = null
          pendingChanges.reset = {}
          pendingChanges.updates = {}
        })
      }
    })
  }

  const updateState = (state: PersistState, changes: PendingChanges) => {
    Object.keys(changes.reset).forEach((key) => {
      delete state[key]
    })
    Object.keys(changes.updates).forEach((key) => {
      state[key] = changes.updates[key]
    })
    setState(state)
  }

  const parseState = (toParse: PersistItemValue): PersistState => {
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
