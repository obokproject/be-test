// tests/user.test.js

const request = require("supertest");
const app = require("../app"); // Express 앱 인스턴스
const { User } = require("../models"); // Sequelize User 모델
const { generateToken } = require("../utils/auth"); // JWT 토큰 생성 함수

describe("User API", () => {
  // 각 테스트 전에 실행될 설정
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await User.destroy({ where: {}, force: true });
  });

  // 구글 로그인 API 테스트
  describe("POST /api/auth/google", () => {
    it("유효한 구글 토큰으로 로그인 또는 회원가입해야 한다", async () => {
      // 구글 OAuth 검증 로직은 모의 처리 필요
      const mockGoogleToken = "valid_google_token";
      const mockGoogleProfile = {
        sub: "12345", // Google의 unique ID
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/profile.jpg",
      };

      // 구글 OAuth 검증 모의 함수
      jest.spyOn(global, "fetch").mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockGoogleProfile),
        ok: true,
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ token: mockGoogleToken });

      // 응답 상태 코드가 200(OK)인지 확인
      expect(res.statusCode).toBe(200);
      // JWT 토큰이 반환되었는지 확인
      expect(res.body).toHaveProperty("token");
      // 사용자 정보가 반환되었는지 확인
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.social_type).toBe("google");
      expect(res.body.user.social_id).toBe("12345");
      expect(res.body.user.nickname).toBeTruthy();
      expect(res.body.user.profile_image).toBe(
        "https://example.com/profile.jpg"
      );

      // 데이터베이스에 사용자가 저장되었는지 확인
      const savedUser = await User.findOne({
        where: { email: "test@example.com" },
      });
      expect(savedUser).toBeTruthy();
    });

    it("잘못된 구글 토큰으로 로그인 시 에러를 반환해야 한다", async () => {
      const invalidGoogleToken = "invalid_token";

      // 구글 OAuth 검증 실패 모의
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 401,
      });

      const res = await request(app)
        .post("/api/auth/google")
        .send({ token: invalidGoogleToken });

      // 응답 상태 코드가 401(Unauthorized)인지 확인
      expect(res.statusCode).toBe(401);
      // 에러 메시지 확인
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Invalid Google token");
    });
  });

  // 사용자 프로필 조회 API 테스트
  describe("GET /api/users/profile", () => {
    it("인증된 사용자의 프로필을 조회해야 한다", async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        social_id: "12345",
        social_type: "google",
        email: "profile@example.com",
        nickname: "Profile User",
        profile_image: "https://example.com/profile.jpg",
        role: "user",
      });

      const token = generateToken(user); // JWT 토큰 생성

      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${token}`);

      // 응답 상태 코드가 200(OK)인지 확인
      expect(res.statusCode).toBe(200);
      // 반환된 프로필 정보 확인
      expect(res.body.email).toBe("profile@example.com");
      expect(res.body.nickname).toBe("Profile User");
      expect(res.body.profile_image).toBe("https://example.com/profile.jpg");
      expect(res.body).not.toHaveProperty("social_id"); // 민감한 정보는 제외
    });

    it("인증되지 않은 요청은 거부해야 한다", async () => {
      const res = await request(app).get("/api/users/profile");

      // 응답 상태 코드가 401(Unauthorized)인지 확인
      expect(res.statusCode).toBe(401);
    });
  });

  // 프로필 업데이트 API 테스트
  describe("PUT /api/users/profile", () => {
    it("인증된 사용자의 프로필을 업데이트해야 한다", async () => {
      // 테스트용 사용자 생성
      const user = await User.create({
        social_id: "12345",
        social_type: "google",
        email: "update@example.com",
        nickname: "Update User",
        profile_image: "https://example.com/old_profile.jpg",
        role: "user",
      });

      const token = generateToken(user); // JWT 토큰 생성

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nickname: "Updated Nickname",
          profile_image: "https://example.com/new_profile.jpg",
        });

      // 응답 상태 코드가 200(OK)인지 확인
      expect(res.statusCode).toBe(200);
      // 업데이트된 프로필 정보 확인
      expect(res.body.nickname).toBe("Updated Nickname");
      expect(res.body.profile_image).toBe(
        "https://example.com/new_profile.jpg"
      );

      // 데이터베이스에서 업데이트 확인
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.nickname).toBe("Updated Nickname");
      expect(updatedUser.profile_image).toBe(
        "https://example.com/new_profile.jpg"
      );
    });
  });

  // 테스트 종료 후 정리
  afterAll(async () => {
    await User.sequelize.close(); // Sequelize 연결 종료
  });
});
