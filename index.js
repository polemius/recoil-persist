import { useTransactionObservation_UNSTABLE } from 'recoil'

const key = 'recoil-persist'

export function RecoilPersist() {
  useTransactionObservation_UNSTABLE(persistState)
  return null
}

function persistState(event) {
  const toStore = {}
  event.atomValues.forEach((value, name) => {
    toStore[name] = value
  })
  localStorage.setItem(key, JSON.stringify(toStore))
}

export function updateState({ set }) {
  const toParse = localStorage.getItem(key)
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
    set({ key }, state[key])
  })
}

export default RecoilPersist
