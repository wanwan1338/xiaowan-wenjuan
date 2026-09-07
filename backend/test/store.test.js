const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wenjuan-store-"));
process.env.WENJUAN_DATA_DIR = dataDirectory;

const store = require("../mock/store");

after(() => fs.rmSync(dataDirectory, { recursive: true, force: true }));

test("keeps login identity and isolates persisted questions by user", () => {
  assert.ok(
    store.registerUser({
      username: "alice_user",
      password: "secret123",
      nickname: "Alice",
    }).user
  );
  assert.ok(
    store.registerUser({
      username: "bob_user",
      password: "secret123",
      nickname: "Bob",
    }).user
  );
  const userWithoutNickname = store.registerUser({
    username: "plain_user",
    password: "secret123",
  }).user;
  assert.equal(userWithoutNickname.nickname, "plain_user");

  const aliceLogin = store.loginUser("alice_user", "secret123");
  const bobLogin = store.loginUser("bob_user", "secret123");
  const aliceContext = { get: () => `Bearer ${aliceLogin.token}` };
  const bobContext = { get: () => `Bearer ${bobLogin.token}` };
  const alice = store.getCurrentUser(aliceContext);
  const bob = store.getCurrentUser(bobContext);

  assert.equal(alice.username, "alice_user");
  assert.equal(bob.username, "bob_user");

  const question = store.createQuestion(alice.id);
  store.updateQuestion(question._id, alice.id, {
    title: "React 状态管理调查",
    isPublished: true,
    isStar: true,
  });

  assert.equal(
    store.getQuestion(question._id, alice.id).title,
    "React 状态管理调查"
  );
  assert.equal(store.getQuestion(question._id, bob.id), null);
  const publicQuestion = store.getPublishedQuestion(question._id);
  assert.equal(publicQuestion.title, "React 状态管理调查");
  assert.equal(publicQuestion.ownerId, undefined);
  assert.equal(store.listQuestions(alice.id).total, 1);
  assert.equal(store.listQuestions(alice.id, { isStar: true }).total, 1);
  assert.equal(store.listQuestions(bob.id).total, 0);
});

test("persists answers, aggregates options and deletes owned data", () => {
  const alice = store.loginUser("alice_user", "secret123").user;
  const question = store.listQuestions(alice.id).list[0];

  const answer = store.createAnswer(question._id, {
    c3: "张三",
    c7: "item1",
    c8: ["item1", "item2"],
  });
  assert.ok(answer);
  const answerList = store.listAnswers(question._id, alice.id);
  assert.equal(answerList.total, 1);
  assert.equal(answerList.list[0]._createdAt, answer.createdAt);
  assert.equal(answerList.latestSubmittedAt, answer.createdAt);
  assert.equal(
    store.listAnswers(question._id, alice.id, { keyword: "张三" }).total,
    1
  );
  assert.equal(
    store.listAnswers(question._id, alice.id, { keyword: "不存在" }).total,
    0
  );

  const radioStat = store.getComponentStat(question._id, "c7", alice.id);
  assert.equal(radioStat.find((item) => item.name === "选项1").count, 1);

  const copy = store.duplicateQuestion(question._id, alice.id);
  assert.equal(copy.isPublished, false);
  assert.equal(store.listQuestions(alice.id).total, 2);

  assert.equal(store.deleteQuestions([question._id], alice.id), 1);
  assert.equal(store.getQuestion(question._id, alice.id), null);
});
