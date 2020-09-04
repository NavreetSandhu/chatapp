import swaggerJSDoc from "swagger-jsdoc"

// options for the swagger docs
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'chat application API',
      version: '1.0.0',
      description: 'APIs',
      servers: ["http://localhost:3300"],
    },
    produces: ["application/json"]
},
  // path to the API docs
  apis: ["./api/*/*/*.js"],

};
export default swaggerJSDoc(swaggerOptions)
