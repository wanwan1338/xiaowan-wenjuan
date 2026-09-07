# 小碗问卷前端

一个基于 React 18 和 TypeScript 的低代码问卷编辑项目，包含可视化编辑、自动保存、发布、列表管理和答卷统计等功能。

## 技术栈

- React 18、TypeScript、React Router 6
- Redux Toolkit、redux-undo
- Ant Design 5
- dnd-kit 拖拽排序
- ahooks、Axios、Recharts
- Jest、Testing Library

## 本地运行

先启动后端：

```bash
cd ../backend
npm install
npm run dev
```

再启动前端：

```bash
cd ../frontend
npm install
npm start
```

- 前端地址：`http://localhost:8000`
- API 地址：`http://localhost:3001`
- 演示账号：`demo_user`
- 演示密码：`123456`

开发服务器会将 `/api` 请求代理到本地 API 服务。首次使用自定义账号时，也可以从注册页创建账号。

## 核心功能

- 注册、登录、登录状态恢复和多用户数据隔离
- 问卷组件添加、配置、排序、复制、隐藏和锁定
- 撤销/重做、快捷键和防抖自动保存
- 问卷发布、复制、收藏、软删除和彻底删除
- 问卷列表搜索、分页/滚动加载
- 答卷表格与单选、多选图表统计
- 路由懒加载、入口预加载及 Suspense 加载边界

## 数据持久化

配套的 `backend` 已升级为有状态的轻量 Koa 后端，数据保存在 `backend/data/db.json`。发布问卷或刷新页面后，用户和问卷不会随机变化。

该存储方案适合作品集、本地演示和面试展示。生产部署时可以在保持 API 契约不变的前提下替换为 MySQL、PostgreSQL 或 MongoDB。

## 分享问卷

发布问卷后，统计页会生成 `/answer/:id` 公开填写链接和二维码。访客不需要登录即可填写，提交的数据会出现在问卷统计页。

本地的 `localhost` 只能由当前电脑访问。要分享给互联网用户，需要部署前端和 API，并在构建前配置：

```bash
REACT_APP_PUBLIC_URL=https://survey.example.com
REACT_APP_API_BASE_URL=https://api.example.com
```

如果前端和 API 由同一个域名反向代理，`REACT_APP_API_BASE_URL` 可以不设置。局域网测试时，应使用当前电脑的局域网 IP 访问前端，例如 `http://192.168.1.10:8000`，生成的分享链接才可被同一网络中的其他设备打开。

## 常用命令

```bash
npm start       # 启动开发服务器（8000）
npm test        # 运行前端测试
npm run build   # 生产构建
npm run lint    # ESLint 检查
```
