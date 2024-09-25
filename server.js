require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io"); // socket.io 불러오기
const db = require("./src/models"); // Sequelize 모델 가져오기

const PORT = process.env.PORT || 5000;

const server = http.createServer(app); // 기존 Express 앱을 사용하여 HTTP 서버 생성

const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP_API_URL, // CORS 설정 (프론트엔드 URL)
    methods: ["GET", "POST"],
  },
});

// 키워드 추출 함수
function extractKeywords(content) {
  const regex = /#[^\s#]+/g;
  const keywords = content.match(regex) || [];
  return keywords;
}

// 칸반 보드 데이터를 데이터베이스에서 가져오는 함수
async function fetchBoardData(roomId) {
  const room = await db.Room.findOne({ where: { uuid: roomId } });
  if (!room) throw new Error("Room not found");

  const kanbans = await db.Kanban.findAll({
    where: { room_id: room.id },
    include: [
      {
        model: db.Content,
        include: [{ model: db.User, attributes: ["id", "profile_image"] }],
      },
    ],
    order: [[db.Content, "position", "ASC"]],
  });

  const sections = [
    { id: "생성", title: "생성", cards: [] },
    { id: "고민", title: "고민", cards: [] },
    { id: "채택", title: "채택", cards: [] },
  ];

  for (const kanban of kanbans) {
    const section = sections.find((s) => s.id === kanban.section);
    if (section && kanban.Contents && kanban.Contents.length > 0) {
      kanban.Contents.forEach((content) => {
        section.cards.push({
          id: content.id,
          content: content.content,
          profile: content.User.profile_image,
          userId: content.User.id,
          updatedAt: content.updatedAt,
          position: content.position,
        });
      });
    }
  }

  return sections;
}

// TODO 삭제할것
// 새 카드를 데이터베이스에 추가하는 함수
async function addCardToDatabase(roomId, sectionId, card) {
  const room = await db.Room.findOne({ where: { uuid: roomId } });
  if (!room) throw new Error("Room not found");

  const user = await db.User.findByPk(card.userId);
  if (!user) throw new Error("User not found");

  // 칸반 및 컨텐츠 생성
  const kanban = await db.Kanban.findOne({
    where: {
      room_id: room.id,
      section: sectionId,
    },
  });

  await db.Content.create({
    room_id: room.id,
    kanban_id: kanban.id,
    user_id: user.id,
    content: card.content,
  });

  return await fetchBoardData(roomId);
}

// socket.io 연결 처리
io.on("connection", (socket) => {
  // 방에 참여시키기 (클라이언트가 방에 참가 요청을 할 때)
  socket.on("joinRoom", async (data) => {
    const { roomId, userId } = data;
    socket.join(roomId); // 클라이언트를 특정 방에 추가
    socket.roomId = roomId; // 소켓에 roomId 저장
    socket.userId = userId; // 소켓에 userId 저장

    // 멤버 테이블에 사용자 추가 (기본 role은 guest)
    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      const intRoomId = room.id;
      const realRoom = {
        id: room.id,
        title: room.title,
        userId: room.user_id,
        createdAt: room.createdAt,
        status: room.status,
      };

      // 클라이언트로 realRoom 정보를 전송
      socket.emit("realRoom", realRoom);

      // 기존 멤버 조회
      let updatedMembers = await db.Member.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt", "ASC"]],
        include: [
          {
            model: db.User,
            attributes: ["nickname", "job", "profile_image"],
          },
        ],
      });

      // 논리적으로 삭제된 멤버가 있는지 확인 (복원할 멤버가 있는지 확인)
      let existingMember = await db.Member.findOne({
        where: { room_id: intRoomId, user_id: userId },
        paranoid: false, // 논리적으로 삭제된 레코드도 조회
      });

      // 호스트가 이미 있는지 확인
      const existingHost = await db.Member.findOne({
        where: { room_id: intRoomId, role: "host" }, // 이미 호스트로 설정된 멤버가 있는지 확인
        paranoid: false, // 논리적으로 삭제된 멤버도 포함
      });

      let role = "guest"; // 기본 role을 'guest'로 설정

      if (existingMember) {
        // 논리적으로 삭제된 멤버가 있다면 복원
        await existingMember.restore();
      } else {
        // 방에 첫 번째로 들어오는 사용자라면 host로 지정
        if (!existingHost) {
          role = "host";
        }

        // 새로운 멤버 추가
        await db.Member.create({
          room_id: intRoomId,
          user_id: userId,
          role: role,
        });
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
            : "/images/user-profile.png",
          role: member.role,
        }))
      );

      // 업데이트될때 RoomInfo에 보냄
      io.to(roomId).emit("roomUpdated");

      // 이전 메시지와 키워드를 DB에서 조회
      const previousMessages = await db.Chat.findAll({
        where: { room_id: intRoomId },
        include: [
          {
            model: db.User,
            attributes: ["nickname", "job", "profile_image"],
          },
        ],
      });
      const previousKeywords = await db.Chatkeyword.findAll({
        where: { room_id: intRoomId },
        order: [["createdAt"]], // 역순으로 정렬
      });

      // 클라이언트로 이전 메시지와 키워드를 전송
      socket.emit(
        "previousMessages",
        previousMessages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          user_id: msg.user_id,
          profile: msg.User
            ? msg.User.profile_image
            : "/images/user-profile.png",
          nickname: msg.User ? msg.User.nickname : "Unknown",
          job: msg.User ? msg.User.job : "Unknown",
        }))
      );

      socket.emit(
        "previousKeywords",
        previousKeywords.map((k) => k.keyword)
      );

      // 칸반 보드 데이터 가져오기 및 전송
      const boardData = await fetchBoardData(roomId);
      socket.emit("previousBoardData", boardData);
    } catch (error) {
      console.error("Error adding member to room:", error);
    }
  });

  // 메시지 수신 처리
  socket.on("message", async (message) => {
    const { roomId, userId, content } = message;

    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      // 메시지를 DB에 저장
      const savedMessage = await db.Chat.create({
        room_id: room.id,
        user_id: userId,
        content: content,
      });

      // 시스템 메시지일 경우 처리
      if (userId === 99999) {
        // 시스템 메시지를 방에 있는 모든 클라이언트에게 전송
        io.to(roomId).emit("message", {
          id: savedMessage.id,
          user_id: userId,
          content: content,
          profile: null, // 시스템 메시지이므로 프로필 없음
          nickname: "System", // 시스템 메시지
          job: "System", // 시스템 메시지
        });
        return; // 시스템 메시지는 사용자 정보가 필요 없으므로 여기서 종료
      }

      // 키워드 추출
      const keywords = extractKeywords(content);

      // 중복되지 않은 키워드만 ChatKeyword 테이블에 저장
      for (const keyword of keywords) {
        try {
          await db.Chatkeyword.create({
            room_id: room.id,
            chat_id: savedMessage.id,
            keyword: keyword,
          });
        } catch (error) {
          if (error.name === "SequelizeUniqueConstraintError") {
            console.log(`Keyword ${keyword} already exists, skipping...`);
            continue;
          } else {
            throw error;
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
        id: savedMessage.id, // 'id' 추가
        content: savedMessage.content,
        user_id: savedMessage.user_id,
        profile: user.profile_image,
        nickname: user.nickname,
        job: user.job,
      };

      // 같은 방에 있는 다른 클라이언트들에게 메시지 전송
      io.to(roomId).emit("message", messageWithUserInfo);

      // 키워드가 있을 경우 해당 방의 모든 클라이언트에게 키워드 전송
      if (keywords.length > 0) {
        io.to(roomId).emit("keywordUpdate", keywords);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  // 클라이언트가 키워드를 클릭했을 때 해당 메시지를 찾아서 반환
  socket.on("keywordClick", async ({ roomId, keyword }, callback) => {
    try {
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      // 해당 키워드에 연결된 채팅 메시지를 찾음
      const chatKeyword = await db.Chatkeyword.findOne({
        where: { room_id: room.id, keyword: keyword },
        include: [{ model: db.Chat }],
      });

      if (chatKeyword && chatKeyword.Chat) {
        // 키워드에 연결된 채팅 메시지를 클라이언트로 반환
        const chatMessage = {
          id: chatKeyword.Chat.id,
          content: chatKeyword.Chat.content,
          createdAt: chatKeyword.Chat.createdAt,
        };
        callback({ success: true, message: chatMessage });
      } else {
        callback({ success: false, error: "Keyword or message not found" });
      }
    } catch (error) {
      console.error("Error finding message for keyword:", error);
      callback({ success: false, error: "Failed to find message" });
    }
  });

  // 키워드 삭제 이벤트 처리
  socket.on("deleteKeyword", async ({ roomId, keyword, userId }, callback) => {
    try {
      // roomId(UUID)를 사용하여 방을 찾고 room의 int ID를 가져옴
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      // 해당 방과 키워드에 일치하는 레코드 삭제
      const result = await db.Chatkeyword.destroy({
        where: {
          room_id: room.id,
          keyword: keyword,
        },
      });

      if (result) {
        console.log(`Keyword "${keyword}" deleted from room "${roomId}"`);
        callback({ success: true });

        // 키워드 삭제 후 업데이트된 키워드 목록을 모든 클라이언트에게 전송
        const updatedKeywords = await db.Chatkeyword.findAll({
          where: { room_id: room.id },
        });
        const keywordList = updatedKeywords.map((k) => k.keyword);
        io.to(roomId).emit("keywordUpdate", keywordList);
      } else {
        throw new Error("Failed to delete keyword");
      }
    } catch (error) {
      console.error("Error deleting keyword:", error);
      callback({ success: false, error: "Failed to delete keyword" });
    }
  });

  // 칸반 보드 업데이트 처리
  socket.on("boardUpdate", async ({ roomId, sections, movedCard }) => {
    try {
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) throw new Error("Room not found");

      // 모든 섹션에 대해 순서 업데이트
      for (const section of sections) {
        const kanban = await db.Kanban.findOne({
          where: {
            room_id: room.id,
            section: section.id,
          },
        });

        if (!kanban) continue;
        // 각 카드의 순서 업데이트
        for (let i = 0; i < section.cards.length; i++) {
          const card = section.cards[i];
          await db.Content.update(
            {
              kanban_id: kanban.id,
              position: i, // 새로운 순서 저장
            },
            {
              where: { id: card.id },
            }
          );
        }
      }

      // 업데이트된 보드 데이터 가져오기
      const updatedSections = await fetchBoardData(roomId);

      // 같은 방의 다른 클라이언트들에게 업데이트 전송
      io.to(roomId).emit("boardUpdate", updatedSections);
    } catch (error) {
      console.error("Error updating board:", error);
      socket.emit("error", "Failed to update board");
    }
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
            attributes: ["id", "nickname", "job", "profile_image"],
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
        user_id: room.user_id,
        member: room.get("memberCount"),
        maxMember: room.max_member,
        keywords: room.Keywords.map((k) => k.keyword),
        duration: room.duration,
        createdAt: room.createdAt,
        type: room.type,
        status: room.status,
        hostNickname: room.User.nickname, // 호스트의 닉네임
        hostJob: room.User.job, // 호스트의 직업
        hostProfileImage: room.User.profile_image, // 호스트의 프로필 이미지
      };
      socket.emit("roomInfo", roomInfo);
    } catch (error) {
      console.error("Error fetching room:", error);
      socket.emit("roomError", { message: "Failed to fetch room" });
    }
  });

  socket.on("addCard", async ({ roomId, sectionId, card }) => {
    try {
      await addCardToDatabase(roomId, sectionId, card);

      // 업데이트된 보드 데이터 가져오기
      const updatedSections = await fetchBoardData(roomId);

      // 같은 방의 다른 클라이언트들에게 업데이트 전송
      io.to(roomId).emit("boardUpdate", updatedSections);

      // socket.emit("roomInfo", roomInfo);
    } catch (error) {
      console.error("Error fetching room:", error);
      socket.emit("roomError", { message: "Failed to fetch room" });
    }
  });

  // 방이 종료될 때 처리하는 로직
  socket.on("roomClosed", async ({ roomId }) => {
    try {
      const room = await db.Room.findOne({ where: { uuid: roomId } });
      if (!room) {
        throw new Error("Room not found");
      }

      // 방의 상태를 'closed'로 업데이트
      await room.update({ status: "closed" });

      // 방에 있는 클라이언트들에게 방이 종료되었다고 알림
      io.to(roomId).emit("serverRoomClosed", {
        message: "방이 종료되었습니다. 더 이상 방에 참여할 수 없습니다.",
      });
    } catch (error) {
      console.error("Error closing room:", error);
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
        throw new Error("Room not found");
      }
      const intRoomId = room.id; // 정수형 room_id

      // 나가는 사용자의 역할을 확인하기 위해 Member 테이블 조회
      const leavingMember = await db.Member.findOne({
        where: { room_id: intRoomId, user_id: userId },
      });

      // 멤버 테이블에서 제거
      await db.Member.destroy({
        where: {
          room_id: intRoomId,
          user_id: userId,
        },
      });

      // 나가는 사용자가 호스트인 경우, 방을 닫음
      if (leavingMember && leavingMember.role === "host") {
        // 3초 후에도 호스트가 없으면 방을 닫음 (새로고침 예외 처리 가능)
        setTimeout(async () => {
          // 3초 후에도 여전히 호스트가 없으면 방을 닫음
          const updatedHost = await db.Member.findOne({
            where: { room_id: intRoomId, role: "host" },
          });

          if (!updatedHost) {
            // 방의 상태를 'closed'로 업데이트
            await room.update({ status: "closed" });
            io.to(roomId).emit("serverRoomClosed", {
              message: "호스트가 나가서 방이 종료되었습니다.",
            });
            console.log(`Room ${roomId} closed as host left.`);
          }
        }, 3000); // 3초 지연 후 다시 확인
      } else {
        // 나가는 사용자가 호스트가 아닐 때는 남은 멤버 업데이트
        const updatedMembers = await db.Member.findAll({
          where: { room_id: intRoomId },
          include: [
            {
              model: db.User,
              attributes: ["nickname", "job", "profile_image"],
            },
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
              : "/images/user-profile.png",
            role: member.role,
          }))
        );
      }
      // roominfo에 보냄
      io.to(roomId).emit("roomUpdated");

      // 방에 남은 인원이 있는지 확인
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);

      // 3초 후에도 방에 남은 인원이 없는지 확인하고 방을 닫음
      if (!clientsInRoom || clientsInRoom.size === 0) {
        setTimeout(async () => {
          const clientsInRoomAfterTimeout =
            io.sockets.adapter.rooms.get(roomId);

          if (
            !clientsInRoomAfterTimeout ||
            clientsInRoomAfterTimeout.size === 0
          ) {
            // 방의 상태가 "open"이 아닌 경우에만 방을 닫음
            const room = await db.Room.findOne({ where: { uuid: roomId } });

            if (room && room.status !== "open") {
              await db.Room.update(
                { status: "closed" },
                { where: { uuid: roomId } }
              );
              console.log(
                `Room ${roomId} closed after 3 seconds and no users left.`
              );
            }
          }
        }, 100); // 3초 대기 후 다시 확인
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit("error", "Failed to leave room");
    }
  });
});
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
