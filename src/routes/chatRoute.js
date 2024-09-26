const express = require("express");
const chatController = require("../controllers/chatController"); // chatController 불러오기

const router = express.Router();

/**
 * @swagger
 * /api/chat/{roomId}/messages:
 *   get:
 *     summary: "특정 방의 메시지 가져오기"
 *     description: "주어진 방(roomId)의 채팅 메시지를 가져오는 API"
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: "메시지를 가져올 방의 ID."
 *     responses:
 *       200:
 *         description: "성공적으로 메시지를 반환함"
 */
router.get("/:roomId/messages", chatController.getMessages);

module.exports = router; // 라우터를 모듈로 내보냅니다
