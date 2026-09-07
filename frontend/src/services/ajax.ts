import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { getToken } from '../utils/user-token'

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
  timeout: 10 * 1000,
})

// request 拦截：每次请求都带上 token
instance.interceptors.request.use(
  config => {
    config.headers['Authorization'] = `Bearer ${getToken()}` // JWT 的固定格式
    return config
  },
  error => Promise.reject(error)
)

// response 拦截：统一处理 errno 和 msg
instance.interceptors.response.use(res => {
  const resData = (res.data || {}) as ResType<unknown>
  const { errno, data, msg } = resData

  if (errno !== 0) {
    // 错误提示
    if (msg) {
      message.error(msg)
    }

    throw new Error(msg)
  }

  return data as unknown as AxiosResponse
})

export type ResType<T = unknown> = {
  errno: number
  data?: T
  msg?: string
}

export type ResDataType = Record<string, unknown>

const ajax = {
  get<T = ResDataType>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<ResType<T>, T>(url, config)
  },
  post<T = ResDataType>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<ResType<T>, T, unknown>(url, data, config)
  },
  patch<T = ResDataType>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.patch<ResType<T>, T, unknown>(url, data, config)
  },
  delete<T = ResDataType>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<ResType<T>, T>(url, config)
  },
}

export default ajax
