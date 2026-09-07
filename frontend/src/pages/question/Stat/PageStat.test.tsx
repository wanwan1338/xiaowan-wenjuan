import { formatAnswerValue, formatDate, formatDateTime } from './statUtils'

const props = {
  options: [
    { value: 'item1', text: '男' },
    { value: 'item2', text: '女' },
  ],
  list: [
    { value: 'item1', text: '步行' },
    { value: 'v-6N8', text: '出租车/网约车' },
    { value: 'kVQIu', text: '地铁/轻轨' },
  ],
}

test('单选答案显示选项文字而不是内部 value', () => {
  expect(formatAnswerValue('questionRadio', 'item2', props)).toBe('女')
})

test('多选答案兼容数组和旧的逗号分隔格式', () => {
  expect(formatAnswerValue('questionCheckbox', ['item1', 'v-6N8'], props)).toBe(
    '步行、出租车/网约车'
  )
  expect(formatAnswerValue('questionCheckbox', 'item1,kVQIu', props)).toBe('步行、地铁/轻轨')
})

test('提交时间使用统一格式展示', () => {
  expect(formatDateTime('2026-09-05T08:32:57.262Z')).toMatch(/^2026-09-05 \d{2}:32$/)
  expect(formatDate('not-a-date')).toBe('-')
  expect(formatDateTime(null)).toBe('-')
})
