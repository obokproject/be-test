// routes/roomRoute.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { isLoggedIn } = require("../middlewares"); // isLoggedIn 가져오기

// 방 목록 가져오기
router.get("/", isLoggedIn, roomController.getRooms);

// 방 생성하기
router.post("/", isLoggedIn, roomController.createRoom);

// 방 정보 조회 (칸반 보드 데이터 포함)
router.get("/:roomId", isLoggedIn, roomController.getRoomInfo);

// 칸반 보드 카드 정보 조회
router.post("/:roomId/card", isLoggedIn, roomController.addCard);
router.put("/:roomId/card", isLoggedIn, roomController.moveCard);

module.exports = router;
