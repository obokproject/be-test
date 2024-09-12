const {
  Room,
  Keyword,
  Member,
  User,
  Kanban,
  Content,
  Sequelize,
} = require("../models");

// 방 목록 가져오기
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { status: "active" },
      include: [
        {
          model: Keyword,
          attributes: ["keyword"],
        },
        {
          model: Member,
          attributes: [],
        },
        {
          model: User,
          attributes: ["nickname"],
        },
      ],
      attributes: {
        include: [
          [
            Sequelize.fn("COUNT", Sequelize.col("Members.id")),
            "participantsCount",
          ],
        ],
      },
      group: ["Room.id", "Keywords.id", "User.id"],
    });

    const roomsWithParticipants = rooms.map((room) => {
      return {
        ...room.toJSON(),
        participants: room.get("participantsCount"),
        keywords: room.Keywords.map((keyword) => keyword.keyword),
        nickname: room.User.nickname,
      };
    });

    res.status(200).json(roomsWithParticipants);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};

// 방 생성 함수
exports.createRoom = async (req, res) => {
  try {
    const { title, type, max_member, duration, uuid, keywords } = req.body;

    const room = await Room.create({
      uuid,
      user_id: req.user.id,
      title,
      type,
      max_member,
      duration,
      status: "active",
    });

    if (keywords && Array.isArray(keywords)) {
      for (const keyword of keywords) {
        await Keyword.create({
          room_id: room.id,
          keyword,
        });
      }
    }

    if (type === "kanban") {
      const sections = ["생성", "고민", "채택"];
      for (const section of sections) {
        await Kanban.create({
          room_id: room.id,
          user_id: req.user.id,
          section: section,
        });
      }
    }

    const roomWithKeywords = {
      ...room.toJSON(),
      keywords,
    };

    res.status(201).json(roomWithKeywords);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Failed to create room" });
  }
};

// 방 정보 조회 함수 (칸반 보드 데이터 포함)
exports.getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({
      where: { uuid: roomId },
      include: [
        { model: Keyword, attributes: ["keyword"] },
        { model: User, attributes: ["nickname", "job", "profile_image"] },
        { model: Member, attributes: [] },
        {
          model: Kanban,
          include: [
            {
              model: Content,
              include: [{ model: User, attributes: ["id", "profile_image"] }],
            },
          ],
        },
      ],
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("Members.id")), "memberCount"],
        ],
      },
      group: [
        "Room.id",
        "Keywords.id",
        "User.id",
        "Kanbans.id",
        "Kanbans->Content.id",
        "Kanbans->Content->User.id",
      ],
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    for (const kanban of room.Kanbans) {
      const section = section.find((s) => s.id === kanban.section);
      if (section && kanban.Content) {
        section.cards.push({
          id: kanban.id,
          content: kanban.Content.content,
          profile: kanban.Content.User.profile_image,
          userId: kanban.Content.User.id,
        });
      }
    }

    const roomInfo = {
      id: room.id,
      uuid: room.uuid,
      title: room.title,
      type: room.type,
      max_member: room.max_member,
      duration: room.duration,
      status: room.status,
      memberCount: room.get("memberCount"),
      keywords: room.Keywords.map((k) => k.keyword),
      kanbanBoard: sections,
    };

    res.status(200).json(roomInfo);
  } catch (error) {
    console.error("Error fetching room info:", error);
    res.status(500).json({ message: "Failed to fetch room info" });
  }
};
