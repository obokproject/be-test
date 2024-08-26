const db = require("../models"); // Sequelize 모델 불러오기

// 메시지 가져오기 함수
exports.getMessages = async (req, res) => {
  const { roomId } = req.params; // URL에서 roomId를 가져옵니다
  console.log("Received roomId:", roomId); // roomId 로그 출력

  try {
    // Room UUID로 Room을 찾습니다
    const room = await db.Room.findOne({ where: { uuid: roomId } });
    if (!room) {
      return res.status(404).json({ error: "Room not found" }); // 방이 없으면 404 에러 반환
    }

    // 해당 방에 속한 모든 메시지를 가져옵니다
    const messages = await db.Chat.findAll({ where: { room_id: room.id } });
    res.json(messages); // JSON 형식으로 메시지 반환
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" }); // 오류 발생 시 500 에러 반환
  }
};
