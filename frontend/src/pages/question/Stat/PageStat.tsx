import React, { FC, useMemo, useState } from 'react'
import { Button, Descriptions, Drawer, Empty, Input, message, Pagination, Spin, Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useRequest } from 'ahooks'
import { useParams } from 'react-router-dom'
import useGetComponentInfo from '../../../hooks/useGetComponentInfo'
import { ComponentInfoType } from '../../../store/componentsReducer'
import { getQuestionStatListService } from '../../../services/stat'
import type { AnswerRecord } from '../../../services/stat'
import { STAT_PAGE_SIZE } from '../../../constant'
import { formatAnswerValue, formatDateTime } from './statUtils'
import styles from './PageStat.module.scss'

type AnswerGroup = {
  title: string
  components: ComponentInfoType[]
}

const ANSWER_COMPONENT_TYPES = new Set([
  'questionInput',
  'questionTextarea',
  'questionRadio',
  'questionCheckbox',
])

function getComponentTitle(component: ComponentInfoType) {
  return component.props.title || component.title
}

function getAnswerGroups(componentList: ComponentInfoType[]) {
  const groups: AnswerGroup[] = []
  let currentGroup: AnswerGroup = { title: '基本信息', components: [] }

  componentList
    .filter(component => !component.isHidden)
    .forEach(component => {
      if (component.type === 'questionTitle') {
        if (currentGroup.components.length) groups.push(currentGroup)
        currentGroup = { title: component.props.text || component.title, components: [] }
        return
      }
      if (ANSWER_COMPONENT_TYPES.has(component.type)) currentGroup.components.push(component)
    })
  if (currentGroup.components.length) groups.push(currentGroup)
  return groups
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

const PageStat: FC = () => {
  const { id = '' } = useParams()
  const { componentList } = useGetComponentInfo()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(STAT_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [total, setTotal] = useState(0)
  const [list, setList] = useState<AnswerRecord[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerRecord | null>(null)

  const answerComponents = useMemo(
    () => componentList.filter(c => !c.isHidden && ANSWER_COMPONENT_TYPES.has(c.type)),
    [componentList]
  )
  const answerGroups = useMemo(() => getAnswerGroups(componentList), [componentList])
  const coreComponents = useMemo(
    () => answerComponents.filter(c => c.type !== 'questionTextarea').slice(0, 4),
    [answerComponents]
  )

  const { loading } = useRequest(
    () => getQuestionStatListService(id, { page, pageSize, keyword: keyword || undefined }),
    {
      refreshDeps: [id, page, pageSize, keyword],
      onSuccess(res) {
        setTotal(res.total || 0)
        setList(res.list || [])
      },
    }
  )

  const columns: ColumnsType<AnswerRecord> = [
    {
      title: '编号',
      key: 'number',
      width: 88,
      render: (_value, _record, index) =>
        String((page - 1) * pageSize + index + 1).padStart(3, '0'),
    },
    ...coreComponents.map(component => ({
      title: getComponentTitle(component),
      dataIndex: component.fe_id,
      key: component.fe_id,
      width: 180,
      ellipsis: true,
      render: (value: unknown) => formatAnswerValue(component.type, value, component.props),
    })),
    {
      title: '提交时间',
      dataIndex: '_createdAt',
      key: '_createdAt',
      width: 168,
      render: (value: unknown) => formatDateTime(typeof value === 'string' ? value : null),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_value, record) => (
        <Button type="link" onClick={() => setSelectedAnswer(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  async function exportAnswers() {
    const res = await getQuestionStatListService(id, {
      page: 1,
      pageSize: 10000,
      keyword: keyword || undefined,
    })
    const rows: AnswerRecord[] = res.list || []
    const headers = ['答卷编号', '提交时间', ...answerComponents.map(getComponentTitle)]
    const body = rows.map((record, index) => [
      String(index + 1).padStart(3, '0'),
      formatDateTime(record._createdAt),
      ...answerComponents.map(component =>
        formatAnswerValue(component.type, record[component.fe_id], component.props)
      ),
    ])
    const csv = [headers, ...body].map(row => row.map(escapeCsv).join(',')).join('\r\n')
    downloadCsv(`问卷答卷-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    message.success(`已导出 ${rows.length} 份答卷`)
  }

  const selectedIndex = selectedAnswer
    ? list.findIndex(item => item._id === selectedAnswer._id)
    : -1

  return (
    <div>
      <div className={styles.toolbar}>
        <div>
          <strong className={styles.heading}>答卷数据</strong>
          <span className={styles.total}>共 {total} 份</span>
        </div>
        <div className={styles.actions}>
          <Input.Search
            allowClear
            placeholder="搜索答卷内容"
            onSearch={value => {
              setPage(1)
              setKeyword(value.trim())
            }}
          />
          <Button icon={<DownloadOutlined />} disabled={!total} onClick={exportAnswers}>
            导出 Excel
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {list.length ? (
          <Table
            columns={columns}
            dataSource={list.map(item => ({ ...item, key: item._id }))}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Empty description={keyword ? '没有找到匹配的答卷' : '暂时还没有答卷'} />
        )}
      </Spin>

      {total > 0 && (
        <div className={styles.pagination}>
          <Pagination
            total={total}
            pageSize={pageSize}
            current={page}
            showSizeChanger
            showTotal={value => `共 ${value} 份`}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPageSize !== pageSize ? 1 : nextPage)
              setPageSize(nextPageSize)
            }}
          />
        </div>
      )}

      <Drawer
        title="答卷详情"
        width={560}
        open={Boolean(selectedAnswer)}
        onClose={() => setSelectedAnswer(null)}
      >
        {selectedAnswer && (
          <>
            <div className={styles.meta}>
              <span>
                答卷编号：#
                {String((page - 1) * pageSize + selectedIndex + 1).padStart(3, '0')}
              </span>
              <span>提交时间：{formatDateTime(selectedAnswer._createdAt)}</span>
            </div>
            {answerGroups.map(group => (
              <section className={styles.detailGroup} key={group.title}>
                <h4>{group.title}</h4>
                <Descriptions column={1} layout="vertical" colon={false} size="small">
                  {group.components.map(component => (
                    <Descriptions.Item key={component.fe_id} label={getComponentTitle(component)}>
                      {formatAnswerValue(
                        component.type,
                        selectedAnswer[component.fe_id],
                        component.props
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </section>
            ))}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default PageStat
