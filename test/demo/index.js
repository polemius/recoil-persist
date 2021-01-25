import React from 'react'
import ReactDOM from 'react-dom'
import { atom, atomFamily, RecoilRoot, useRecoilState } from 'recoil'
import { recoilPersist } from '../../index'

const { persistStateEffect, updateState } = recoilPersist(['count', 'count3'])

const counterState = atom({
  key: 'count',
  default: 0,
  effects_UNSTABLE: [persistStateEffect],
})

const counterState2 = atom({
  key: 'count2',
  default: 0,
  effects_UNSTABLE: [persistStateEffect],
})

const counterFamily = atomFamily({
  key: 'count3',
  default: 0,
  effects_UNSTABLE: [persistStateEffect],
})

export default function App() {
  const [count, setCount] = useRecoilState(counterState)
  const [count2, setCount2] = useRecoilState(counterState2)
  const [count3, setCount3] = useRecoilState(counterFamily('key'))
  return (
    <div className="App">
      <h3>Counter 1 (persist): {count}</h3>
      <button onClick={() => setCount(count + 1)}>Increase</button>
      <button onClick={() => setCount(count - 1)}>Decrease</button>
      <h3>Counter 2 (not persist): {count2}</h3>
      <button onClick={() => setCount2(count2 + 1)}>Increase</button>
      <button onClick={() => setCount2(count2 - 1)}>Decrease</button>
      <h3>Counter 3 (persist, atomFamily): {count3}</h3>
      <button onClick={() => setCount3(count3 + 1)}>Increase</button>
      <button onClick={() => setCount3(count3 - 1)}>Decrease</button>
    </div>
  )
}

var mountNode = document.getElementById('app')
ReactDOM.render(
  <RecoilRoot initializeState={updateState}>
    <App />
  </RecoilRoot>,
  mountNode,
)
