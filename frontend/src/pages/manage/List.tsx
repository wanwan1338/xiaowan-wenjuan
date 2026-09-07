import React, { FC, useEffect, useState, useRef, useMemo } from 'react'
import { Typography, Spin, Empty, Button } from 'antd'
import { useTitle, useDebounceFn, useRequest } from 'ahooks'
import { useSearchParams } from 'react-router-dom'
import { getQuestionListService } from '../../services/question'
import QuestionCard, { QuestionCardPropsType } from '../../components/QuestionCard'
import ListSearch from '../../components/ListSearch'
import useGetUserInfo from '../../hooks/useGetUserInfo'
import { LIST_PAGE_SIZE, LIST_SEARCH_PARAM_KEY } from '../../constant/index'
import styles from './common.module.scss'

const { Title } = Typography

const List: FC = () => {
  useTitle('小碗问卷 - 我的问卷')
  const { username } = useGetUserInfo()

  const [started, setStarted] = useState(false)
  const [page, setPage] = useState(1)
  const [list, setList] = useState<QuestionCardPropsType[]>([])
  const [total, setTotal] = useState(0)
  const haveMoreData = total > list.length

  const [searchParams] = useSearchParams()
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || ''

  const {
    run: loadPage,
    loading,
    error,
  } = useRequest(
    async (requestedPage: number, requestedKeyword: string, requestedUsername: string) => {
      const data = await getQuestionListService({
        page: requestedPage,
        pageSize: LIST_PAGE_SIZE,
        keyword: requestedKeyword,
      })
      return { data, requestedPage, requestedKeyword, requestedUsername }
    },
    {
      manual: true,
      retryCount: 1,
      retryInterval: 300,
      onSuccess(result) {
        const { data, requestedPage, requestedKeyword, requestedUsername } = result
        // 搜索词或登录用户已变化时，丢弃旧请求，避免旧数据覆盖新页面。
        if (requestedKeyword !== keyword || requestedUsername !== username) return

        const { list: rawList = [], total = 0 } = data
        const nextList = rawList as QuestionCardPropsType[]
        setList(currentList => (requestedPage === 1 ? nextList : currentList.concat(nextList)))
        setTotal(total)
        setPage(requestedPage + 1)
      },
      onError() {
        // 请求错误由页面状态展示，避免把失败误判为暂无数据。
      },
    }
  )

  // 用户或搜索词就绪后立即请求第一页。0ms 定时器可消除 StrictMode 的重复请求，且无可感知延迟。
  useEffect(() => {
    setStarted(false)
    setPage(1)
    setList([])
    setTotal(0)

    if (!username) return
    setStarted(true)
    const timer = window.setTimeout(() => {
      loadPage(1, keyword, username)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [keyword, username])

  // 页面滚动时才使用防抖和位置判断，加载后续分页。
  const containerRef = useRef<HTMLDivElement>(null)
  const { run: tryLoadMore } = useDebounceFn(
    () => {
      if (!username || loading || !started || !haveMoreData) return
      const elem = containerRef.current
      if (elem == null) return
      const { bottom } = elem.getBoundingClientRect()
      if (bottom <= document.body.clientHeight) {
        loadPage(page, keyword, username)
      }
    },
    {
      wait: 150,
      leading: true,
      trailing: false,
    }
  )

  useEffect(() => {
    if (haveMoreData) {
      window.addEventListener('scroll', tryLoadMore)
    }

    return () => {
      window.removeEventListener('scroll', tryLoadMore)
    }
  }, [searchParams, haveMoreData])

  const LoadMoreContentElem = useMemo(() => {
    if (!username || !started || loading) return <Spin />
    if (error) {
      const retryPage = list.length === 0 ? 1 : page
      return (
        <Empty description="加载失败，请稍后重试">
          <Button type="primary" onClick={() => loadPage(retryPage, keyword, username)}>
            重新加载
          </Button>
        </Empty>
      )
    }
    if (total === 0) return <Empty description="暂无数据" />
    if (!haveMoreData) return <span>没有更多了...</span>
    return <span>滚动加载下一页</span>
  }, [username, started, loading, error, total, haveMoreData, list.length, page, keyword, loadPage])

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3}>我的问卷</Title>
        </div>
        <div className={styles.right}>
          <ListSearch />
        </div>
      </div>
      <div className={styles.content}>
        {list.map(q => {
          const { _id } = q
          return <QuestionCard key={_id} {...q} />
        })}
      </div>
      <div className={styles.footer}>
        <div ref={containerRef}>{LoadMoreContentElem}</div>
      </div>
    </>
  )
}

export default List
