const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/index");

router.use(isLoggedIn);
router.use(isAdmin);

/**
 * @swagger
 * /api/auth/healthCheck:
 *   get:
 *     summary: "서버 상태 확인"
 *     description: "서버가 정상적으로 작동하는지 확인하는 헬스 체크 엔드포인트."
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/users", adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: "사용자 삭제"
 *     description: "특정 사용자를 삭제하는 관리자 전용 API"
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: "삭제할 사용자의 ID"
 *     responses:
 *       200:
 *         description: "성공적으로 사용자 삭제"
 */
router.delete("/users/:id", adminController.deleteUser);

/**
 * @swagger
 * /api/admin/monthly-signups/{year}:
 *   get:
 *     summary: "월별 가입자 통계 조회"
 *     description: "특정 연도의 월별 가입자 통계를 가져오는 관리자 전용 API"
 *     parameters:
 *       - in: path
 *         name: year
 *         schema:
 *           type: string
 *         required: true
 *         description: "조회할 연도"
 *     responses:
 *       200:
 *         description: "월별 가입자 통계 반환"
 */
router.get("/monthly-signups/:year", adminController.getMonthlySignups);

/**
 * @swagger
 * /api/admin/available-years:
 *   get:
 *     summary: "통계 조회 가능한 연도 목록"
 *     description: "통계 조회가 가능한 연도를 가져오는 관리자 전용 API"
 *     responses:
 *       200:
 *         description: "가능한 연도 목록 반환"
 */
router.get("/available-years", adminController.getAvailableYears);

module.exports = router;
