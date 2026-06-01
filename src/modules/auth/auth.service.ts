import twilio from "twilio";
import { eq, and } from "drizzle-orm";
import { db } from "../../config/db";
import { otps, parents } from "../../db/schema/index";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  isOtpExpired,
} from "../../utils/otp";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/token";
import { AppError } from "../../middleware/error.middleware";
import type { SendOtpInput, VerifyOtpInput, RefreshTokenInput } from "./auth.schema";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const sendOtpService = async (input: SendOtpInput) => {
  const { phone } = input;

  const plainOtp = generateOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const expiresAt = getOtpExpiry();

  await db
    .update(otps)
    .set({ isUsed: true })
    .where(and(eq(otps.phone, phone), eq(otps.isUsed, false)));

  await db.insert(otps).values({
    phone,
    otpHash: hashedOtp,
    expiresAt,
  });

  await twilioClient.messages.create({
    body: `Your SVault verification code is: ${plainOtp}. Valid for ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] OTP for ${phone}: ${plainOtp}`);
  }

  return { message: "OTP sent successfully" };
};

export const verifyOtpService = async (input: VerifyOtpInput) => {
  const { phone, otp, fullName, fcmToken } = input;

  const otpRecord = await db.query.otps.findFirst({
    where: and(eq(otps.phone, phone), eq(otps.isUsed, false)),
    orderBy: (otps, { desc }) => [desc(otps.createdAt)],
  });

  if (!otpRecord) {
    throw new AppError("No active OTP found for this phone number", 400);
  }

  if (isOtpExpired(otpRecord.expiresAt)) {
    throw new AppError("OTP has expired. Please request a new one", 400);
  }

  const isValid = await verifyOtp(otp, otpRecord.otpHash);
  if (!isValid) {
    throw new AppError("Invalid OTP", 400);
  }

  await db
    .update(otps)
    .set({ isUsed: true })
    .where(eq(otps.id, otpRecord.id));

  let parent = await db.query.parents.findFirst({
    where: eq(parents.phone, phone),
  });

  if (!parent) {
    if (!fullName) {
      throw new AppError(
        "Full name is required for first time registration",
        400
      );
    }

    const [newParent] = await db
      .insert(parents)
      .values({
        phone,
        fullName,
        fcmToken: fcmToken || null,
      })
      .returning();

    parent = newParent;
  } else {
    if (fcmToken && fcmToken !== parent.fcmToken) {
      await db
        .update(parents)
        .set({ fcmToken, updatedAt: new Date() })
        .where(eq(parents.id, parent.id));
    }

    if (parent.isFrozen) {
      throw new AppError("Your account has been frozen. Contact support.", 403);
    }
  }

  const tokenPayload = { parentId: parent.id, phone: parent.phone };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  await db
    .update(parents)
    .set({ refreshToken, updatedAt: new Date() })
    .where(eq(parents.id, parent.id));

  return {
    accessToken,
    refreshToken,
    parent: {
      id: parent.id,
      fullName: parent.fullName,
      phone: parent.phone,
    },
  };
};

export const refreshTokenService = async (input: RefreshTokenInput) => {
  const { refreshToken } = input;

  const payload = verifyRefreshToken(refreshToken);

  const parent = await db.query.parents.findFirst({
    where: eq(parents.id, payload.parentId),
  });

  if (!parent) {
    throw new AppError("Parent not found", 404);
  }

  if (parent.refreshToken !== refreshToken) {
    await db
      .update(parents)
      .set({ refreshToken: null, updatedAt: new Date() })
      .where(eq(parents.id, parent.id));
    throw new AppError(
      "Refresh token reuse detected. Please login again.",
      401
    );
  }

  if (parent.isFrozen) {
    throw new AppError("Account is frozen", 403);
  }

  const tokenPayload = { parentId: parent.id, phone: parent.phone };
  const newAccessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken(tokenPayload);

  await db
    .update(parents)
    .set({ refreshToken: newRefreshToken, updatedAt: new Date() })
    .where(eq(parents.id, parent.id));

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutService = async (parentId: string) => {
  await db
    .update(parents)
    .set({ refreshToken: null, updatedAt: new Date() })
    .where(eq(parents.id, parentId));

  return { message: "Logged out successfully" };
};
