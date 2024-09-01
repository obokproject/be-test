// const express = require('express');
// const morgan = require('morgan');
// const request = require('supertest');
// const { expect } = require('chai');
// const sinon = require('sinon');

// describe('Logger (Morgan)', () => {
//   let app;
//   let logSpy;

//   beforeEach(() => {
//     app = express();

//     // 로그 출력을 캡처하기 위한 스파이 생성
//     logSpy = sinon.spy();

//     // morgan 미들웨어 설정 (스트림 옵션 사용)
//     app.use(morgan('combined', { stream: { write: logSpy } }));

//     // 테스트용 라우트
//     app.get('/test', (req, res) => {
//       res.status(200).send('Test route');
//     });
//   });

//   it('should log HTTP requests', async () => {
//     await request(app).get('/test');

//     // morgan이 로그를 출력했는지 확인
//     expect(logSpy.calledOnce).to.be.true;

//     // 로그 내용 확인
//     const logMessage = logSpy.firstCall.args[0];
//     expect(logMessage).to.include('GET /test');
//     expect(logMessage).to.include('200'); // 상태 코드
//   });

//   it('should log 404 errors', async () => {
//     await request(app).get('/nonexistent');

//     expect(logSpy.calledOnce).to.be.true;

//     const logMessage = logSpy.firstCall.args[0];
//     expect(logMessage).to.include('GET /nonexistent');
//     expect(logMessage).to.include('404'); // 상태 코드
//   });

//   it('should include response time in logs', async () => {
//     await request(app).get('/test');

//     const logMessage = logSpy.firstCall.args[0];
//     // 응답 시간이 포함되어 있는지 확인
//     expect(logMessage).to.match(/\d+\.\d+ms/);
//   });
// });
