import React, { FC } from 'react'
import useGetComponentInfo from '../../../hooks/useGetComponentInfo'
import { getComponentConfByType } from '../../../components/QuestionComponents'
import styles from './ComponentList.module.scss'

const ComponentList: FC = () => {
  const { componentList } = useGetComponentInfo()

  return (
    <div className={styles.previewArea}>
      <div className={styles.paper}>
        {componentList
          .filter(component => !component.isHidden)
          .map(component => {
            const componentConf = getComponentConfByType(component.type)
            if (!componentConf) return null
            const { Component } = componentConf

            return (
              <div className={styles.component} key={component.fe_id}>
                <Component {...component.props} disabled />
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default ComponentList
