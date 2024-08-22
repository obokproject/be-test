const express = require("express");
const chatController = require("../controllers/chatController"); // chatController 불러오기

const router = express.Router();

// 메시지 가져오기 라우트 정의
router.get("/:roomId/messages", chatController.getMessages);

module.exports = router; // 라우터를 모듈로 내보냅니다
