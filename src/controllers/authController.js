const { User, Member, Room } = require("../models");
const { Op } = require("sequelize");

const firstPart = [
  "행복한",
  "용감한",
  "지적인",
  "상냥한",
  "친절한",
  "고요한",
  "다정한",
  "활기찬",
  "기발한",
  "따뜻한",
  "강인한",
  "신비로운",
  "차분한",
  "명랑한",
  "장난스런",
  "신중한",
  "부지런한",
  "명예로운",
  "청순한",
  "냉철한",
  "창의적인",
  "따뜻한",
  "조용한",
  "예리한",
  "겸손한",
  "성실한",
  "공손한",
  "유쾌한",
  "단호한",
  "똑똑한",
];

const secondPart = [
  "사자",
  "호랑이",
  "코끼리",
  "기린",
  "원숭이",
  "팬더",
  "늑대",
  "여우",
  "곰",
  "고양이",
  "개",
  "토끼",
  "다람쥐",
  "사슴",
  "고릴라",
  "코뿔소",
  "하마",
  "얼룩말",
  "캥거루",
  "독수리",
  "펭귄",
  "돌고래",
  "상어",
  "악어",
  "독사",
  "올빼미",
  "수달",
  "북극곰",
  "해달",
  "플라밍고",
];

// 랜덤하게 배열에서 선택하는 함수
function getRandomNickname() {
  const first = firstPart[Math.floor(Math.random() * firstPart.length)];
  const second = secondPart[Math.floor(Math.random() * secondPart.length)];
  return first + second;
}

// 중복되지 않는 닉네임을 생성하는 함수
async function generateUniqueNickname() {
  let nickname;
  let exists = true;

  while (exists) {
    nickname = getRandomNickname();
    const user = await User.findOne({ where: { nickname } });
    if (!user) {
      exists = false;
    }
  }

  return nickname;
}

module.exports = (pool) => ({
  googleCallback: async (req, res) => {
    try {
      if (req.user) {
        const user = await User.findByPk(req.user.id);
        if (user.role === "admin") {
          res.redirect(`${process.env.REACT_APP_API_URL}/admin`);
        } else {
          res.redirect(process.env.REACT_APP_API_URL);
        }
      }
    } catch (error) {
      console.error("Google callback error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err });
      }
      res.clearCookie("connect.sid"); // 세션 쿠키 제거
      res.status(200).json({ message: "Logged out successfully" });
    });
  },

  getUser: (req, res) => {
    console.time("Get user info"); //이거
    if (req.user) {
      res.json(req.user);
    } // else {
    //   res.status(401).json({ error: "Not authenticated" });
    // }
    console.timeEnd("Get user info"); //이거
  },

  getUserById: async (id) => {
    console.time("Get user by ID from DB"); //이거
    const [rows] = await pool.query("SELECT * FROM user WHERE id = ?", [id]);
    console.timeEnd("Get user by ID from DB"); //이거
    return rows[0] || null;
  },

  findOrCreateUser: async (profile) => {
    console.time("Find or create user"); //이거
    // 1. social_id로 사용자를 찾습니다.
    const user = await User.findOne({
      where: { social_id: profile.id },
    });

    // 2. 사용자가 이미 있으면 그 사용자를 반환합니다.
    if (user) {
      console.log("User found:", user); //이거
      await user.update({ last_login_at: new Date() });
      console.timeEnd("Find or create user"); //이거
      return user;
    }

    const uniqueNickname = await generateUniqueNickname(); // 랜덤 닉네임 생성

    // 3. 사용자가 없으면 새로 생성합니다.
    const newUser = await User.create({
      social_id: profile.id,
      social_type: "google", // 소셜 타입 추가
      email: profile.emails[0].value,
      nickname: uniqueNickname, // 랜덤 닉네임 설정
      job: "", // 직업 필드 추가
      role: "user", // 역할 필드 추가
      profile_image: profile.photos[0].value,
    });

    // 4. 새로 생성된 사용자를 반환합니다.
    await newUser.update({ last_login_at: new Date() });
    console.timeEnd("Find or create user"); //이거
    return newUser;
  },

  // 사용자 정보 업데이트 함수
  updateUser: async (req, res) => {
    try {
      const { id, nickname, job, profile_image } = req.body;

      // 사용자 찾기
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 닉네임 중복 확인 (현재 사용자의 닉네임은 제외)
      const existingUser = await User.findOne({
        where: {
          nickname,
          id: { [Op.ne]: id }, // 현재 사용자 ID는 제외
        },
        paranoid: false, // 소프트 삭제된 사용자도 포함
      });
      if (existingUser) {
        return res.status(400).json({ message: "Nickname already exists" });
      }

      // 사용자 정보 업데이트
      await user.update({
        nickname,
        job,
        profile_image,
      });

      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //MyPage-room 활동 내역
  getUserRoomHistory: async (req, res) => {
    try {
      console.log("getUserRoomHistory 함수 시작");
      const userId = req.user?.id; // 인증된 사용자의 ID

      console.log("User ID:", userId);

      if (!userId) {
        console.log("사용자 인증 실패");
        return res
          .status(401)
          .json({ message: "Unauthorized: User not authenticated" });
      }

      console.log("Member.findAll 쿼리 시작");
      const roomHistory = await Member.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Room,
            attributes: ["id", "title", "type", "createdAt"],
            include: [
              {
                model: Member, // Room에 속한 Member들을 포함해서 조회
                attributes: ["id"],
                paranoid: false, // 소프트 삭제된 멤버들도 조회
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 10, // 최대 10개의 결과만 가져옴
        paranoid: false, // 소프트 삭제된 Member도 포함해서 조회
      });
      console.log("Member.findAll 쿼리 완료");
      console.log("roomHistory 길이:", roomHistory.length);

      // 조회된 데이터를 프론트엔드에 적합한 형식으로 가공
      console.log("데이터 가공 시작");
      const formattedHistory = roomHistory.map((member) => {
        console.log("Room 정보:", member.Room);
        return {
          title: member.Room.title,
          type: member.Room.type === "chat" ? "베리톡" : "베리보드",
          participants: member.Room.Members.length,
          date: member.Room.createdAt.toISOString().split("T")[0],
          entryTime: member.createdAt.toISOString().split("T")[1].substr(0, 5),
        };
      });
      console.log("데이터 가공 완료");
      console.log("formattedHistory 길이:", formattedHistory.length);

      // 가공된 데이터를 JSON 형식으로 응답
      res.json(formattedHistory);
      console.log("응답 전송 완료");
    } catch (error) {
      console.error("Error fetching user room history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
});
