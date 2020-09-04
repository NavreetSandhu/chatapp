
import express from "express";
import { createValidator } from "express-joi-validation";
import Joi from "@hapi/joi";
import { addUser} from "../../../controllers/user";
const app = express();
const validator = createValidator({ passError: true });
/**
 * @swagger
 * /api/v1/signup:
 *  post:
 *   tags: ["User"]
 *   summary: Register api for professional/client
 *   description: Register professional and client <br/> <b>Note:-</b> <br/> <b>role</b> should be one of 1 => Professional, 2=> Client
 *   parameters:
 *      - in: body
 *        name: user
 *        description: save user and user detail
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
 *           firstName:
 *             type: string
 *             required:
 *           lastName:
 *             type: string
 *             required:
 *           gender:
 *             type: string
 *           address:
 *             type: string
 *             required:
 *           currency:
 *             type: string
 *           dob:
 *             type: string
 *           role:
 *             type: integer
 *             required:
 *           enquiry:
 *             type: string
 *           lat:
 *             type: string
 *           long:
 *             type: string
 *           priceMax:
 *             type: integer
 *           priceMin:
 *             type: integer
 *           profilePic: 
 *             type: string
 *           radius:
 *             type: integer
 *           skills:
 *             type: array
 *             items:
 *              type: integer
 *             required:
 *           title:
 *             type: string
 *           activityStatus:
 *             type: string
 *   responses:
 *    '200':
 *      description: success
 *    '400':
 *      description: fail
 */
// const userSchema = Joi.object({
//   firstName: Joi.string()
//     .required()
//     .label("FirstName"),
//   lastName: Joi.string()
//     .required()
//     .label("LastName"),
//   password: Joi.string()
//    .required()
//     .label("Password"),
//   email: Joi.string()
//     .email()
//     .required()
//     .label("Email"),
//   role: Joi.number()
//     .required()
//     .valid(1,2)
//     .label("Role"),
//   address: Joi.string()
//     .required()
//     .label("address")
// });
app.post(
  "/signup",
  // validator.body(userSchema, {
  //   joi: { convert: true, allowUnknown: false }
  // }),
  addUser
);
export default app;
