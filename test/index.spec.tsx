import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { atom, atomFamily, RecoilRoot, useRecoilState } from 'recoil'
import { recoilPersist } from '../src'

const { persistAtom } = recoilPersist()

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

function Demo() {
  const [count, setCount] = useRecoilState(counterState)
  const [count2, setCount2] = useRecoilState(counterFamily('2'))
  const [count3, setCount3] = useRecoilState(counterFamily('3'))
  const [count4, setCount4] = useRecoilState(counterState4)
  return (
    <div>
      <p data-testid="count-value">{count}</p>
      <p data-testid="count2-value">{count2}</p>
      <p data-testid="count3-value">{count3}</p>
      <p data-testid="count4-value">{count4}</p>
      <button data-testid="count-increase" onClick={() => setCount(count + 1)}>
        Increase
      </button>
      <button
        data-testid="count2-increase"
        onClick={() => setCount2(count2 + 1)}
      >
        Increase 2
      </button>
      <button
        data-testid="count3-increase"
        onClick={() => setCount3(count3 + 1)}
      >
        Increase 3
      </button>
      <button
        data-testid="count4-increase"
        onClick={() => setCount4(count4 + 1)}
      >
        Increase 4
      </button>
    </div>
  )
}

const error = jest.fn()
console.error = error

const asyncStorage = () => {
  let s = {}
  return {
    setItem: (key: string, value: string) => {
      return new Promise((resolve) => {
        s[key] = value
        resolve(value)
      })
    },
    getItem: (key: string): Promise<string> => {
      return new Promise((resolve) => {
        resolve(s[key])
      })
    },
    clear: () => {
      s = {}
    },
  }
}

const storage = asyncStorage()

const { persistAtom: persistAtomAsync } = recoilPersist({
  storage,
})

const counterStateAsync = atom({
  key: 'count_async',
  default: 0,
  effects_UNSTABLE: [persistAtomAsync],
})

function DemoAsync() {
  const [count, setCount] = useRecoilState(counterStateAsync)

  return (
    <div>
      <p data-testid="count-value">{count}</p>
      <button data-testid="count-increase" onClick={() => setCount(count + 1)}>
        Increase
      </button>
    </div>
  )
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  jest.restoreAllMocks()
  error.mockClear()
  storage.clear()
})

it('should update localStorage', async () => {
  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  fireEvent.click(getByTestId('count-increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toStrictEqual({
    count: 1,
  })
  expect(sessionStorage.getItem('recoil-persist')).toBeNull()
})

it('should update localStorage if using atomFamily', async () => {
  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )
  fireEvent.click(getByTestId('count2-increase'))
  fireEvent.click(getByTestId('count3-increase'))
  await waitFor(() => expect(getByTestId('count2-value').innerHTML).toBe('1'))
  await waitFor(() => expect(getByTestId('count3-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toStrictEqual({
    'countFamily__"2"': 1,
    'countFamily__"3"': 1,
  })
})

it('should not persist atom with no effect', async () => {
  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  fireEvent.click(getByTestId('count4-increase'))
  await waitFor(() => expect(getByTestId('count4-value').innerHTML).toBe('1'))
  expect(JSON.parse(localStorage.getItem('recoil-persist'))).toBeNull()
})

it('should read state from localStorage', async () => {
  localStorage.setItem(
    'recoil-persist',
    JSON.stringify({ count: 1, 'countFamily__"2"': 1 }),
  )

  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  expect(getByTestId('count-value').innerHTML).toBe('1')
  expect(getByTestId('count2-value').innerHTML).toBe('1')
})

it('should use default value if not in storage', async () => {
  localStorage.setItem(
    'recoil-persist',
    JSON.stringify({ count: 1, 'countFamily__"2"': 1 }),
  )

  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  expect(getByTestId('count3-value').innerHTML).toBe('0')
})

it('should handle non :jsonable object in localStorage', async () => {
  localStorage.setItem('recoil-persist', 'test string')

  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('0'))
})

it('should handle non jsonable object in state', async () => {
  let mock = jest.spyOn(JSON, 'stringify').mockImplementation(() => {
    throw Error('mock error')
  })

  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  fireEvent.click(getByTestId('count-increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  expect(mock).toHaveBeenCalledTimes(1)
  expect(console.error).toHaveBeenCalledTimes(1)
})

it('should handle non-existent atom name stored in storage', async () => {
  localStorage.setItem(
    'recoil-persist',
    JSON.stringify({
      notExist: 'test value',
    }),
  )

  const { getByTestId } = render(
    <RecoilRoot>
      <Demo />
    </RecoilRoot>,
  )

  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('0'))
})

it('should handle store if it return Promise', async () => {
  const { getByTestId } = render(
    <RecoilRoot>
      <DemoAsync />
    </RecoilRoot>,
  )

  fireEvent.click(getByTestId('count-increase'))
  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('1'))
  const value = await storage.getItem('recoil-persist')

  expect(JSON.parse(value)).toStrictEqual({
    count_async: 1,
  })
})

it('should read state from async storage', async () => {
  await storage.setItem('recoil-persist', JSON.stringify({ count_async: 10 }))

  const { getByTestId } = render(
    <RecoilRoot>
      <DemoAsync />
    </RecoilRoot>,
  )

  await waitFor(() => expect(getByTestId('count-value').innerHTML).toBe('10'))
})
