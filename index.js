import { useTransactionObservation_UNSTABLE } from 'recoil'

export function RecoilPersist() {
    useTransactionObservation_UNSTABLE((e) => {
      e.modifiedAtoms.forEach((name) => {
        // persist state
      })
    })
    return null
  }
  
  export default RecoilPersist
  