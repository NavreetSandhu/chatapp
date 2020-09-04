
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import {getAllContact} from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });
import { checkToken } from "../../../utilities/universal";
/**
 * @swagger
 * /api/v1/contact:
 *  post:
 *   tags: ["User"]
 *   summary: fetch chat contacts
 *   description: chat contacts
 *   parameters:
 *      - in: header
 *        name: authorization
 *      - in: body
 *        name: chat contacts
 *        description: chat contacts
 *        schema:
 *         type: object
 *         required:
 *          - user feature
 *         properties:
 *           pageNumber:
 *             type: integer
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */
// const schema = Joi.object({
//   userId: Joi.number()
//    .required()
//     .label("UserId"),
//   pageNumber: Joi.number()
//     .label("Page Number")

// });
app.post(
  "/contact",
  // validator.body(schema, {
  //   joi: { convert: true, allowUnknown: false }
  // }),
  checkToken,
  getAllContact
);

export default app;
