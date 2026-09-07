# Wenjuan API

这是问卷项目的轻量 Koa 后端。它使用本地 JSON 文件持久化数据，不依赖外部数据库，适合前端作品集演示。

## 启动

```bash
npm install
npm run dev
```

服务默认运行在 `http://localhost:3001`，数据首次请求时写入 `data/db.json`。
接口默认只模拟 `80ms` 网络延迟；需要调整时可设置 `MOCK_DELAY_MS`，设为 `0` 可关闭延迟。

部署为独立 API 域名时，可以设置允许访问的前端来源：

```bash
CORS_ORIGIN=https://survey.example.com
PORT=3001
```

内置演示账号：

- 用户名：`demo_user`
- 密码：`123456`

## 已实现能力

- 注册、登录、token 与用户身份关联
- 密码 PBKDF2 加盐哈希
- 用户问卷数据隔离
- 问卷创建、编辑、发布、复制、收藏、回收站和彻底删除
- 公开读取已发布问卷、提交答卷、分页统计和选项汇总
- JSON 文件原子写入，重启服务后数据仍然存在

## 测试

```bash
npm test
```

测试使用系统临时目录，不会污染开发数据。
