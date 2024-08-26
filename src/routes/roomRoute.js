// routes/roomRoute.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { isLoggedIn } = require("../middlewares"); // isLoggedIn 가져오기

// 방 목록 가져오기
router.get("/", isLoggedIn, roomController.getRooms);

// 방 생성하기
router.post("/", isLoggedIn, roomController.createRoom);

module.exports = router;
