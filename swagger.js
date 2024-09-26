const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "API documentation for the project.",
    },
    servers: [
      {
        url: "http://localhost:5000", // 기본 서버 URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // API 주석을 포함한 라우트 파일 경로
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
