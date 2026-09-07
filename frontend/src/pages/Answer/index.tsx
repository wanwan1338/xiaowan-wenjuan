import React, { FC } from 'react'
import { Button, Card, Checkbox, Empty, Form, Input, Radio, Result, Spin, Typography } from 'antd'
import { useRequest, useTitle } from 'ahooks'
import { useParams } from 'react-router-dom'
import { getComponentConfByType } from '../../components/QuestionComponents'
import type { ComponentInfoType } from '../../store/componentsReducer'
import { getPublishedQuestionService, submitAnswerService } from '../../services/answer'
import styles from './index.module.scss'

const { Title, Paragraph } = Typography
const { TextArea } = Input

type QuestionDataType = {
  _id: string
  title: string
  desc?: string
  componentList: ComponentInfoType[]
}

const Answer: FC = () => {
  const { id = '' } = useParams()
  const [form] = Form.useForm()

  const { data, loading, error } = useRequest(async () => {
    if (!id) throw new Error('缺少问卷 ID')
    return (await getPublishedQuestionService(id)) as QuestionDataType
  })
  const question = data as QuestionDataType | undefined
  useTitle(question ? `填写问卷 - ${question.title}` : '填写问卷')

  const {
    loading: submitting,
    run: submit,
    data: submitResult,
  } = useRequest(
    async (answers: Record<string, unknown>) => {
      if (!id) throw new Error('缺少问卷 ID')
      return await submitAnswerService(id, answers)
    },
    { manual: true }
  )

  if (loading) {
    return (
      <div className={styles.center}>
        <Spin size="large" tip="正在加载问卷..." />
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className={styles.center}>
        <Result
          status="warning"
          title="问卷无法访问"
          subTitle="问卷可能不存在、尚未发布或已被删除。"
        />
      </div>
    )
  }

  if (submitResult) {
    return (
      <div className={styles.center}>
        <Result status="success" title="提交成功" subTitle="感谢你的参与，答卷已经成功保存。" />
      </div>
    )
  }

  const visibleComponents = (question.componentList || []).filter(component => !component.isHidden)
  const hasQuestionInfo = visibleComponents.some(component => component.type === 'questionInfo')

  function getOptionGroupClassName(isVertical?: boolean) {
    return `${styles.optionGroup} ${isVertical ? styles.verticalOptions : styles.horizontalOptions}`
  }

  function renderComponent(component: ComponentInfoType) {
    const { fe_id, type, title, props: componentProps = {} } = component

    if (type === 'questionInput') {
      return (
        <Form.Item
          className={styles.questionItem}
          key={fe_id}
          name={fe_id}
          label={componentProps.title || title}
        >
          <Input placeholder={componentProps.placeholder} />
        </Form.Item>
      )
    }

    if (type === 'questionTextarea') {
      return (
        <Form.Item
          className={styles.questionItem}
          key={fe_id}
          name={fe_id}
          label={componentProps.title || title}
        >
          <TextArea rows={4} placeholder={componentProps.placeholder} />
        </Form.Item>
      )
    }

    if (type === 'questionRadio') {
      return (
        <Form.Item
          className={styles.questionItem}
          key={fe_id}
          name={fe_id}
          label={componentProps.title || title}
        >
          <Radio.Group className={getOptionGroupClassName(componentProps.isVertical)}>
            {(componentProps.options || []).map(option => (
              <Radio className={styles.option} key={option.value} value={option.value}>
                {option.text}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      )
    }

    if (type === 'questionCheckbox') {
      return (
        <Form.Item
          className={styles.questionItem}
          key={fe_id}
          name={fe_id}
          label={componentProps.title || title}
        >
          <Checkbox.Group className={getOptionGroupClassName(componentProps.isVertical)}>
            {(componentProps.list || []).map(option => (
              <Checkbox className={styles.option} key={option.value} value={option.value}>
                {option.text}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      )
    }

    const componentConf = getComponentConfByType(type)
    if (!componentConf) return null
    const { Component } = componentConf
    return (
      <div key={fe_id} className={styles.staticComponent}>
        <Component {...componentProps} />
      </div>
    )
  }

  return (
    <main className={styles.page}>
      <Card className={styles.card} bordered={false}>
        {!hasQuestionInfo && (
          <header className={styles.header}>
            <Title level={2}>{question.title}</Title>
            {question.desc && <Paragraph type="secondary">{question.desc}</Paragraph>}
          </header>
        )}

        {visibleComponents.length === 0 ? (
          <Empty description="该问卷暂无题目" />
        ) : (
          <Form
            className={styles.form}
            form={form}
            layout="vertical"
            onFinish={values => submit(values)}
          >
            {visibleComponents.map(renderComponent)}
            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
              提交答卷
            </Button>
          </Form>
        )}
      </Card>
    </main>
  )
}

export default Answer
