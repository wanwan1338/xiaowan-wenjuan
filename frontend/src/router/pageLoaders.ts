let editPagePromise: ReturnType<typeof importEditPage> | undefined
let statPagePromise: ReturnType<typeof importStatPage> | undefined

function importEditPage() {
  return import(/* webpackChunkName: "editPage" */ '../pages/question/Edit')
}

function importStatPage() {
  return import(/* webpackChunkName: "statPage" */ '../pages/question/Stat')
}

export function preloadEditPage() {
  editPagePromise ||= importEditPage()
  return editPagePromise
}

export function preloadStatPage() {
  statPagePromise ||= importStatPage()
  return statPagePromise
}
