import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Result, Spin, Tabs } from 'antd'
import { useTitle } from 'ahooks'
import useLoadQuestionData from '../../../hooks/useLoadQuestionData'
import useGetPageInfo from '../../../hooks/useGetPageInfo'
import StatHeader from './StatHeader'
import StatOverview from './StatOverview'
import ComponentList from './ComponentList'
import PageStat from './PageStat'
import ChartStat from './ChartStat'
import styles from './index.module.scss'

const Stat: FC = () => {
  const nav = useNavigate()
  const { loading } = useLoadQuestionData()
  const { title, isPublished } = useGetPageInfo()

  useTitle(`问卷统计 - ${title}`)

  function genContentElem() {
    if (typeof isPublished === 'boolean' && !isPublished) {
      return (
        <Result
          status="warning"
          title="该问卷尚未发布"
          extra={
            <Button type="primary" onClick={() => nav(-1)}>
              返回
            </Button>
          }
        />
      )
    }

    return (
      <main className={styles.content}>
        <StatOverview />
        <section className={styles.workspace}>
          <Tabs
            defaultActiveKey="answers"
            items={[
              { key: 'answers', label: '答卷数据', children: <PageStat /> },
              { key: 'charts', label: '图表统计', children: <ChartStat /> },
              { key: 'question', label: '问卷内容', children: <ComponentList /> },
            ]}
          />
        </section>
      </main>
    )
  }

  return (
    <div className={styles.container}>
      <StatHeader />
      <div className={styles['content-wrapper']}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : (
          genContentElem()
        )}
      </div>
    </div>
  )
}

export default Stat
