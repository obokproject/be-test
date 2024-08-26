const { Room, Keyword, Member, Sequelize } = require("../models");

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
      ],
      attributes: {
        include: [
          [
            Sequelize.fn("COUNT", Sequelize.col("Members.id")),
            "participantsCount",
          ],
        ],
      },
      group: ["Room.id", "Keywords.id"],
    });

    const roomsWithParticipants = rooms.map((room) => {
      return {
        ...room.toJSON(),
        participants: room.get("participantsCount"),
        keywords: room.Keywords.map((keyword) => keyword.keyword),
      };
    });

    res.status(200).json(roomsWithParticipants);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};

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
