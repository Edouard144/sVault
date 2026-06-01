import { Request, Response, NextFunction } from "express";
import {
  linkStudentService,
  getMyStudentsService,
  getStudentByIdService,
  searchStudentsService,
} from "./students.service";
import { sendSuccess } from "../../utils/response";
import type {
  AuthenticatedParentRequest,
  AuthenticatedStaffRequest,
} from "../../types/index";

export const linkStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await linkStudentService(
      parentReq.parent.parentId,
      req.body
    );
    sendSuccess(res, "Student linked successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getMyStudentsService(parentReq.parent.parentId);
    sendSuccess(res, "Students fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentReq = req as AuthenticatedParentRequest;
    const result = await getStudentByIdService(
      parentReq.parent.parentId,
      req.params.id
    );
    sendSuccess(res, "Student fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

export const searchStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const result = await searchStudentsService(
      staffReq.staff.schoolId,
      req.query as any
    );
    sendSuccess(res, "Search results", result);
  } catch (error) {
    next(error);
  }
};
