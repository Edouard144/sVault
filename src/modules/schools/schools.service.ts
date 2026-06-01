import { eq, count, and } from "drizzle-orm";
import { db } from "../../config/db";
import { schools, students } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import type {
  CreateSchoolInput,
  GetSchoolStudentsInput,
} from "./schools.schema";
import { createStudentService } from "../students/students.service";
import type { CreateStudentInput } from "../students/students.schema";

export const createSchoolService = async (input: CreateSchoolInput) => {
  const existing = await db.query.schools.findFirst({
    where: eq(schools.prefix, input.prefix),
  });

  if (existing) {
    throw new AppError(
      `A school with prefix "${input.prefix}" already exists`,
      409
    );
  }

  const [newSchool] = await db
    .insert(schools)
    .values({
      name: input.name,
      prefix: input.prefix,
      address: input.address || null,
      phone: input.phone || null,
    })
    .returning();

  return {
    id: newSchool.id,
    name: newSchool.name,
    prefix: newSchool.prefix,
    address: newSchool.address,
    phone: newSchool.phone,
    createdAt: newSchool.createdAt,
  };
};

export const getSchoolStudentsService = async (
  schoolId: string,
  requestingSchoolId: string,
  input: GetSchoolStudentsInput
) => {
  if (schoolId !== requestingSchoolId) {
    throw new AppError("You can only view students from your own school", 403);
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school) {
    throw new AppError("School not found", 404);
  }

  const { page, limit, class: studentClass } = input;
  const offset = (page - 1) * limit;

  const whereClause = studentClass
    ? and(eq(students.schoolId, schoolId), eq(students.class, studentClass))
    : eq(students.schoolId, schoolId);

  const studentList = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      class: students.class,
      admissionNumber: students.admissionNumber,
      studentToken: students.studentToken,
      balance: students.balance,
      isFrozen: students.isFrozen,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(students)
    .where(whereClause);

  return {
    school: {
      id: school.id,
      name: school.name,
    },
    data: studentList,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const addStudentToSchoolService = async (
  schoolId: string,
  requestingSchoolId: string,
  input: CreateStudentInput
) => {
  if (schoolId !== requestingSchoolId) {
    throw new AppError("You can only add students to your own school", 403);
  }

  return createStudentService(schoolId, input);
};
