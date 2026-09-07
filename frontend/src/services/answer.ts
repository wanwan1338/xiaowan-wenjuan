import axios, { ResDataType } from './ajax'

export async function getPublishedQuestionService(id: string): Promise<ResDataType> {
  const data = (await axios.get(`/api/public/question/${id}`)) as ResDataType
  return data
}

export async function submitAnswerService(
  questionId: string,
  answers: Record<string, unknown>
): Promise<ResDataType> {
  const data = (await axios.post('/api/answer', { questionId, answers })) as ResDataType
  return data
}
