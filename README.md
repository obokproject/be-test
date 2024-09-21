# Razvery - 프론트엔드

"Razvery"는 실시간으로 아이디어를 공유하는 서비스입니다. 제한 시간이 있는 채팅과 포스트잇 보드 형태가 핵심 기능입니다.
<br>
관리자 백오피스 구축으로 직관적인 대시보드로 핵심 지표 실시간 모니터링이 가능하여 사용자 관리가 용이합니다.
<br>

## 팀 소개

- 기획팀: 김상윤, 윤상수
- 개발팀: 박초롱, 변윤석
  <br>

## 프로젝트 기획

- 기능정의서<br>
- 유저저니맵, 페르소나<br>
- 화면흐름도<br>
  <br>

## 기술 스택 및 라이브러리

- Express.js <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white">
- MySQL <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">

## AWS 배포

url: [Razvery 🍓](https://razvery.link/)<br>

```mermaid
graph LR
    User((사용자)) --> Route53[Route 53]
    Route53 --> CloudFront[CloudFront]
    CloudFront --> ALB[ALB]
    ALB --> EC2[EC2 Nginx+PM2]
    EC2 --> S3[(S3 Bucket)]
    ACM[ACM] --> CloudFront
    ACM --> ALB
    GitHub[GitHub] --> |Actions| S3
    GitHub --> |Actions| EC2
    GitHub --> |Actions| RDS[(Amazon RDS)]
    MySQL[(MySQL)] --> |Migration| RDS
    CloudWatch[Amazon CloudWatch] --> |Monitoring| CloudFront
    CloudWatch --> |Monitoring| ALB
    CloudWatch --> |Monitoring| EC2
    CloudWatch --> |Monitoring| S3
    CloudWatch --> |Monitoring| RDS
```

GitHub에서 Action/PM2로 코드 푸시 및 배포<br>
CloudFront는 ACM의 SSL 인증서를 사용해 HTTPS 연결을 제공<br>
MySQL에서 Action/PM2를 통해 데이터 마이그레이션<br>
Action/PM2에서 프론트엔드 파일을 S3 Bucket으로 배포<br>
Action/PM2에서 백엔드 코드를 EC2로 배포<br>
Action/PM2에서 데이터베이스 스키마 및 데이터를 Amazon RDS로 마이그레이션<br>
Amazon CloudWatch를 사용하여 전체 시스템 모니터링<br>

<br>

## WBS

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

## 폴더 구조

```bash
server/
├── github/ # GitHub 관련 설정. CI/CD 워크플로우
├── src/
│   ├── config/  # 애플리케이션 설정 파일
│   ├── controllers/    # 요청 처리 및 응답 로직
│   ├── middlewares/    # 미들웨어 함수들
│   ├── models/     # 데이터베이스 모델 및 스키마
│   ├── routes/     # API 라우트 정의
│   ├── passports/  # 인증전략
│   └── utils/      # logger, validator
├── tests/      # 테스트 파일 (TDD를 위한)
├── package.json
└── server.js
```

<br>

## 페이지 및 URL 구조

| 페이지      | URL             | 설명                                       | 주요 기능                                              |
| ----------- | --------------- | ------------------------------------------ | ------------------------------------------------------ |
| LandingPage | /               | 웹사이트의 메인 페이지, 로그인 및 입장하기 | - 서비스 소개<br>- 시작하기 버튼<br>- FAQ              |
| MainPage    | /main           | 로그인 후 메인 대시보드                    | - 사용자의 방 목록<br>- 새 방 만들기                   |
| ChatBoard   | /chat/:roomId   | 베리 톡(채팅방) 페이지                     | - 실시간 채팅<br>- 키워드 표시                         |
| KanbanBoard | /kanban/:roomId | 베리 보드(포스트잇) 페이지                 | - 섹션 별 카드<br>- 드래그 앤 드롭                     |
| MyPage      | /mypage         | 사용자 개인 정보 및 설정 페이지            | - 프로필 수정<br>- 활동 내역 확인                      |
| AboutPage   | /about          | 서비스 소개 및 정보 페이지                 | - 서비스 소개                                          |
| AdminPage   | /admin          | 관리자 페이지                              | - 유저 조회 및 소프트 삭제 <br>- 월별 사용자 유입 통계 |

<br>

## 클래스 다이어그램

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
    class Keyword {
        +int id
        +int room_id
        +string keyword
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
    class Kanban {
        +int id
        +int room_id
        +int user_id
        +string section
    }
    class Content {
        +int id
        +int room_id
        +int kanban_id
        +int user_id
        +string content
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

## ERD

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

<br>

## 트러블 슈팅

- 실시간 양방향 통신: Socket.io를 사용한 실시간 업데이트 구현
- 보안 HTTPS 적용하고 싶었으나 SSL인증서를 발급받지 못했지만 Route53을 시도해 보았음

  <br>

## 회고

<br>
<br>
<br>
````
