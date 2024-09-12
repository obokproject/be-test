const {
  Room,
  Keyword,
  Member,
  User,
  Kanban,
  Content,
  Sequelize,
  sequelize,
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

    const sections = [
      { id: "생성", title: "생성", cards: [] },
      { id: "고민", title: "고민", cards: [] },
      { id: "채택", title: "채택", cards: [] },
    ];

    for (const kanban of room.Kanbans) {
      const section = sections.find((s) => s.id === kanban.section);
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

// 칸반보드 카드 추가
exports.addCard = async (req, res) => {
  console.log("Adding card with data:", { roomId, sectionId, content, userId });

  const t = await sequelize.transaction();

  try {
    const { roomId } = req.params;
    const { sectionId, content } = req.body;
    const userId = req.user.id;

    console.log(
      `Adding card: roomId=${roomId}, sectionId=${sectionId}, content=${content}, userId=${userId}`
    );

    const room = await Room.findOne(
      { where: { uuid: roomId } },
      { transaction: t }
    );
    if (!room) {
      await t.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    // 생성 섹션의 카드 수 확인
    const creationSectionCardCount = await Kanban.count({
      where: { room_id: room.id, section: "생성" },
      transaction: t,
    });

    if (creationSectionCardCount >= 7) {
      await t.rollback();
      return res.status(400).json({
        message: "생성 섹션에는 최대 7개의 카드만 추가할 수 있습니다.",
      });
    }

    // 사용자의 생성 섹션 카드 수 확인
    const userCreationCardCount = await Kanban.count({
      where: { room_id: room.id, user_id: userId, section: "생성" },
      transaction: t,
    });

    if (userCreationCardCount >= 2) {
      await t.rollback();
      return res.status(400).json({
        message: "생성 섹션에는 1인당 최대 2개의 카드만 추가할 수 있습니다.",
      });
    }

    // 카드 내용 길이 제한
    if (content.length > 10) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "카드 내용은 최대 10글자까지 입력 가능합니다." });
    }

    const newCard = await Kanban.create(
      {
        room_id: room.id,
        user_id: userId,
        section: sectionId,
      },
      { transaction: t }
    );

    const newContent = await Content.create(
      {
        room_id: room.id,
        kanban_id: newCard.id,
        user_id: userId,
        content: content,
      },
      { transaction: t }
    );

    const user = await User.findByPk(userId, { transaction: t });

    await t.commit();

    console.log(
      `Card added successfully: kanbanId=${newCard.id}, contentId=${newContent.id}`
    );

    res.status(201).json({
      id: newCard.id,
      content: newContent.content,
      profile: user.profile_image,
      userId: userId,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error adding card:", error);
    res
      .status(500)
      .json({ message: "Failed to add card", error: error.message });
  }
};

// 칸반보드 카드 이동
exports.moveCard = async (req, res) => {
  try {
    const { roomId, cardId, newSectionId, newIndex } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ where: { uuid: roomId } });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 호스트 확인
    const isHost = await Member.findOne({
      where: { room_id: room.id, user_id: userId, role: "host" },
    });

    if (!isHost) {
      return res.status(403).json({ message: "Only host can move cards" });
    }

    // 트랜잭션 시작
    const t = await sequelize.transaction();

    try {
      // 이동할 카드 찾기
      const cardToMove = await Kanban.findOne({
        where: { id: cardId, room_id: room.id },
        transaction: t,
      });

      if (!cardToMove) {
        await t.rollback();
        return res.status(404).json({ message: "Card not found" });
      }

      // 기존 섹션의 카드들 순서 조정
      await Kanban.update(
        { order: sequelize.literal("order - 1") },
        {
          where: {
            room_id: room.id,
            section: cardToMove.section,
            order: { [Sequelize.Op.gt]: cardToMove.order },
          },
          transaction: t,
        }
      );

      // 새 섹션의 카드들 순서 조정
      await Kanban.update(
        { order: sequelize.literal("order + 1") },
        {
          where: {
            room_id: room.id,
            section: newSectionId,
            order: { [Sequelize.Op.gte]: newIndex },
          },
          transaction: t,
        }
      );

      // 카드 이동
      await cardToMove.update(
        { section: newSectionId, order: newIndex },
        { transaction: t }
      );

      // 트랜잭션 커밋
      await t.commit();

      // 업데이트된 보드 데이터 가져오기
      const updatedBoardData = await fetchBoardData(roomId);

      res.status(200).json({
        message: "Card moved successfully",
        updatedBoard: updatedBoardData,
      });
    } catch (error) {
      // 에러 발생 시 트랜잭션 롤백
      await t.rollback();
      console.error("Error moving card:", error);
      res.status(500).json({ message: "Failed to move card" });
    }
  } catch (error) {
    console.error("Error moving card:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 보드 데이터 가져오기 함수
async function fetchBoardData(roomId) {
  const room = await Room.findOne({
    where: { uuid: roomId },
    include: [
      {
        model: Kanban,
        include: [
          {
            model: Content,
            include: [{ model: User, attributes: ["id", "profile_image"] }],
          },
        ],
        order: [
          ["section", "ASC"],
          ["order", "ASC"],
        ],
      },
    ],
  });

  if (!room) {
    throw new Error("Room not found");
  }
  const sections = [
    { id: "생성", title: "생성", cards: [] },
    { id: "고민", title: "고민", cards: [] },
    { id: "채택", title: "채택", cards: [] },
  ];

  room.Kanbans.forEach((kanban) => {
    const section = sections.find((s) => s.id === kanban.section);
    if (section && kanban.Content) {
      section.cards.push({
        id: kanban.id,
        content: kanban.Content.content,
        profile: kanban.Content.User.profile_image,
        userId: kanban.Content.User.id,
        order: kanban.order,
      });
    }
  });

  return sections;
}

exports.fetchBoardData = fetchBoardData;
