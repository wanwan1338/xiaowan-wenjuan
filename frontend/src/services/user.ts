import axios, { ResDataType } from './ajax'

export type UserInfoData = {
  username: string
  nickname: string
}

type LoginData = {
  token: string
}

// 获取用户信息
export async function getUserInfoService(): Promise<UserInfoData> {
  const url = '/api/user/info'
  const data = await axios.get<UserInfoData>(url)
  return data
}

// 注册用户
export async function registerService(username: string, password: string): Promise<ResDataType> {
  const url = '/api/user/register'
  const body = { username, password }
  const data = await axios.post<ResDataType>(url, body)
  return data
}

// 登录
export async function loginService(username: string, password: string): Promise<LoginData> {
  const url = '/api/user/login'
  const body = { username, password }
  const data = await axios.post<LoginData>(url, body)
  return data
}
