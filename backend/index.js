const Koa = require("koa");
const Router = require("koa-router");
const mockList = require("./mock/index");

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  ctx.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }
  await next();
});

// axios 默认以 JSON 发送写请求；这里用一个很小的解析器，避免为演示后端增加依赖。
app.use(async (ctx, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(ctx.method)) {
    await next();
    return;
  }

  const chunks = [];
  for await (const chunk of ctx.req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    ctx.request.body = {};
  } else {
    try {
      ctx.request.body = JSON.parse(rawBody);
    } catch (error) {
      ctx.body = { errno: 400, msg: "请求数据不是合法 JSON" };
      return;
    }
  }
  await next();
});

async function getRes(fn, ctx) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn(ctx));
      } catch (error) {
        reject(error);
      }
    }, Number(process.env.MOCK_DELAY_MS || 20));
  });
}

// 注册 mock 路由
mockList.forEach((item) => {
  const { url, method, response } = item;
  router[method](url, async (ctx) => {
    try {
      ctx.body = await getRes(response, ctx);
    } catch (error) {
      console.error(error);
      ctx.body = { errno: 500, msg: "服务器内部错误" };
    }
  });
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Wenjuan API is running at http://localhost:${port}`);
});
