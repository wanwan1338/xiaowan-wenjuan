import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import store from '../../../store'
import RightPanel from './RightPanel'

test('可以在属性和页面设置之间切换', async () => {
  render(
    <Provider store={store}>
      <RightPanel />
    </Provider>
  )

  expect(await screen.findByText('问卷标题')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: /属性/ }))
  expect(screen.getByText('未选中组件')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('tab', { name: /页面设置/ }))
  expect(screen.getByText('问卷标题')).toBeInTheDocument()
})
