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
    socket.roomId = roomId; // 소켓에 roomId 저장
    socket.userId = userId; // 소켓에 userId 저장
    console.log(`Client joined room: ${roomId}`);

    // 멤버 테이블에 사용자 추가 (기본 role은 guest)
    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found22222");
      }

      const intRoomId = room.id;

      // 기존 멤버 조회
      let updatedMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt", "ASC"]],
        include: [
          {
            model: db.User, // User 모델과 조인
            attributes: ["nickname", "job", "profile_image"], // 필요한 속성만 선택
          },
        ],
      });
      console.log("Updated Members:", updatedMembers); // 멤버 리스트를 로그로 출력하여 확인

      // 논리적으로 삭제된 멤버가 있는지 확인 (복원할 멤버가 있는지 확인)
      let existingMember = await db.Member.findOne({
        where: { room_id: intRoomId, user_id: userId },
        paranoid: false, // 논리적으로 삭제된 레코드도 조회
      });

      let role = "guest"; // 기본 role을 'guest'로 설정

      if (existingMember) {
        // 논리적으로 삭제된 멤버가 있다면 복원
        await existingMember.restore();
        console.log(`Restored member: userId ${userId} in roomId ${intRoomId}`);

        // 현재 호스트가 있는지 확인
        const currentHost = await db.Member.findOne({
          where: {
            room_id: intRoomId,
            role: "host",
            user_id: { [db.Sequelize.Op.ne]: userId }, // 자기 자신을 제외
          },
        });

        // 호스트가 이미 있다면 복원된 멤버의 역할을 guest로 변경
        if (currentHost) {
          role = "guest"; // 이미 호스트가 있으면 역할을 guest로 변경
          await existingMember.update({ role: role });
          console.log(
            `Updated role to guest for userId ${userId} in roomId ${intRoomId}`
          );
        } else {
          role = "host"; // 호스트가 없으면 복원된 멤버가 호스트 역할을 유지
          console.log(
            `Restored member keeps host role: userId ${userId} in roomId ${intRoomId}`
          );
        }
      } else {
        // 방에 첫 번째로 들어오는 사용자라면 host로 지정
        if (updatedMembers.length === 0) {
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
      }

      // 멤버 정보 업데이트 후 다시 가져오기
      updatedMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt", "ASC"]],
        include: [
          {
            model: db.User,
            attributes: ["nickname", "job", "profile_image"],
          },
        ],
      });

      // 멤버 정보를 프론트엔드로 전송
      io.to(roomId).emit(
        "memberUpdate",
        updatedMembers.map((member) => ({
          userId: member.user_id,
          nickname: member.User ? member.User.nickname : "Unknown",
          job: member.User ? member.User.job : "Unknown",
          profile: member.User
            ? member.User.profile_image
            : "default-profile.png",
          role: member.role,
        }))
      );

      // 이전 메시지와 키워드를 DB에서 조회
      const previousMessages = await db.Chat.findAll({
        where: { room_id: intRoomId },
        include: [
          {
            model: db.User, // User 모델과 조인하여 사용자 정보 가져오기
            attributes: ["nickname", "job", "profile_image"], // 필요한 속성만 선택
          },
        ],
      });
      const previousKeywords = await db.Chatkeyword.findAll({
        where: { room_id: intRoomId },
      });

      // 클라이언트로 이전 메시지와 키워드를 전송
      socket.emit(
        "previousMessages",
        previousMessages.map((msg) => ({
          content: msg.content,
          user_id: msg.user_id,
          profile: msg.User ? msg.User.profile_image : "default-profile.png", // 프로필 정보
          nickname: msg.User ? msg.User.nickname : "Unknown", // 닉네임 정보
          job: msg.User ? msg.User.job : "Unknown", // 직업 정보
        }))
      );

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
        console.log("asdfasdfasdfasdf");
        throw new Error("Room not found3333333333");
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

      // 중복되지 않은 키워드만 ChatKeyword 테이블에 저장
      for (const keyword of keywords) {
        try {
          await db.Chatkeyword.create({
            room_id: room.id,
            keyword: keyword,
          });
        } catch (error) {
          if (error.name === "SequelizeUniqueConstraintError") {
            console.log(`Keyword ${keyword} already exists, skipping...`);
            continue; // 중복된 키워드가 있으면 건너뛰기
          } else {
            throw error; // 다른 에러가 있으면 예외 처리
          }
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

  socket.on("boardUpdate", async ({ roomId, sections }) => {
    // 데이터베이스에 업데이트된 칸반 보드 데이터 저장
    await updateBoardData(roomId, sections);

    // 같은 방의 다른 클라이언트들에게 업데이트 전송
    io.to(roomId).emit("boardUpdate", sections);
  });

  socket.on("addCard", async ({ roomId, sectionId, card }) => {
    // 데이터베이스에 새 카드 추가
    await addCardToDatabase(roomId, sectionId, card);

    // 같은 방의 다른 클라이언트들에게 업데이트 전송
    const updatedSections = await fetchPreviousBoardData(roomId);
    io.to(roomId).emit("boardUpdate", updatedSections);
  });

  // RoomInfo를 위한 새로운 이벤트 핸들러

  socket.on("getRoomInfo", async (uuid) => {
    try {
      const room = await db.Room.findOne({
        where: { uuid },
        include: [
          {
            model: db.Keyword,
            attributes: ["keyword"],
          },
          {
            model: db.User,
            attributes: ["username", "job"],
          },
          {
            model: db.Member,
            attributes: [],
          },
        ],
        attributes: {
          include: [
            [
              db.Sequelize.fn("COUNT", db.Sequelize.col("Members.id")),
              "memberCount",
            ],
          ],
        },
        group: ["Room.id", "Keywords.id", "User.id"],
      });

      if (!room) {
        socket.emit("roomError", { message: "Room not found" });
        return;
      }

      const roomInfo = {
        title: room.title,
        creator: {
          name: room.User.username,
          job: room.User.job,
        },
        member: room.get("memberCount"),
        maxMember: room.max_member,
        keywords: room.Keywords.map((k) => k.keyword),
        duration: room.duration,
      };

      socket.emit("roomInfo", roomInfo);
    } catch (error) {
      console.error("Error fetching room:", error);
      socket.emit("roomError", { message: "Failed to fetch room" });
    }
  });

  // 사용자가 방에서 나갈 때 처리
  socket.on("disconnect", async () => {
    const roomId = socket.roomId; // 저장된 roomId 가져오기
    const userId = socket.userId; // 저장된 userId 가져오기

    if (!roomId || !userId) {
      console.error("Missing roomId or userId during disconnect.");
      return;
    }

    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        console.log("aaaaaaaaaaaaaaa");
        throw new Error("Room not found444444444");
      }
      const intRoomId = room.id; // 정수형 room_id

      // 멤버 테이블에서 제거
      await db.Member.destroy({
        where: {
          room_id: intRoomId,
          user_id: userId,
        },
      });

      console.log(`Member removed: userId ${userId} from roomId ${intRoomId}`);

      // 호스트가 나갔을 경우 새로운 호스트 지정
      const remainingMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt", "ASC"]],
      });

      if (remainingMembers.length > 0) {
        const newHost = remainingMembers[0]; // 가장 먼저 입장한 멤버를 호스트로 지정
        await db.Member.update({ role: "host" }, { where: { id: newHost.id } });
        console.log(`New host assigned: userId ${newHost.user_id}`);
      }

      // 클라이언트에게 업데이트된 멤버 정보 전송
      io.to(roomId).emit("memberUpdate", { userId, action: "left" });

      // 멤버 정보를 다시 클라이언트로 전송하여 갱신된 멤버 리스트를 보냄
      const updatedMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        include: [
          { model: db.User, attributes: ["nickname", "job", "profile_image"] },
        ],
      });

      io.to(roomId).emit(
        "memberUpdate",
        updatedMembers.map((member) => ({
          userId: member.user_id,
          nickname: member.User ? member.User.nickname : "Unknown",
          job: member.User ? member.User.job : "Unknown",
          profile: member.User
            ? member.User.profile_image
            : "default-profile.png",
          role: member.role,
        }))
      );
    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit("error", "Failed to leave room");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
