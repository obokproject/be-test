// const { expect } = require('chai');
// const { Sequelize } = require('sequelize');
// const sinon = require('sinon');

// // 가정: 유효성 검사 함수들이 utils/validators.js에 정의되어 있음
// const { validateEmail, validatePassword } = require('../utils/validators');

// // 가정: User 모델이 models/user.js에 정의되어 있음
// const User = require('../models/user');

// describe('Validators', () => {
//   describe('validateEmail', () => {
//     it('should return true for valid email addresses', () => {
//       expect(validateEmail('test@example.com')).to.be.true;
//       expect(validateEmail('user.name+tag@domain.co.uk')).to.be.true;
//     });

//     it('should return false for invalid email addresses', () => {
//       expect(validateEmail('invalid-email')).to.be.false;
//       expect(validateEmail('missing@domain')).to.be.false;
//       expect(validateEmail('@nocallserver.com')).to.be.false;
//       expect(validateEmail('user@.com')).to.be.false;
//     });
//   });

//   describe('validatePassword', () => {
//     it('should return true for valid passwords', () => {
//       expect(validatePassword('StrongP@ss1')).to.be.true;
//       expect(validatePassword('C0mplex!Pass')).to.be.true;
//     });

//     it('should return false for invalid passwords', () => {
//       expect(validatePassword('weak')).to.be.false; // 너무 짧음
//       expect(validatePassword('onlylowercase')).to.be.false; // 대문자 없음
//       expect(validatePassword('ONLYUPPERCASE')).to.be.false; // 소문자 없음
//       expect(validatePassword('NoNumbers!')).to.be.false; // 숫자 없음
//       expect(validatePassword('NoSpecial1')).to.be.false; // 특수문자 없음
//     });
//   });

//   describe('User model validation', () => {
//     let sequelize;

//     before(async () => {
//       // 테스트용 인메모리 SQLite 데이터베이스 설정
//       sequelize = new Sequelize('sqlite::memory:');
//       User.init(User.attributes, { sequelize });
//       await sequelize.sync();
//     });

//     it('should not allow duplicate emails', async () => {
//       await User.create({ email: 'test@example.com', password: 'ValidPass1!' });

//       try {
//         await User.create({ email: 'test@example.com', password: 'AnotherValidPass2!' });
//         expect.fail('Should not allow duplicate email');
//       } catch (error) {
//         expect(error.name).to.equal('SequelizeUniqueConstraintError');
//       }
//     });

//     it('should enforce email format in the model', async () => {
//       try {
//         await User.create({ email: 'invalid-email', password: 'ValidPass1!' });
//         expect.fail('Should not allow invalid email format');
//       } catch (error) {
//         expect(error.name).to.equal('SequelizeValidationError');
//       }
//     });

//     after(async () => {
//       await sequelize.close();
//     });
//   });
// });
