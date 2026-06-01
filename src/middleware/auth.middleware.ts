import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";
import { AppError } from "./error.middleware";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or malformed", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.parent = {
      parentId: payload.parentId,
      phone: payload.phone,
    };

    next();
  } catch (error) {
    next(error);
  }
};
