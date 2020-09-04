
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import {login} from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });

/**
 * @swagger
 * /api/v1/login:
 *  post:
 *   tags: ["User"]
 *   summary: Login api for professional/client
 *   description: Professional / Client login
 *   parameters:
 *      - in: body
 *        name: user
 *        description: The user to create.
 *        schema:
 *         type: object
 *         required:
 *          - user register
 *         properties:
 *           email:
 *             type: string
 *             required: 
 *           password:
 *             type: string
 *             required:
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */
 
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .label("Email"),
  password: Joi.string()
   .required()
    .label("Password")
});

app.post(
  "/login",
  validator.body(loginSchema, {
    joi: { convert: true, allowUnknown: false }
  }),
  login
);

export default app;
