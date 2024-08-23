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

  // 방에 참여시키기 (클라이언트가 방에 참가 요청을 할 때)
  socket.on("joinRoom", async (data) => {
    const { roomId, userId } = data;
    socket.join(roomId); // 클라이언트를 특정 방에 추가
    console.log(`Client joined room: ${roomId}`);

    // 멤버 테이블에 사용자 추가 (기본 role은 guest)
    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      const intRoomId = room.id;

      // 기존 멤버 조회
      const existingMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt", "ASC"]],
      });

      let role = "guest";
      // 방에 첫 번째로 들어오는 사용자라면 host로 지정
      if (existingMembers.length === 0) {
        role = "host";
      }

      // 새로운 멤버 추가
      await db.Member.create({
        room_id: intRoomId,
        user_id: userId,
        role: role,
      });
      console.log(
        `Member added: userId ${userId} as ${role} in roomId ${intRoomId}`
      );

      // 이전 메시지와 키워드를 DB에서 조회
      const previousMessages = await db.Chat.findAll({
        where: { room_id: intRoomId },
      });
      const previousKeywords = await db.Chatkeyword.findAll({
        where: { room_id: intRoomId },
      });

      // 클라이언트로 이전 메시지와 키워드를 전송
      socket.emit("previousMessages", previousMessages);
      socket.emit(
        "previousKeywords",
        previousKeywords.map((k) => k.keyword)
      );
    } catch (error) {
      console.error("Error adding member to room:", error);
    }
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

      // 추출된 키워드를 ChatKeyword 테이블에 저장
      if (keywords.length > 0) {
        for (const keyword of keywords) {
          await db.Chatkeyword.create({
            room_id: room.id,
            keyword: keyword,
          });
        }
      }

      // 사용자의 추가 정보를 가져오기 위해 user 정보를 조회
      const user = await db.User.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      // 사용자의 정보를 포함한 메시지 생성
      const messageWithUserInfo = {
        content: savedMessage.content,
        user_id: savedMessage.user_id,
        profile: user.profile_image, // user에서 프로필 정보 가져오기
        nickname: user.nickname, // user에서 닉네임 정보 가져오기
        job: user.job, // user에서 직업 정보 가져오기
      };

      // 같은 방에 있는 다른 클라이언트들에게 메시지 전송
      io.to(roomId).emit("message", messageWithUserInfo);
      console.log("Message sent to clients in room:", roomId);
      console.log(messageWithUserInfo);

      // 키워드가 있을 경우 해당 방의 모든 클라이언트에게 키워드 전송
      if (keywords.length > 0) {
        io.to(roomId).emit("keywordUpdate", keywords);
        console.log("Keywords sent to clients in room:", roomId);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  // 사용자가 방에서 나갈 때 처리
  socket.on("leaveRoom", async ({ roomId, userId }) => {
    try {
      // 멤버 테이블에서 제거
      await db.Member.destroy({
        where: {
          room_id: roomId,
          user_id: userId,
        },
      });

      console.log(`Member removed: userId ${userId} from roomId ${roomId}`);

      // 호스트가 나갔을 경우 새로운 호스트 지정
      const remainingMembers = await db.Member.findAll({
        where: { room_id: roomId },
        order: [["createdAt", "ASC"]],
      });

      if (remainingMembers.length > 0) {
        const newHost = remainingMembers[0]; // 가장 먼저 입장한 멤버를 호스트로 지정
        await db.Member.update({ role: "host" }, { where: { id: newHost.id } });
        console.log(`New host assigned: userId ${newHost.user_id}`);
      }

      // 클라이언트에게 업데이트된 멤버 정보 전송
      io.to(roomId).emit("memberUpdate", { userId, action: "left" });
    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit("error", "Failed to leave room");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
