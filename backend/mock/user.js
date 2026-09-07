const { getCurrentUser, loginUser, registerUser } = require("./store");

module.exports = [
  {
    url: "/api/user/info",
    method: "get",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return { errno: 401, msg: "登录已失效，请重新登录" };
      return { errno: 0, data: user };
    },
  },
  {
    url: "/api/user/register",
    method: "post",
    response(ctx) {
      const result = registerUser(ctx.request.body || {});
      if (result.error) return { errno: 1001, msg: result.error };
      return { errno: 0, data: result.user };
    },
  },
  {
    url: "/api/user/login",
    method: "post",
    response(ctx) {
      const { username, password } = ctx.request.body || {};
      const result = loginUser(username, password);
      if (result.error) return { errno: 1002, msg: result.error };
      return { errno: 0, data: { token: result.token } };
    },
  },
];
