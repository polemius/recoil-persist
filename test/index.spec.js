import React from 'react'
import recoilPersist from '..'
import { render, fireEvent, waitFor } from '@testing-library/react'
import * as recoil from 'recoil'

const { updateState, RecoilPersist } = recoilPersist()

const counterState = recoil.atom({
  key: 'count',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

const counter2State = recoil.atom({
  key: 'count2',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

const counter3State = recoil.atomFamily({
  key: 'count3',
  default: 0,
  persistence_UNSTABLE: {
    type: 'log',
  },
})

function Demo() {
  const [count, setCount] = recoil.useRecoilState(counterState)
  const [count2, setCount2] = recoil.useRecoilState(counter2State)
  const [count3, setCount3] = recoil.useRecoilState(counter3State('key'))
  return (
    <div>
      <p data-testid="count-value">{count}</p>
      <p data-testid="count3-value">{count}</p>
      <button onClick={() => setCount(count + 1)}>Increase</button>
      <button onClick={() => setCount2(count2 + 1)}>Increase 2</button>
      <button onClick={() => setCount3(count3 + 1)}>Increase 3</button>
    </div>
  )
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
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
  expect(sessionStorage.getItem('recoil-persist')).toBeNull()
})

it('should update localStorage if using atomFamily', async () => {
  const { getByText, getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )
  fireEvent.click(getByText('Increase'))
  fireEvent.click(getByText('Increase 3'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toStrictEqual({
    count: 1,
    count3: 1,
  })
})

it('should update sessionStorage', async () => {
  const { updateState, RecoilPersist } = recoilPersist([], {
    storage: sessionStorage,
  })
  const { getByText, getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  fireEvent.click(getByText('Increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(JSON.parse(sessionStorage.getItem('recoil-persist'))).toStrictEqual({
    count: 1,
  })
  expect(localStorage.getItem('recoil-persist')).toBeNull()
})

it('should update the localStorage only white listed names', async () => {
  const { updateState, RecoilPersist } = recoilPersist(['count'])
  const { getByText, getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  fireEvent.click(getByText('Increase'))
  fireEvent.click(getByText('Increase 2'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toStrictEqual({
    count: 1,
  })
})

it('should read state from localStorage', async () => {
  localStorage.setItem(
    'recoil-persist',
    JSON.stringify({ count: 1, count3: 1 }),
  )

  const { getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  expect(getByTestId('count-value').innerHTML).toBe('1')
  expect(getByTestId('count3-value').innerHTML).toBe('1')
})

it('should hande non jsonable object in localStorage', async () => {
  localStorage.setItem('recoil-persist', 'test string')

  const { getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('0'))
})

it('should handle non jsonable object in state', async () => {
  let mock = jest.spyOn(JSON, 'stringify').mockImplementation(() => {
    throw Error('mock error')
  })

  const { getByText, getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  fireEvent.click(getByText('Increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(mock).toHaveBeenCalledTimes(1)
})

it('should  handle non existing atom name stored in storage', async () => {
  localStorage.setItem(
    'recoil-persist',
    JSON.stringify({
      notExist: 'test value',
    }),
  )

  const { getByTestId } = render(
    <recoil.RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <Demo />
    </recoil.RecoilRoot>,
  )

  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('0'))
})
