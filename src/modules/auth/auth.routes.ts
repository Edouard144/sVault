import { Router } from "express";
import { sendOtp, verifyOtp, refreshToken, logout } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from "./auth.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Parent authentication via OTP
 */

/**
 * @swagger
 * /auth/parent/send-otp:
 *   post:
 *     summary: Send OTP to parent phone number
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+250788123456"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       422:
 *         description: Validation error
 *       500:
 *         description: Failed to send OTP
 */
router.post("/parent/send-otp", validate(sendOtpSchema), sendOtp);

/**
 * @swagger
 * /auth/parent/verify-otp:
 *   post:
 *     summary: Verify OTP and login or register parent
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+250788123456"
 *               otp:
 *                 type: string
 *                 example: "432891"
 *               fullName:
 *                 type: string
 *                 example: "MUHIRE Jean Claude"
 *                 description: Required only on first registration
 *               fcmToken:
 *                 type: string
 *                 description: Firebase push notification token
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken + refreshToken
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: Account frozen
 */
router.post("/parent/verify-otp", validate(verifyOtpSchema), verifyOtp);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access and refresh tokens returned
 *       401:
 *         description: Invalid or reused refresh token
 */
router.post("/refresh", validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout parent and invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware, logout);

export default router;
