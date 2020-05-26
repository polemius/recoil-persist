import React from 'react'
import ReactDOM from 'react-dom'
import { atom, useRecoilState, RecoilRoot } from 'recoil'
import recoilPersist from '../../index'

const { RecoilPersist, updateState } = recoilPersist(['count'])

const counterState = atom({
  key: 'count',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

const counterState2 = atom({
  key: 'count2',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

export default function App() {
  const [count, setCount] = useRecoilState(counterState)
  const [count2, setCount2] = useRecoilState(counterState2)
  return (
    <div className="App">
      <h3>Counter 1 (persist): {count}</h3>
      <button onClick={() => setCount(count + 1)}>Increase</button>
      <button onClick={() => setCount(count - 1)}>Decrease</button>
      <h3>Counter 2 (not persist): {count2}</h3>
      <button onClick={() => setCount2(count2 + 1)}>Increase</button>
      <button onClick={() => setCount2(count2 - 1)}>Decrease</button>
    </div>
  )
}

var mountNode = document.getElementById('app')
ReactDOM.render(
  <RecoilRoot initializeState={({ set }) => updateState({ set })}>
    <RecoilPersist />
    <App />
  </RecoilRoot>,
  mountNode,
)
