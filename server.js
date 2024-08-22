require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io"); // socket.io 불러오기
const db = require("./src/models"); // Sequelize 모델 가져오기

const PORT = process.env.PORT || 5000;

const server = http.createServer(app); // 기존 Express 앱을 사용하여 HTTP 서버 생성

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // CORS 설정 (프론트엔드 URL)
    methods: ["GET", "POST"],
  },
});

// 키워드 추출 함수
function extractKeywords(content) {
  const regex = /#[^\s#]+/g;
  const keywords = content.match(regex) || [];
  console.log("Extracted Keywords:", keywords); // 추출된 키워드를 로그로 출력
  return keywords;
}

// socket.io 연결 처리
io.on("connection", (socket) => {
  console.log("A new client connected!");

  // 테스트 메시지를 클라이언트로 전송
  socket.emit("message", { content: "This is a test message from the server" });

  // 방에 참여시키기 (클라이언트가 방에 참가 요청을 할 때)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId); // 클라이언트를 특정 방에 추가
    console.log(`Client joined room: ${roomId}`);

    // 이 부분에서 이전 메시지를 클라이언트에게 보내는 로직을 추가할 수 있습니다.
    // 예: socket.emit('previousMessages', 이전 메시지 배열);
  });

  // 메시지 수신 처리
  socket.on("message", async (message) => {
    console.log("Received message from client:", message);
    const { roomId, userId, content } = message;

    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }
      // 키워드 추출
      const keywords = extractKeywords(content);
      console.log("Extracted Keywords:", keywords); // 키워드가 제대로 추출되는지 확인

      // 메시지를 DB에 저장
      const savedMessage = await db.Chat.create({
        room_id: room.id, // INT 타입의 room_id
        user_id: userId,
        content: content,
      });

      // 키워드가 있을 경우에만 DB에 저장
      if (keywords && keywords.length > 0) {
        for (const keyword of keywords) {
          await db.Chatkeyword.create({
            room_id: room.id, // INT 타입의 room_id
            keyword: keyword,
          });
          console.log("Keyword saved:", keyword); // 키워드 저장 로그 추가
        }
      }

      // 같은 방에 있는 다른 클라이언트들에게 메시지 전송
      io.to(roomId).emit("message", savedMessage.content);
      console.log("Message sent to clients in room:", roomId);
      console.log(savedMessage.content);
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
