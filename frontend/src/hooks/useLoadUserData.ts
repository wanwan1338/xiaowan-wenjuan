import { useEffect, useState } from 'react'
import { useRequest } from 'ahooks'
import { useDispatch } from 'react-redux'
import useGetUserInfo from './useGetUserInfo'
import { getUserInfoService } from '../services/user'
import { loginReducer } from '../store/userReducer'
import { getToken } from '../utils/user-token'

function useLoadUserData() {
  const dispatch = useDispatch()
  const { username } = useGetUserInfo()
  // Redux 已经有用户信息或本地没有 token 时，无需先渲染一帧全屏 Loading。
  const [waitingUserData, setWaitingUserData] = useState(() => Boolean(getToken() && !username))

  // ajax 加载用户信息
  const { run } = useRequest(getUserInfoService, {
    manual: true,
    onSuccess(result) {
      const { username, nickname } = result
      dispatch(loginReducer({ username, nickname })) // 存储到 redux store
    },
    onFinally() {
      setWaitingUserData(false)
    },
  })

  // 判断当前 redux store 是否已经存在用户信息
  useEffect(() => {
    if (username) {
      setWaitingUserData(false) // 如果 redux store 已经存在用户信息，就不用重新加载了
      return
    }
    if (!getToken()) {
      setWaitingUserData(false)
      return
    }
    run() // 如果 redux store 中没有用户信息，则进行加载
  }, [username])

  return { waitingUserData }
}

export default useLoadUserData
