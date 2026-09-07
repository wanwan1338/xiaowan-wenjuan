import React, { FC, useMemo, useState } from 'react'
import { Card, Empty, Spin } from 'antd'
import { useRequest } from 'ahooks'
import { useParams } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import useGetComponentInfo from '../../../hooks/useGetComponentInfo'
import { ComponentInfoType } from '../../../store/componentsReducer'
import { getComponentStatService, getQuestionStatListService } from '../../../services/stat'
import type { AnswerRecord, StatItem } from '../../../services/stat'
import { STAT_COLORS } from '../../../constant'
import { formatAnswerValue } from './statUtils'
import styles from './ChartStat.module.scss'

type ChoiceStatMap = Record<string, StatItem[]>

const ANSWER_COMPONENT_TYPES = new Set([
  'questionInput',
  'questionTextarea',
  'questionRadio',
  'questionCheckbox',
])

function getTitle(component: ComponentInfoType) {
  return component.props.title || component.title
}

function getAnsweredCount(component: ComponentInfoType, answers: AnswerRecord[]) {
  return answers.filter(answer => {
    const value = answer[component.fe_id]
    return Array.isArray(value) ? value.length > 0 : value != null && value !== ''
  }).length
}

type ChoiceCardProps = {
  component: ComponentInfoType
  stat: StatItem[]
  answeredCount: number
}

const ChoiceCard: FC<ChoiceCardProps> = ({ component, stat, answeredCount }) => {
  const showDonut = component.type === 'questionRadio' && stat.length <= 2

  if (showDonut) {
    return (
      <div className={styles.donutLayout}>
        <div className={styles.donut}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stat}
                dataKey="count"
                nameKey="name"
                innerRadius={54}
                outerRadius={82}
                paddingAngle={2}
              >
                {stat.map((_item, index) => (
                  <Cell key={index} fill={STAT_COLORS[index % STAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutTotal}>
            <strong>{answeredCount}</strong>
            <span>份答卷</span>
          </div>
        </div>
        <div className={styles.legend}>
          {stat.map((item, index) => {
            const percent = answeredCount ? Math.round((item.count / answeredCount) * 100) : 0
            return (
              <div className={styles.legendItem} key={item.name}>
                <i style={{ backgroundColor: STAT_COLORS[index % STAT_COLORS.length] }} />
                <span>{item.name}</span>
                <strong>{item.count}</strong>
                <em>{percent}%</em>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bars}>
      {stat.map(item => {
        const percent = answeredCount ? Math.round((item.count / answeredCount) * 100) : 0
        return (
          <div className={styles.barRow} key={item.name}>
            <span className={styles.barLabel}>{item.name}</span>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${percent}%` }} />
            </div>
            <strong>{item.count}</strong>
            <em>{percent}%</em>
          </div>
        )
      })}
    </div>
  )
}

type TextCardProps = {
  component: ComponentInfoType
  answers: AnswerRecord[]
}

const TextCard: FC<TextCardProps> = ({ component, answers }) => {
  const values = answers
    .map(answer => formatAnswerValue(component.type, answer[component.fe_id], component.props))
    .filter(value => value !== '-')

  return values.length ? (
    <div className={styles.textAnswers}>
      {values.slice(0, 8).map((value, index) => (
        <div className={styles.textAnswer} key={`${value}-${index}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <p>{value}</p>
        </div>
      ))}
      {values.length > 8 && <div className={styles.more}>另有 {values.length - 8} 条回答</div>}
    </div>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无回答" />
  )
}

const ChartStat: FC = () => {
  const { id = '' } = useParams()
  const { componentList } = useGetComponentInfo()
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [choiceStats, setChoiceStats] = useState<ChoiceStatMap>({})

  const answerComponents = useMemo(
    () => componentList.filter(c => !c.isHidden && ANSWER_COMPONENT_TYPES.has(c.type)),
    [componentList]
  )
  const choiceComponents = useMemo(
    () => answerComponents.filter(c => c.type === 'questionRadio' || c.type === 'questionCheckbox'),
    [answerComponents]
  )

  const { loading } = useRequest(
    async () => {
      const [answerResult, ...statResults] = await Promise.all([
        getQuestionStatListService(id, { page: 1, pageSize: 10000 }),
        ...choiceComponents.map(component => getComponentStatService(id, component.fe_id)),
      ])
      const nextStats = choiceComponents.reduce<ChoiceStatMap>((result, component, index) => {
        result[component.fe_id] = statResults[index]?.stat || []
        return result
      }, {})
      return { answers: answerResult.list || [], choiceStats: nextStats }
    },
    {
      refreshDeps: [id, choiceComponents],
      ready: Boolean(id && componentList.length),
      onSuccess(result) {
        setAnswers(result.answers)
        setChoiceStats(result.choiceStats)
      },
    }
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    )
  }

  if (!answerComponents.length) return <Empty description="当前问卷没有可统计的问题" />

  return (
    <div className={styles.container}>
      {answerComponents.map((component, index) => {
        const answeredCount = getAnsweredCount(component, answers)
        const isChoice = choiceComponents.some(item => item.fe_id === component.fe_id)

        return (
          <Card className={styles.card} key={component.fe_id} bordered={false}>
            <div className={styles.cardHeader}>
              <h3>
                <span>Q{index + 1}</span>
                {getTitle(component)}
              </h3>
              <div>{answeredCount} 人回答</div>
            </div>
            {isChoice ? (
              <ChoiceCard
                component={component}
                stat={choiceStats[component.fe_id] || []}
                answeredCount={answeredCount}
              />
            ) : (
              <TextCard component={component} answers={answers} />
            )}
          </Card>
        )
      })}
    </div>
  )
}

export default ChartStat
