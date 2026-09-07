import React, { FC, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Typography, Space, Form, Input, Button, Checkbox, message } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { useDispatch } from 'react-redux'
import { REGISTER_PATHNAME, MANAGE_INDEX_PATHNAME } from '../router'
import { loginService } from '../services/user'
import { setToken } from '../utils/user-token'
import { loginReducer } from '../store/userReducer'
import styles from './Login.module.scss'

const { Title } = Typography

const USERNAME_KEY = 'USERNAME'
const LEGACY_PASSWORD_KEY = 'PASSWORD'

type LoginResultType = {
  token: string
  username: string
}

type LoginFormValues = {
  username: string
  password: string
  remember?: boolean
}

function rememberUser(username: string) {
  localStorage.setItem(USERNAME_KEY, username)
}

function deleteUserFromStorage() {
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(LEGACY_PASSWORD_KEY)
}

function getUserInfoFromStorage() {
  return {
    username: localStorage.getItem(USERNAME_KEY),
  }
}

const Login: FC = () => {
  const nav = useNavigate()
  const dispatch = useDispatch()

  const [form] = Form.useForm() // 第三方 hook

  useEffect(() => {
    // 清理由旧版“记住我”功能留下的明文密码。
    localStorage.removeItem(LEGACY_PASSWORD_KEY)
    const { username } = getUserInfoFromStorage()
    form.setFieldsValue({ username })
  }, [])

  const { run, loading } = useRequest<LoginResultType, [string, string]>(
    async (username: string, password: string) => {
      const data = await loginService(username, password)
      return {
        token: data.token || '',
        username,
      }
    },
    {
      manual: true,
      onSuccess(result) {
        const { token = '', username = '' } = result
        setToken(token) // 存储 token
        dispatch(loginReducer({ username, nickname: username }))

        message.success('登录成功')
        nav(MANAGE_INDEX_PATHNAME) // 导航到“我的问卷”
      },
    }
  )

  const onFinish = (values: LoginFormValues) => {
    const { username, password, remember } = values

    run(username, password) // 执行 ajax

    if (remember) {
      rememberUser(username)
    } else {
      deleteUserFromStorage()
    }
  }

  return (
    <div className={styles.container}>
      <div>
        <Space>
          <Title level={2}>
            <UserAddOutlined />
          </Title>
          <Title level={2}>用户登录</Title>
        </Space>
      </div>
      <div>
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { type: 'string', min: 5, max: 20, message: '字符长度在 5-20 之间' },
              { pattern: /^\w+$/, message: '只能是字母数字下划线' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { type: 'string', min: 6, message: '密码至少需要 6 位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 6, span: 16 }}>
            <Checkbox>记住用户名</Checkbox>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                登录
              </Button>
              <Link to={REGISTER_PATHNAME}>注册新用户</Link>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
