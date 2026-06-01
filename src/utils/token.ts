import jwt from "jsonwebtoken";
import { AppError } from "../middleware/error.middleware";

export interface ParentTokenPayload {
  parentId: string;
  phone: string;
}

export interface StaffTokenPayload {
  staffId: string;
  schoolId: string;
  role: "staff" | "admin";
}

export const signAccessToken = (payload: ParentTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET! as jwt.Secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: ParentTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET! as jwt.Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): ParentTokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as ParentTokenPayload;
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const verifyRefreshToken = (token: string): ParentTokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as ParentTokenPayload;
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

export const signStaffToken = (payload: StaffTokenPayload): string => {
  return jwt.sign(payload, process.env.STAFF_JWT_SECRET! as jwt.Secret, {
    expiresIn: "12h",
  } as jwt.SignOptions);
};

export const verifyStaffToken = (token: string): StaffTokenPayload => {
  try {
    return jwt.verify(token, process.env.STAFF_JWT_SECRET!) as StaffTokenPayload;
  } catch {
    throw new AppError("Invalid or expired staff token", 401);
  }
};
