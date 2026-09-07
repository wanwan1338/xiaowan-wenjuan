import React from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import store from '../../store'
import { loginReducer, logoutReducer } from '../../store/userReducer'
import { getQuestionListService } from '../../services/question'
import List from './List'

jest.mock('../../services/question', () => ({
  getQuestionListService: jest.fn(),
}))

jest.mock(
  '../../components/ListSearch',
  () =>
    function MockListSearch() {
      return null
    }
)
jest.mock(
  '../../components/QuestionCard',
  () =>
    function MockQuestionCard({ title }: { title: string }) {
      return <div>{title}</div>
    }
)

const mockedGetQuestionList = getQuestionListService as jest.MockedFunction<
  typeof getQuestionListService
>

function renderList() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <List />
      </MemoryRouter>
    </Provider>
  )
}

describe('List authentication loading', () => {
  beforeEach(() => {
    store.dispatch(logoutReducer())
    mockedGetQuestionList.mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('waits for the user and loads questions after login state is ready', async () => {
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ bottom: 10000 } as DOMRect)

    mockedGetQuestionList.mockResolvedValue({
      list: [
        {
          _id: 'question-1',
          title: '登录后的问卷',
          isStar: false,
          isPublished: false,
          answerCount: 0,
          createdAt: '2026-09-06',
        },
      ],
      total: 1,
    })

    renderList()
    expect(mockedGetQuestionList).not.toHaveBeenCalled()

    act(() => {
      store.dispatch(loginReducer({ username: 'test_user', nickname: 'test_user' }))
    })

    await waitFor(() => expect(mockedGetQuestionList).toHaveBeenCalledTimes(1))
    expect(mockedGetQuestionList).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      keyword: '',
    })
    expect(await screen.findByText('登录后的问卷')).toBeInTheDocument()
  })

  test('shows a load error instead of an empty-list message when the request fails', async () => {
    mockedGetQuestionList.mockRejectedValue(new Error('unauthorized'))
    store.dispatch(loginReducer({ username: 'test_user', nickname: 'test_user' }))

    renderList()

    expect(await screen.findByText('加载失败，请稍后重试')).toBeInTheDocument()
    expect(screen.queryByText('暂无数据')).not.toBeInTheDocument()
    await waitFor(() => expect(mockedGetQuestionList).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    })

    mockedGetQuestionList.mockResolvedValueOnce({
      list: [
        {
          _id: 'question-2',
          title: '重新加载后的问卷',
          isStar: false,
          isPublished: false,
          answerCount: 0,
          createdAt: '2026-09-06',
        },
      ],
      total: 1,
    })

    fireEvent.click(screen.getByRole('button', { name: '重新加载' }))
    expect(await screen.findByText('重新加载后的问卷')).toBeInTheDocument()
  })
})
