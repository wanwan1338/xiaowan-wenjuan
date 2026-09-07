import axios, { ResDataType } from './ajax'
import type { QuestionCardPropsType } from '../components/QuestionCard'
import type { ComponentInfoType } from '../store/componentsReducer'

type SearchOption = {
  keyword: string
  isStar: boolean
  isDeleted: boolean
  page: number
  pageSize: number
}

export type QuestionDataType = {
  _id?: string
  title: string
  desc?: string
  js?: string
  css?: string
  isPublished?: boolean
  componentList: ComponentInfoType[]
}

export type QuestionListDataType = {
  list: QuestionCardPropsType[]
  total: number
}

type QuestionMutationResult = {
  id: string
}

// 获取单个问卷信息
export async function getQuestionService(id: string): Promise<QuestionDataType> {
  const url = `/api/question/${id}`
  const data = await axios.get<QuestionDataType>(url)
  return data
}

// 创建问卷
export async function createQuestionService(): Promise<QuestionMutationResult> {
  const url = '/api/question'
  const data = await axios.post<QuestionMutationResult>(url)
  return data
}

// 获取（查询）问卷列表
export async function getQuestionListService(
  opt: Partial<SearchOption> = {}
): Promise<QuestionListDataType> {
  const url = '/api/question'
  const data = await axios.get<QuestionListDataType>(url, { params: opt, timeout: 5 * 1000 })
  return data
}

// 更新单个问卷
export async function updateQuestionService(
  id: string,
  opt: Record<string, unknown>
): Promise<ResDataType> {
  const url = `/api/question/${id}`
  const data = await axios.patch<ResDataType>(url, opt)
  return data
}

// 复制问卷
export async function duplicateQuestionService(id: string): Promise<QuestionMutationResult> {
  const url = `/api/question/duplicate/${id}`
  const data = await axios.post<QuestionMutationResult>(url)
  return data
}

// 批量彻底删除
export async function deleteQuestionsService(ids: string[]): Promise<ResDataType> {
  const url = '/api/question'
  const data = await axios.delete<ResDataType>(url, { data: { ids } })
  return data
}
