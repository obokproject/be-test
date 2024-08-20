const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mysql = require("mysql2/promise");

const app = express();

// MySQL 연결 설정
const pool = mysql.createPool({
  //데이터베이스 연결 풀(Database Connection Pool)
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, //모든 연결이 사용 중일 때 새 연결 요청을 대기열에 넣도
  connectionLimit: 10, //풀에서 관리할 최대 연결 수를 설정
  queueLimit: 0, //대기열의 최대 길이를 설정합니다 (0은 무제한)
});

// 미들웨어 설정
app.use(
  cors({
    origin: "http://localhost:3000", // 프론트엔드 URL
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 패스포트 설정
require("./passports/google.strategy")(pool);

// 라우트 설정
const authRoutes = require("./routes/authRoute")(pool);
app.use("/auth", authRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
