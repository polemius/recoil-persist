import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { atom, atomFamily, RecoilRoot, useRecoilState } from 'recoil'
import { PersistStorage, recoilPersist } from '../src'

interface TestableStorage extends PersistStorage {
  name: string

  getState(): any

  clear(): void
}

const asyncStorage = (): TestableStorage => {
  let s = {}
  return {
    name: 'async',
    setItem: (key: string, value: string) => {
      return new Promise((resolve) => {
        s[key] = value
        resolve()
      })
    },
    getItem: (key: string): Promise<string> => {
      return new Promise((resolve) => {
        resolve(s[key])
      })
    },
    getState: () => s,
    clear: () => {
      s = {}
    },
  }
}

const syncStorage = (): TestableStorage => {
  let s = {}
  return {
    name: 'sync',
    setItem: (key: string, value: string) => {
      s[key] = value
    },
    getItem: (key: string): string => {
      return s[key]
    },
    getState: () => s,
    clear: () => {
      s = {}
    },
  }
}

testPersistWith(asyncStorage())
testPersistWith(syncStorage())

function testPersistWith(storage: TestableStorage) {
  describe(`Storage: ${storage.name}`, () => {
    const testKey = 'test-key'
    const { persistAtom } = recoilPersist({ key: testKey, storage })

    const getStateValue = () => {
      return JSON.parse(storage.getState()[testKey])
    }

    const getAtomKey = (key: string) => {
      return `${storage.name}_${key}`
    }

    const counterState = atom({
      key: getAtomKey('count'),
      default: 0,
      effects_UNSTABLE: [persistAtom],
    })

    const counterFamily = atomFamily({
      key: getAtomKey('countFamily'),
      default: 0,
      effects_UNSTABLE: [persistAtom],
    })

    const counterState4 = atom({
      key: getAtomKey('count4'),
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
          <button
            data-testid="count-increase"
            onClick={() => setCount(count + 1)}
          >
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
          <button
            data-testid="count3-null-value"
            onClick={() => setCount3(null)}
          >
            Set value to null 
          </button>
          <button
            data-testid="count3-undefined-value"
            onClick={() => setCount3(undefined)}
          >
            Set value to undefined 
          </button>
        </div>
      )
    }

    beforeEach(() => {
      console.error = jest.fn()
    })

    afterEach(() => {
      storage.clear()
      jest.restoreAllMocks()
    })

    it('should update storage with null', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      fireEvent.click(getByTestId('count3-null-value'))
      await waitFor(() =>
        expect(getByTestId('count3-value').innerHTML).toBe(''),
      )

      expect(getStateValue()).toStrictEqual({
        [getAtomKey('countFamily__"3"')]: null,
      })
    })

    it('should update storage with undefined', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      fireEvent.click(getByTestId('count3-undefined-value'))
      await waitFor(() =>
        expect(getByTestId('count3-value').innerHTML).toBe(''),
      )

      expect(getStateValue()).toStrictEqual({})
      
    })

    it('should update storage', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      fireEvent.click(getByTestId('count-increase'))
      await waitFor(() =>
        expect(getByTestId('count-value').innerHTML).toBe('1'),
      )

      expect(getStateValue()).toStrictEqual({
        [getAtomKey('count')]: 1,
      })
    })

    it('should update storage if using atomFamily', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )
      fireEvent.click(getByTestId('count2-increase'))
      await waitFor(() =>
        expect(getByTestId('count2-value').innerHTML).toBe('1'),
      )
      fireEvent.click(getByTestId('count3-increase'))
      await waitFor(() =>
        expect(getByTestId('count3-value').innerHTML).toBe('1'),
      )

      expect(getStateValue()).toStrictEqual({
        [getAtomKey('countFamily__"2"')]: 1,
        [getAtomKey('countFamily__"3"')]: 1,
      })
    })

    it('should not persist atom with no effect', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      fireEvent.click(getByTestId('count4-increase'))
      await waitFor(() =>
        expect(getByTestId('count4-value').innerHTML).toBe('1'),
      )

      expect(storage.getState()[testKey]).toBeUndefined()
    })

    it('should read state from storage', async () => {
      await storage.setItem(
        testKey,
        JSON.stringify({
          [getAtomKey('count')]: 1,
          [getAtomKey('countFamily__"2"')]: 1,
        }),
      )

      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      await waitFor(() =>
        expect(getByTestId('count-value').innerHTML).toBe('1'),
      )
      await waitFor(() =>
        expect(getByTestId('count2-value').innerHTML).toBe('1'),
      )
    })

    it('should use default value if not in storage', async () => {
      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      expect(getByTestId('count3-value').innerHTML).toBe('0')
    })

    it('should handle non jsonable object in storage', async () => {
      storage.setItem(testKey, 'test string')

      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      fireEvent.click(getByTestId('count-increase'))
      await waitFor(() =>
        expect(getByTestId('count-value').innerHTML).toBe('1'),
      )

      expect(getStateValue()).toStrictEqual({
        [getAtomKey('count')]: 1,
      })
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
      await waitFor(() =>
        expect(getByTestId('count-value').innerHTML).toBe('1'),
      )
      expect(mock).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    it('should handle non-existent atom name stored in storage', async () => {
      storage.setItem(
        testKey,
        JSON.stringify({
          notExist: 'test value',
        }),
      )

      const { getByTestId } = render(
        <RecoilRoot>
          <Demo />
        </RecoilRoot>,
      )

      await waitFor(() =>
        expect(getByTestId('count-value').innerHTML).toBe('0'),
      )
    })
  })
}
