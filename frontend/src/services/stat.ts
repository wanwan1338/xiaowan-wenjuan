import axios from './ajax'

export type AnswerRecord = {
  _id: string
  _createdAt?: string
  [componentId: string]: unknown
}

export type StatItem = {
  name: string
  count: number
}

type QuestionStatListData = {
  list: AnswerRecord[]
  total: number
  latestSubmittedAt?: string
}

type ComponentStatData = {
  stat: StatItem[]
}

// 获取问卷的统计列表
export async function getQuestionStatListService(
  questionId: string,
  opt: { page: number; pageSize: number; keyword?: string }
): Promise<QuestionStatListData> {
  const url = `/api/stat/${questionId}`
  const data = await axios.get<QuestionStatListData>(url, { params: opt })
  return data
}

// 获取组件统计数据汇总
export async function getComponentStatService(
  questionId: string,
  componentId: string
): Promise<ComponentStatData> {
  const url = `/api/stat/${questionId}/${componentId}`
  const data = await axios.get<ComponentStatData>(url)
  return data
}
