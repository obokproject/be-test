const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/index");

router.use(isLoggedIn);
router.use(isAdmin);

// 모든 사용자 조회
router.get("/users", adminController.getAllUsers);

// 사용자 삭제
router.delete("/users/:id", adminController.deleteUser);

// 월별 가입자 통계
router.get("/monthly-signups/:year", adminController.getMonthlySignups);

module.exports = router;
