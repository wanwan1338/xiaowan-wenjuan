import React, { FC, Suspense } from 'react'
import { Spin } from 'antd'
import { Outlet } from 'react-router-dom'
import useLoadUserData from '../hooks/useLoadUserData'
import useNavPage from '../hooks/useNavPage'

const QuestionLayout: FC = () => {
  // 加载用户信息
  const { waitingUserData } = useLoadUserData()
  // 用户没有登录时，跳转到登录页
  useNavPage(waitingUserData)

  return (
    <div style={{ height: '100vh' }}>
      {waitingUserData ? (
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <Spin />
        </div>
      ) : (
        <Suspense
          fallback={
            <div style={{ textAlign: 'center', paddingTop: '60px' }}>
              <Spin />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      )}
    </div>
  )
}

export default QuestionLayout
