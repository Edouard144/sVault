import { Request, Response, NextFunction } from "express";
import {
  createSchoolService,
  getSchoolStudentsService,
  addStudentToSchoolService,
} from "./schools.service";
import { sendSuccess } from "../../utils/response";
import type { AuthenticatedStaffRequest } from "../../types/index";

export const createSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await createSchoolService(req.body);
    sendSuccess(res, "School created successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

export const getSchoolStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const result = await getSchoolStudentsService(
      req.params.id,
      staffReq.staff.schoolId,
      req.query as any
    );
    sendSuccess(res, "Students fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const addStudentToSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffReq = req as AuthenticatedStaffRequest;
    const result = await addStudentToSchoolService(
      req.params.id,
      staffReq.staff.schoolId,
      req.body
    );
    sendSuccess(res, "Student created successfully", result, 201);
  } catch (error) {
    next(error);
  }
};
