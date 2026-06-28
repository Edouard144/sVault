import swaggerJsdoc from "swagger-jsdoc";
const spec = swaggerJsdoc.default ? swaggerJsdoc.default({
  definition: {
    openapi: "3.0.0",
    info: { title: "SVault API", version: "1.0.0", description: "" },
    servers: [{ url: "http://localhost:3000/api/v1" }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        AdminKey: { type: "apiKey", in: "header", name: "x-admin-key" },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.routes.ts"],
}) : swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "SVault API", version: "1.0.0", description: "" },
    servers: [{ url: "http://localhost:3000/api/v1" }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        AdminKey: { type: "apiKey", in: "header", name: "x-admin-key" },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.routes.ts"],
});

const paths = Object.keys(spec.paths).sort();
console.log("=== Endpoints:", paths.length);
paths.forEach(p => console.log(p));
