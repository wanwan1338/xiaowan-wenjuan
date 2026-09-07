import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { useDispatch } from 'react-redux'
import { getQuestionService } from '../services/question'
import { resetComponents } from '../store/componentsReducer'
import { resetPageInfo } from '../store/pageInfoReducer'

function useLoadQuestionData() {
  const { id = '' } = useParams()
  const dispatch = useDispatch()
  const [loadedQuestionId, setLoadedQuestionId] = useState('')

  // ajax 加载
  const {
    data: result,
    loading,
    error,
    run,
  } = useRequest(
    async (questionId: string) => {
      if (!questionId) throw new Error('没有问卷 id')
      const questionData = await getQuestionService(questionId)
      return { questionId, questionData }
    },
    {
      manual: true,
    }
  )

  // 根据获取的 data 设置 redux store
  useEffect(() => {
    if (!result || result.questionId !== id) return

    const {
      title = '',
      desc = '',
      js = '',
      css = '',
      isPublished = false,
      componentList = [],
    } = result.questionData

    // 获取默认的 selectedId
    let selectedId = ''
    if (componentList.length > 0) {
      selectedId = componentList[0].fe_id // 默认选中第一个组件
    }

    // 把 componentList 存储到 Redux store 中
    dispatch(resetComponents({ componentList, selectedId, copiedComponent: null }))

    // 把 pageInfo 存储到 redux store
    dispatch(resetPageInfo({ title, desc, js, css, isPublished }))
    // Redux 数据写入后，才允许页面显示，避免先闪现上一份问卷的数据。
    setLoadedQuestionId(result.questionId)
  }, [dispatch, id, result])

  // 判断 id 变化，执行 ajax 加载问卷数据
  useEffect(() => {
    run(id)
  }, [id])

  return { loading: loading || loadedQuestionId !== id, error }
}

export default useLoadQuestionData
