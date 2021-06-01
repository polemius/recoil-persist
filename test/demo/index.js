import React from 'react'
import ReactDOM from 'react-dom'
import { atom, atomFamily, RecoilRoot, useRecoilState } from 'recoil'
import { recoilPersist } from '../../src'

const { persistAtom } = recoilPersist({ key: 'abc1234' })

const counterState = atom({
  key: 'count',
  default: 0,
  effects_UNSTABLE: [persistAtom],
})

const counterFamily = atomFamily({
  key: 'countFamily',
  default: 0,
  effects_UNSTABLE: [persistAtom],
})

const counterState4 = atom({
  key: 'count4',
  default: 0,
})

export default function App() {
  const [count, setCount] = useRecoilState(counterState)
  const [count2, setCount2] = useRecoilState(counterFamily('2'))
  const [count3, setCount3] = useRecoilState(counterFamily('3'))
  const [count4, setCount4] = useRecoilState(counterState4)

  return (
    <div className="App">
      <h3>Counter 1 (persist): {count}</h3>
      <button onClick={() => setCount(count + 1)}>Increase</button>
      <button onClick={() => setCount(count - 1)}>Decrease</button>
      <h3>Counter 2 (persist, atomFamily): {count2}</h3>
      <button onClick={() => setCount2(count2 + 1)}>Increase</button>
      <button onClick={() => setCount2(count2 - 1)}>Decrease</button>
      <h3>Counter 3 (persist, atomFamily): {count3}</h3>
      <button onClick={() => setCount3(count3 + 1)}>Increase</button>
      <button onClick={() => setCount3(count3 - 1)}>Decrease</button>
      <h3>Counter 4 (do not persist): {count4}</h3>
      <button onClick={() => setCount4(count4 + 1)}>Increase</button>
      <button onClick={() => setCount4(count4 - 1)}>Decrease</button>
      <br />
      <br />
      <button
        onClick={() => {
          setCount(10)
          setCount2(11)
        }}
      >
        Set multiple
      </button>
    </div>
  )
}

const mountNode = document.getElementById('app')
ReactDOM.render(
  <RecoilRoot>
    <App />
  </RecoilRoot>,
  mountNode,
)
