import bcrypt from "bcryptjs";
import dayjs from "dayjs";

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

export const verifyOtp = async (
  rawOtp: string,
  hashedOtp: string
): Promise<boolean> => {
  return bcrypt.compare(rawOtp, hashedOtp);
};

export const getOtpExpiry = (): Date => {
  const minutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES || "10");
  return dayjs().add(minutes, "minute").toDate();
};

export const isOtpExpired = (expiresAt: Date): boolean => {
  return dayjs().isAfter(dayjs(expiresAt));
};
