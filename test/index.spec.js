import React from 'react'
import { updateState, RecoilPersist } from '..'
import { render, fireEvent, waitFor } from '@testing-library/react'
import * as recoil from 'recoil'

const counterState = recoil.atom({
  key: 'count',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

function Demo() {
  const [count, setCount] = recoil.useRecoilState(counterState)
  return (
    <div>
      <p data-testid="count-value">{count}</p>
      <button onClick={() => setCount(count + 1)}>Increase</button>
    </div>
  )
}

afterEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
})

it('should update localStorage', async () => {
  const { getByText, getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  fireEvent.click(getByText('Increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toStrictEqual({
    count: 1,
  })
})

it('should read state from localStorage', async () => {
  localStorage.setItem('recoil-persist', JSON.stringify({ count: 1 }))

  const { getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  expect(getByTestId('count-value').innerHTML).toBe('1')
})
