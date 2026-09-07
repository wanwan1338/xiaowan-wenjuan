const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const getComponentList = require("./data/getComponentList");

const DATA_DIR =
  process.env.WENJUAN_DATA_DIR || path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");
}

function createPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { passwordSalt: salt, passwordHash: hashPassword(password, salt) };
}

function createInitialDatabase() {
  const demoId = createId();
  return {
    users: [
      {
        id: demoId,
        username: "demo_user",
        nickname: "演示用户",
        ...createPassword("123456"),
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    questions: [
      {
        _id: createId(),
        ownerId: demoId,
        title: "前端开发者体验调查",
        desc: "用于体验问卷编辑、发布和统计流程",
        js: "",
        css: "",
        isPublished: false,
        isStar: false,
        isDeleted: false,
        answerCount: 0,
        createdAt: new Date().toISOString(),
        componentList: getComponentList(),
      },
    ],
    answers: [],
  };
}

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) writeDatabase(createInitialDatabase());
}

function readDatabase() {
  ensureDatabase();
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  db.users ||= [];
  db.sessions ||= [];
  db.questions ||= [];
  db.answers ||= [];
  return db;
}

function writeDatabase(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tempPath, DB_PATH);
}

function createId() {
  return crypto.randomUUID().replace(/-/g, "");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeUser(user) {
  if (!user) return null;
  return { id: user.id, username: user.username, nickname: user.nickname };
}

function registerUser({ username, password, nickname }) {
  const db = readDatabase();
  const normalizedUsername = String(username || "").trim();
  if (!/^\w{5,20}$/.test(normalizedUsername))
    return { error: "用户名必须是 5-20 位字母、数字或下划线" };
  if (String(password || "").length < 6) return { error: "密码至少需要 6 位" };
  if (
    db.users.some(
      (user) => user.username.toLowerCase() === normalizedUsername.toLowerCase()
    )
  ) {
    return { error: "用户名已存在" };
  }
  const user = {
    id: createId(),
    username: normalizedUsername,
    nickname:
      String(nickname || normalizedUsername).trim() || normalizedUsername,
    ...createPassword(String(password)),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDatabase(db);
  return { user: safeUser(user) };
}

function loginUser(username, password) {
  const db = readDatabase();
  const user = db.users.find(
    (item) =>
      item.username.toLowerCase() ===
      String(username || "")
        .trim()
        .toLowerCase()
  );
  if (!user) return { error: "用户名或密码错误" };
  const actual = Buffer.from(
    hashPassword(String(password || ""), user.passwordSalt),
    "hex"
  );
  const expected = Buffer.from(user.passwordHash, "hex");
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return { error: "用户名或密码错误" };
  }
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions = db.sessions.filter((session) => session.userId !== user.id);
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  writeDatabase(db);
  return { token, user: safeUser(user) };
}

function getCurrentUser(ctx) {
  const db = readDatabase();
  const match = (ctx.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  const session = match && db.sessions.find((item) => item.token === match[1]);
  if (!session) return null;
  return safeUser(db.users.find((user) => user.id === session.userId));
}

function createQuestion(ownerId) {
  const db = readDatabase();
  const question = {
    _id: createId(),
    ownerId,
    title: "未命名问卷",
    desc: "",
    js: "",
    css: "",
    isPublished: false,
    isStar: false,
    isDeleted: false,
    answerCount: 0,
    createdAt: new Date().toISOString(),
    componentList: getComponentList(),
  };
  db.questions.push(question);
  writeDatabase(db);
  return clone(question);
}

function getQuestion(id, ownerId) {
  const question = readDatabase().questions.find(
    (item) => item._id === id && item.ownerId === ownerId
  );
  return question ? clone(question) : null;
}

function getPublishedQuestion(id) {
  const question = readDatabase().questions.find(
    (item) => item._id === id && item.isPublished && !item.isDeleted
  );
  if (!question) return null;
  const { ownerId, isStar, isDeleted, ...publicQuestion } = question;
  return clone(publicQuestion);
}

function listQuestions(ownerId, options = {}) {
  const db = readDatabase();
  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(options.pageSize, 10) || 10, 1),
    100
  );
  const keyword = String(options.keyword || "")
    .trim()
    .toLowerCase();
  const wantDeleted = String(options.isDeleted) === "true";
  const wantStar = String(options.isStar) === "true";
  const filtered = db.questions
    .filter((question) => question.ownerId === ownerId)
    .filter((question) => Boolean(question.isDeleted) === wantDeleted)
    .filter((question) => !wantStar || question.isStar)
    .filter(
      (question) => !keyword || question.title.toLowerCase().includes(keyword)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize).map((question) => ({
    _id: question._id,
    title: question.title,
    isPublished: question.isPublished,
    isStar: question.isStar,
    answerCount: question.answerCount,
    createdAt: question.createdAt,
    isDeleted: question.isDeleted,
  }));
  return { list: clone(list), total: filtered.length };
}

function updateQuestion(id, ownerId, changes = {}) {
  const db = readDatabase();
  const question = db.questions.find(
    (item) => item._id === id && item.ownerId === ownerId
  );
  if (!question) return null;
  const allowedFields = [
    "title",
    "desc",
    "js",
    "css",
    "isPublished",
    "isStar",
    "isDeleted",
    "componentList",
  ];
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(changes, field))
      question[field] = clone(changes[field]);
  });
  writeDatabase(db);
  return clone(question);
}

function duplicateQuestion(id, ownerId) {
  const db = readDatabase();
  const source = db.questions.find(
    (item) => item._id === id && item.ownerId === ownerId
  );
  if (!source) return null;
  const question = {
    ...clone(source),
    _id: createId(),
    title: `${source.title} 副本`,
    isPublished: false,
    isStar: false,
    isDeleted: false,
    answerCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.questions.push(question);
  writeDatabase(db);
  return clone(question);
}

function deleteQuestions(ids, ownerId) {
  const db = readDatabase();
  const idSet = new Set(Array.isArray(ids) ? ids : []);
  const ownedIds = new Set(
    db.questions
      .filter((q) => q.ownerId === ownerId && idSet.has(q._id))
      .map((q) => q._id)
  );
  db.questions = db.questions.filter((question) => !ownedIds.has(question._id));
  db.answers = db.answers.filter((answer) => !ownedIds.has(answer.questionId));
  writeDatabase(db);
  return ownedIds.size;
}

function createAnswer(questionId, values) {
  const db = readDatabase();
  const question = db.questions.find(
    (item) => item._id === questionId && item.isPublished && !item.isDeleted
  );
  if (!question) return null;
  const answer = {
    _id: createId(),
    questionId,
    values: clone(values || {}),
    createdAt: new Date().toISOString(),
  };
  db.answers.push(answer);
  question.answerCount = db.answers.filter(
    (item) => item.questionId === questionId
  ).length;
  writeDatabase(db);
  return clone(answer);
}

function listAnswers(questionId, ownerId, options = {}) {
  const db = readDatabase();
  const question = db.questions.find(
    (item) => item._id === questionId && item.ownerId === ownerId
  );
  if (!question) return null;
  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(options.pageSize, 10) || 10, 1),
    10000
  );
  const keyword = String(options.keyword || "").trim().toLowerCase();
  const questionAnswers = db.answers
    .filter((item) => item.questionId === questionId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const answers = keyword
    ? questionAnswers.filter((answer) =>
        Object.entries(answer.values || {}).some(([componentId, value]) => {
          const component = question.componentList.find(
            (item) => item.fe_id === componentId
          );
          const options =
            component?.type === "questionRadio"
              ? component.props.options || []
              : component?.type === "questionCheckbox"
              ? component.props.list || []
              : [];
          const values = Array.isArray(value) ? value : [value];
          const text = values
            .flatMap((item) => [
              String(item ?? ""),
              options.find((option) => option.value === item)?.text || "",
            ])
            .join(" ");
          return text.toLowerCase().includes(keyword);
        })
      )
    : questionAnswers;
  const start = (page - 1) * pageSize;
  return {
    total: answers.length,
    latestSubmittedAt: questionAnswers[0]?.createdAt || null,
    list: clone(
      answers
        .slice(start, start + pageSize)
        .map((answer) => ({
          ...answer.values,
          _id: answer._id,
          _createdAt: answer.createdAt,
        }))
    ),
  };
}

function getComponentStat(questionId, componentId, ownerId) {
  const db = readDatabase();
  const question = db.questions.find(
    (item) => item._id === questionId && item.ownerId === ownerId
  );
  if (!question) return null;
  const component = question.componentList.find(
    (item) => item.fe_id === componentId
  );
  if (!component) return [];
  const answers = db.answers.filter((item) => item.questionId === questionId);
  let options = [];
  if (component.type === "questionRadio")
    options = component.props.options || [];
  if (component.type === "questionCheckbox")
    options = component.props.list || [];
  return options.map((option) => ({
    name: option.text,
    count: answers.filter((answer) => {
      const value = answer.values[componentId];
      if (Array.isArray(value))
        return value.includes(option.value) || value.includes(option.text);
      if (typeof value === "string" && component.type === "questionCheckbox") {
        const values = value.split(",").map((item) => item.trim());
        return values.includes(option.value) || values.includes(option.text);
      }
      return value === option.value || value === option.text;
    }).length,
  }));
}

module.exports = {
  DB_PATH,
  createAnswer,
  createQuestion,
  deleteQuestions,
  duplicateQuestion,
  getComponentStat,
  getCurrentUser,
  getPublishedQuestion,
  getQuestion,
  listAnswers,
  listQuestions,
  loginUser,
  registerUser,
  updateQuestion,
};
