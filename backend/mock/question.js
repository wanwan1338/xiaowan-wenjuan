const {
  createQuestion,
  deleteQuestions,
  duplicateQuestion,
  getCurrentUser,
  getQuestion,
  listQuestions,
  updateQuestion,
} = require("./store");

function unauthorized() {
  return { errno: 401, msg: "请先登录" };
}

module.exports = [
  {
    url: "/api/question/:id",
    method: "get",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      const question = getQuestion(ctx.params.id, user.id);
      if (!question) return { errno: 404, msg: "问卷不存在或无权访问" };
      return { errno: 0, data: question };
    },
  },
  {
    url: "/api/question",
    method: "post",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      const question = createQuestion(user.id);
      return { errno: 0, data: { id: question._id } };
    },
  },
  {
    url: "/api/question",
    method: "get",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      return { errno: 0, data: listQuestions(user.id, ctx.query) };
    },
  },
  {
    url: "/api/question/:id",
    method: "patch",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      const question = updateQuestion(
        ctx.params.id,
        user.id,
        ctx.request.body || {}
      );
      if (!question) return { errno: 404, msg: "问卷不存在或无权访问" };
      return { errno: 0, data: { id: question._id } };
    },
  },
  {
    url: "/api/question/duplicate/:id",
    method: "post",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      const question = duplicateQuestion(ctx.params.id, user.id);
      if (!question) return { errno: 404, msg: "问卷不存在或无权访问" };
      return { errno: 0, data: { id: question._id } };
    },
  },
  {
    url: "/api/question",
    method: "delete",
    response(ctx) {
      const user = getCurrentUser(ctx);
      if (!user) return unauthorized();
      const { ids = [] } = ctx.request.body || {};
      return { errno: 0, data: { count: deleteQuestions(ids, user.id) } };
    },
  },
];
