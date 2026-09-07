# 小碗问卷

小碗问卷是一个基于 React 18、TypeScript 和 Koa 的低代码问卷项目，包含可视化编辑、问卷发布、公开填写、答卷管理和图表统计等功能。

## 项目结构

```text
wenjuan/
├── frontend/    React 前端
└── backend/     Koa 轻量后端
```

## 本地运行

先启动后端：

```bash
cd backend
npm install
npm run dev
```

再启动前端：

```bash
cd frontend
npm install
npm start
```

- 前端：http://localhost:8000
- API：http://localhost:3001
- 演示用户名：`demo_user`
- 演示密码：`123456`

更多配置和功能说明见 [前端文档](./frontend/README.md) 与 [后端文档](./backend/README.md)。
