import React, { FC, useState } from 'react'
import { Skeleton, Typography } from 'antd'
import { useRequest } from 'ahooks'
import { useParams } from 'react-router-dom'
import useGetComponentInfo from '../../../hooks/useGetComponentInfo'
import useGetPageInfo from '../../../hooks/useGetPageInfo'
import { getQuestionStatListService } from '../../../services/stat'
import { formatDate } from './statUtils'
import styles from './StatOverview.module.scss'

const { Title, Paragraph } = Typography

const StatOverview: FC = () => {
  const { id = '' } = useParams()
  const { title, desc = '' } = useGetPageInfo()
  const { componentList } = useGetComponentInfo()
  const [total, setTotal] = useState(0)
  const [latestSubmittedAt, setLatestSubmittedAt] = useState<string | null>(null)

  const { loading } = useRequest(() => getQuestionStatListService(id, { page: 1, pageSize: 1 }), {
    refreshDeps: [id],
    onSuccess(res) {
      setTotal(res.total || 0)
      setLatestSubmittedAt(res.latestSubmittedAt || null)
    },
  })

  const questionInfo = componentList.find(component => component.type === 'questionInfo')
  const overviewDescription = desc || questionInfo?.props.desc || '暂无问卷说明'

  return (
    <section className={styles.overview}>
      <div className={styles.introduction}>
        <Title level={3}>{title}</Title>
        <Paragraph>{overviewDescription}</Paragraph>
      </div>
      {loading ? (
        <div className={styles.metricsLoading}>
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        </div>
      ) : (
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <strong>{total}</strong>
            <span>答卷数量</span>
          </div>
          <div className={styles.metric}>
            <strong>{total}</strong>
            <span>有效答卷</span>
          </div>
          <div className={styles.metric}>
            <strong className={styles.date}>{formatDate(latestSubmittedAt)}</strong>
            <span>最近回收</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default StatOverview
