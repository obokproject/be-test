const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mysql = require("mysql2/promise");
const db = require("./models"); // Sequelize 모델 불러오기

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

// 데이터베이스 연결 및 테이블 동기화
db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
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
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production", // 프로덕션 환경에서만 HTTPS를 사용
//       httpOnly: true, // 클라이언트에서 자바스크립트로 쿠키 접근 방지
//       sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // 개발 중에는 'Lax', 프로덕션에서는 'None'으로 설정
//     },
//   })
// );
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 개발 환경에서는 HTTPS를 사용하지 않으므로 false로 설정
      httpOnly: true, // 클라이언트 자바스크립트에서 쿠키에 접근하지 못하도록 설정
      sameSite: "Lax", // 개발 환경에서는 'Lax'로 설정
    },
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
