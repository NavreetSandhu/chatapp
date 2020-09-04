
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import {getChatMessages} from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });
import { checkToken } from "../../../utilities/universal";
/**
 * @swagger
 * /api/v1/chatMessage:
 *  post:
 *   tags: ["User"]
 *   summary: get chat messages
 *   description: get chat messages
 *   parameters:
 *      - in: header
 *        name: authorization
 *      - in: body
 *        name: get chat messages
 *        description: get chat messages
 *        schema:
 *         type: object
 *         required:
 *          - user feature
 *         properties:
 *           pageNumber:
 *             type: integer
 *           roomId:
 *             type: integer
 *             required:

 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */
const msgSchema = Joi.object({
  roomId: Joi.number()
   .required()
    .label("roomId"),
  pageNumber: Joi.number()
    .label("Page Number")

});
app.post(
  "/chatMessage",
  validator.body(msgSchema, {
    joi: { convert: true, allowUnknown: false }
  }),
  checkToken,
  getChatMessages
);

export default app;
