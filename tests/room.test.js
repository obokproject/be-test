// tests/room.test.js

const request = require("supertest");
const app = require("../app"); // Express 앱 인스턴스
const db = require("../db"); // 데이터베이스 연결

describe("Room API", () => {
  let authToken; // 인증된 사용자의 토큰

  // 각 테스트 전에 실행될 설정
  beforeAll(async () => {
    // 테스트용 사용자 생성 및 로그인
    await request(app).post("/api/users").send({
      email: "roomtest@example.com",
      name: "Room Test User",
      password: "password123",
    });

    const loginRes = await request(app).post("/api/users/login").send({
      email: "roomtest@example.com",
      password: "password123",
    });

    authToken = loginRes.body.token;
  });

  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await db.clearRooms();
  });

  // 방 생성 API 테스트
  describe("POST /api/rooms", () => {
    it("인증된 사용자가 새 방을 생성해야 한다", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Room",
          type: "chat",
          max_member: 5,
          duration: 60,
          keywords: ["test", "room"],
        });

      // 응답 상태 코드가 201(Created)인지 확인
      expect(res.statusCode).toBe(201);
      // 응답 본문에 생성된 방 정보가 포함되어 있는지 확인
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("Test Room");
      expect(res.body.type).toBe("chat");
      expect(res.body.max_member).toBe(5);
      expect(res.body.duration).toBe(60);
      expect(res.body.keywords).toEqual(["test", "room"]);
    });

    it("인증되지 않은 사용자의 방 생성 요청을 거부해야 한다", async () => {
      const res = await request(app)
        .post("/api/rooms")
        .send({
          title: "Unauthorized Room",
          type: "chat",
          max_member: 5,
          duration: 60,
          keywords: ["unauthorized"],
        });

      // 응답 상태 코드가 401(Unauthorized)인지 확인
      expect(res.statusCode).toBe(401);
    });
  });

  // 방 목록 조회 API 테스트
  describe("GET /api/rooms", () => {
    it("모든 방 목록을 반환해야 한다", async () => {
      // 테스트를 위해 몇 개의 방을 미리 생성
      await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Room 1",
          type: "chat",
          max_member: 5,
          duration: 60,
          keywords: ["test1"],
        });

      await request(app)
        .post("/api/rooms")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Room 2",
          type: "kanban",
          max_member: 10,
          duration: 120,
          keywords: ["test2"],
        });

      const res = await request(app).get("/api/rooms");

      // 응답 상태 코드가 200(OK)인지 확인
      expect(res.statusCode).toBe(200);
      // 응답이 배열인지 확인
      expect(Array.isArray(res.body)).toBeTruthy();
      // 생성한 방의 수만큼 목록이 반환되었는지 확인
      expect(res.body.length).toBe(2);
      // 반환된 방 정보 확인
      expect(res.body[0].title).toBe("Room 1");
      expect(res.body[1].title).toBe("Room 2");
    });
  });

  // 테스트 종료 후 정리
  afterAll(async () => {
    await db.close(); // 데이터베이스 연결 종료
  });
});
