const { getComponentStat, getCurrentUser, listAnswers } = require("./store");

module.exports = [
  {
    url: "/api/stat/:questionId",
    method: "get",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return { errno: 401, msg: "请先登录" };
      const result = listAnswers(ctx.params.questionId, user.id, ctx.query);
      if (!result) return { errno: 404, msg: "问卷不存在或无权访问" };
      return { errno: 0, data: result };
    },
  },
  {
    url: "/api/stat/:questionId/:componentId",
    method: "get",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return { errno: 401, msg: "请先登录" };
      const stat = getComponentStat(
        ctx.params.questionId,
        ctx.params.componentId,
        user.id
      );
      if (!stat) return { errno: 404, msg: "问卷或组件不存在" };
      return { errno: 0, data: { stat } };
    },
  },
];
