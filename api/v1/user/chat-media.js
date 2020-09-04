
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import {uploadChatMedia} from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });
import { checkToken } from "../../../utilities/universal";
/**
 * @swagger
 * /api/v1/chatMedia:
 *  post:
 *   tags: ["User"]
 *   summary: upload chat file or document
 *   description: upload chat file or document
 *   parameters:
 *      - in: header
 *        name: authorization
 *      - in: body
 *        name: upload chat file or document
 *        description: upload chat file or document
 *        schema:
 *         type: object
 *         required:
 *          - user feature
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */

app.post(
  "/chatMedia",
  checkToken,
  uploadChatMedia
);

export default app;
