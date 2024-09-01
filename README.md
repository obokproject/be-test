# obok team's project

"Razvery"<br>
<br>
단순 브레인스토밍을 떠나 마인드맵의 시각화, 만다라트 등 다양한 아이디어를 분야별 사람들 또는 새로운 영역의 아이디어를 실시간 공유하는 서비스.
참여자들은 닉네임(XXX[분야선택], XXX개발자)을 통해 자신의 전문분야를 바탕으로 주제에서 비롯한 다양한 생각을 호스트와 함께 참여한 유저간 공유한다. <br>
실시간 협업을 통해 즉시 문제를 처리하여 보다 빠른 Ideation이 가능하다.
또한 제한시간으로 인해 길어지는 불필요한 시간의 연장을 차단한다. 나아가 호스트는 제시한 내용을 바탕으로 팀웍등을 원할시 참여했던 유저에게 요청으로 통해 추가업무가 가능하다. 현재 구현할 서비스의 핵심기능은 브레인스토밍채팅과 보드 형태이다.<br>
<br>
ex) "커피업체의 친환경 제품"라는 주제로 한다면, 사용자들([학생], [물리학자], [IT개발자], [바리스타]등)은 각자 아이디어를 입력하고, 다른 사람들과 실시간으로 토론, 또는 키워드를 입력하며발전시킬 수 있음. AI를 접목시킨다면 관련된 최신 기술 트렌드나 기존 제품 사례를 제공해주고, 사용자는 이를 참고해 아이디어를 구체화할 수 있음.
<br>

# 팀에 대한 설명

기획팀: 김상윤, 윤상수<br>
개발팀: 박초롱, 변윤석<br>
<br>

# 프로젝트 기획

<br>
<br>

# 기술 스택 및 라이브러리, 개발 환경

1. Frontend
   React <br>
   -TailwindCSS, Bootstrap<br>
2. Backend
   Express.js<br>
3. Database
   MySQL<br>
   <br>

# AWS 배포

url:<br>

```mermaid
graph LR
    A[GitHub] --> B[Action/PM2]
    C[MS SQL] --> B
    B --> D[Amazon S3 Bucket]
    B --> E[EC2]
    B --> F[Amazon RDS]
    G[Amazon CloudWatch]

    subgraph AWS Cloud
        B
        D
        E
        F
        G
    end
```

GitHub에서 Action/PM2로 코드 푸시 및 배포<br>
MS SQL에서 Action/PM2를 통해 데이터 마이그레이션<br>
Action/PM2에서 프론트엔드 파일을 S3 Bucket으로 배포<br>
Action/PM2에서 백엔드 코드를 EC2로 배포<br>
Action/PM2에서 데이터베이스 스키마 및 데이터를 Amazon RDS로 마이그레이션<br>
Amazon CloudWatch를 사용하여 전체 시스템 모니터링<br>

<br>

# WBS

```mermaid
gantt
title 프로젝트 일정
dateFormat  YYYY-MM-DD

section 프로젝트관리
팀빌딩과 아이디어 도출 :a1, 2024-07-22, 5d
Kick-off Meeting     :a2, 2024-07-29, 5d

section 기획
아이데이션    :2024-08-01, 4d
린캔버스 :2024-08-04, 6d
경쟁사 분석 :2024-08-07, 2d
페르소나 유저저니맵 : 2024-08-07, 2d
정보구조도(IA) 작성 :2024-08-09, 1d
기능정의서 : 2024-08-010, 3d
정책정의서, 프로우차트 작성 : 2024-08-11, 6d
와이어프레임(화면 스케치) : 2024-08-16, 6d
와이어프레임(추가기획) 화면 확정 : 2024-08-21, 5d
프로토타입 및 중간발표: 2024-08-26, 5d
UI 디자인 : 2024-09-01, 5d

section QA
QA 계획수립 : 2024-09-04, 2d
작성 및 환경설정 :2024-09-05, 2d
시장 반응 테스트 :  2024-09-06, 2d
최종검토 및 릴리즈 : 2024-09-07, 2d

section 개발-아키텍처 설계
기술 스택 확정 :2024-08-16, 1d
구조 설계 :2024-08-19, 1d
개발 환경 설정 :2024-08-19, 1d

section 개발-백엔드
Express.js 서버 설정 :2024-08-20, 1d
데이터베이스 스키마 설계 :2024-08-20, 3d
소셜 로그인 구현 :2024-08-20, 3d
사용자 인증 및 세션 관리 :2024-08-20, 4d
채팅 기능 API 개발 :2024-08-22, 9d
칸반 보드 API 개발 :2024-08-29, 7d
Landingpage API 개발 :2024-08-25, 4d
Mainpage API 개발 :2024-08-25, 6d

section 개발-프론트엔드
React 초기 설정 :2024-08-20, 1d
component 구조 설계 :2024-08-20, 1d
component (Header,Footer,Modal) :2024-08-20, 2d
component(board관련) :2024-08-20, 2d
LoginModal 및 소셜 로그인 :2024-08-20, 3d
LandingPage interface :2024-08-26, 3d
ChatBoard interface(#keyword) :2024-08-22, 5d
MainPage interface :2024-08-26, 5d
KanbanBoard interface(section) :2024-08-29, 7d
UI/UX디자인 적용 및 최적화 :2024-08-29, 8d

section 통합 및 테스트
be-fe 통합 :2024-09-02, 4d
unit test 단위테스트 :2024-09-03, 4d
intergration test 통합테스트 :2024-09-07, 4d
성능 최적화 :2024-09-09, 2d

section 배포준비
AWS EC2, S3, RDS 설정 :2024-08-21, 1d
CI/CD 파이프라인 구축 :2024-08-22, 1d
Migration :2024-09-12, 2d

section 배포
스테이징 환경 배포 및 테스트 :2024-09-19, 2d
프로덕션 환경 배포 :2024-09-19, 2d
모니터링 도구 설정 및 로그 분석 :2024-09-19, 2d

section 추가구현
마이페이지 :2024-09-20, 4d
관리자페이지 :2024-09-20, 4d

section 마무리
문서화 (API 문서, 사용자 가이드) :2024-09-24, 2d
코드 리팩토링 :2024-09-24, 2d
프로젝트 회고 :2024-09-25, 1d
시현 및 발표준비 :2024-09-26, 2d
최종 발표 :milestone, 2024-09-30, 0d
```

<br>

# 폴더 구조

```bash
client/
├── public/
│   ├── images/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── CreateRoomModal.tsx
│   │   ├── ChatKeyword.tsx
│   │   ├── ChatbotButton.tsx
│   │   ├── MemberList.tsx
│   │   ├── RoomInfo.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── LoginModal.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRoom.ts
│   │   └── useForm.ts
│   ├── pages/
│   │   ├── chatboard/
│   │   │   ├── ChatBoard.tsx
│   │   │   └── index.tsx
│   │   ├── about/
│   │   │   ├── AboutPage.tsx
│   │   │   └── index.tsx
│   │   ├── mypage/
│   │   │   ├── MyPage.tsx
│   │   │   └── index.tsx
│   │   ├── kanbanboard/
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── index.tsx
│   │   ├── landingpage/
│   │   │   ├── LandingPage.tsx
│   │   │   └── index.tsx
│   │   └── mainpage/
│   │       ├── MainPage.tsx
│   │       └── index.tsx
│   ├── styles/
│   │   └── tailwind.css
│   ├── App.tsx
│   ├── index.css
│   └── index.tsx
├── package.json
└── tsconfig.json

server/
├── src/
│   ├── config/
│   │   └── config.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── roomController.js
│   │   └── chatController.js
│   ├── middlewares/
│   │   └── index.js
│   ├── models/
│   │   ├── index.js
│   │   ├── chat.js
│   │   ├── content.js
│   │   ├── kanban.js
│   │   ├── keyword.js
│   │   ├── member.js
│   │   ├── chatkeyword.js
│   │   ├── room.js
│   │   └── user.js
│   ├── routes/
│   │   ├── authRoute.js
│   │   ├── roomRoute.js
│   │   └── chatRoute.js
│   ├── passports/
│   │   ├── index.js
│   │   └── googleStrategy.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validators.js
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .gitignore
├── package.json
└── server.js
```

<br>

# 페이지 구조

### LandingPage

- 설명: 웹사이트의 메인 페이지
- 주요 기능: 서비스 소개, 시작하기 버튼, FAQ

### MainPage

- 설명: 로그인 후 메인 대시보드
- 주요 기능: 사용자의 방 목록, 새 방 만들기

### ChatBoard

- 설명: 채팅 기능을 제공하는 페이지
- 주요 기능: 실시간 채팅, 키워드 표시

### KanbanBoard

- 설명: 칸반 보드 기능을 제공하는 페이지
- 주요 기능: 작업 항목 관리, 드래그 앤 드롭

### MyPage

- 설명: 사용자 개인 정보 및 설정 페이지
- 주요 기능: 프로필 수정, 활동 내역 확인

### AboutPage

- 설명: 서비스에 대한 상세 정보 페이지
- 주요 기능: 서비스 소개

<br>

# URL 구조

|
페이지  
|
URL  
|
설명  
|
|

---

## |

## |

|
|
LandingPage
|
/  
|
웹사이트 메인 페이지  
|
|
MainPage  
|
/main  
|
로그인 후 메인 대시보드  
|
|
ChatBoard  
|
/chat/:roomId  
|
특정 채팅방 페이지  
|
|
KanbanBoard
|
/kanban/:roomId  
|
특정 칸반 보드 페이지  
|
|
MyPage  
|
/mypage  
|
사용자 개인 정보 및 설정 페이지  
|
|
AboutPage  
|
/about  
|
서비스 소개 및 정보 페이지  
|

<br>

# 클래스 다이어그램

```mermaid
classDiagram
    class User {
        +int id
        +string social_id
        +enum social_type
        +string job
        +string email
        +string nickname
        +string profile_image
        +enum role
        +datetime last_login_at
    }
    class Room {
        +int id
        +char uuid
        +int user_id
        +string title
        +enum type
        +int max_member
        +int duration
        +enum status
    }
    class Chat {
        +int id
        +int room_id
        +int user_id
        +string content
    }
    class Chatkeyword {
        +int id
        +int room_id
        +string keyword
    }
    class Content {
        +int id
        +int room_id
        +int kanban_id
        +int user_id
        +string content
    }
    class Kanban {
        +int id
        +int room_id
        +int user_id
        +string section
    }
    class Keyword {
        +int id
        +int room_id
        +string keyword
    }
    class Member {
        +int id
        +int room_id
        +int user_id
        +enum role
    }

    User "1" -- "*" Room : creates
    User "1" -- "*" Member : participates
    User "1" -- "*" Chat : sends
    User "1" -- "*" Kanban : creates
    User "1" -- "*" Content : creates
    Room "1" -- "*" Keyword : has
    Room "1" -- "*" Member : includes
    Room "1" -- "*" Chat : contains
    Room "1" -- "*" Kanban : contains
    Room "1" -- "*" Content : contains
    Room "1" -- "*" Chatkeyword : has
    Kanban "1" -- "*" Content : contains
```

<br>

# ERD

```mermaid
erDiagram
    User ||--o{ Room : creates
    User ||--o{ Member : participates
    User ||--o{ Chat : sends
    User ||--o{ Kanban : creates
    User ||--o{ Content : creates
    Room ||--o{ Keyword : has
    Room ||--o{ Member : includes
    Room ||--o{ Chat : contains
    Room ||--o{ Kanban : contains
    Room ||--o{ Content : contains
    Room ||--o{ Chatkeyword : has
    Kanban ||--o{ Content : contains

    User {
        int id PK
        string social_id
        enum social_type
        string job
        string email
        string nickname
        string profile_image
        enum role
        datetime last_login_at
    }
    Room {
        int id PK
        char uuid
        int user_id FK
        string title
        enum type
        int max_member
        int duration
        enum status
    }
    Chat {
        int id PK
        int room_id FK
        int user_id FK
        string content
    }
    Chatkeyword {
        int id PK
        int room_id FK
        string keyword
    }
    Content {
        int id PK
        int room_id FK
        int kanban_id FK
        int user_id FK
        string content
    }
    Kanban {
        int id PK
        int room_id FK
        int user_id FK
        string section
    }
    Keyword {
        int id PK
        int room_id FK
        string keyword
    }
    Member {
        int id PK
        int room_id FK
        int user_id FK
        enum role
    }
```

# 트러블 슈팅

<br>

# 회고

<br>
<br>
<br>
