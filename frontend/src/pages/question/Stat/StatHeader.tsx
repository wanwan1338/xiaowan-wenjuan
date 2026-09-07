import React, { FC, useRef, useMemo } from 'react'
import { Button, Typography, Input, Tooltip, message, Popover } from 'antd'
import type { InputRef } from 'antd'
import { LeftOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode.react'
import useGetPageInfo from '../../../hooks/useGetPageInfo'
import styles from './StatHeader.module.scss'

const { Title, Text } = Typography

const StatHeader: FC = () => {
  const nav = useNavigate()
  const { id } = useParams()

  const { title, isPublished } = useGetPageInfo()

  // 拷贝链接
  const urlInputRef = useRef<InputRef>(null)
  function copy() {
    const elem = urlInputRef.current
    if (elem == null) return
    elem.select() // 选中 input 的内容
    document.execCommand('copy') // 拷贝选中内容 （富文本编辑器的操作）
    message.success('拷贝成功')
  }

  // 使用 useMemo 1. 依赖项是否经常变化; 2. 缓存的元素是否创建成本较高
  const LinkAndQRCodeElem = useMemo(() => {
    if (!isPublished) return null

    const publicOrigin = (process.env.REACT_APP_PUBLIC_URL || window.location.origin).replace(
      /\/$/,
      ''
    )
    const url = `${publicOrigin}/answer/${id}`

    // 定义二维码组件
    const QRCodeElem = (
      <div style={{ textAlign: 'center' }}>
        <QRCode value={url} size={150} />
      </div>
    )

    return (
      <div className={styles.share}>
        <Text type="secondary">问卷链接</Text>
        <Input value={url} ref={urlInputRef} readOnly />
        <Tooltip title="拷贝链接">
          <Button icon={<CopyOutlined />} onClick={copy}></Button>
        </Tooltip>
        <Popover content={QRCodeElem} trigger="click" placement="bottomRight">
          <Button icon={<QrcodeOutlined />}></Button>
        </Popover>
      </div>
    )
  }, [id, isPublished])

  return (
    <div className={styles['header-wrapper']}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Button type="link" icon={<LeftOutlined />} onClick={() => nav(-1)}>
            返回
          </Button>
          <Title level={4}>{title}</Title>
        </div>
        <div className={styles.actions}>
          {LinkAndQRCodeElem}
          <Button type="primary" onClick={() => nav(`/question/edit/${id}`)}>
            编辑问卷
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StatHeader
