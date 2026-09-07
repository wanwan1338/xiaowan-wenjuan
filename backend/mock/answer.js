const { createAnswer, getPublishedQuestion } = require("./store");

module.exports = [
  {
    // C 端可用：读取已发布问卷，不需要登录。
    url: "/api/public/question/:id",
    method: "get",
    response(ctx) {
      const question = getPublishedQuestion(ctx.params.id);
      if (!question) return { errno: 404, msg: "问卷不存在或尚未发布" };
      return { errno: 0, data: question };
    },
  },
  {
    // 请求格式：{ questionId, answers: { [componentId]: value } }
    url: "/api/answer",
    method: "post",
    response(ctx) {
      const { questionId, answers, ...values } = ctx.request.body || {};
      const answer = createAnswer(questionId, answers || values);
      if (!answer) return { errno: 404, msg: "问卷不存在或尚未发布" };
      return { errno: 0, data: { id: answer._id } };
    },
  },
];
