import { eq, and, or, ilike } from "drizzle-orm";
import { db } from "../../config/db";
import { students, parentStudents, schools } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import {
  generateStudentToken,
  generateLinkCode,
  generatePin,
  generateAdmissionNumber,
} from "../../utils/codes";
import { hashOtp } from "../../utils/otp";
import type {
  LinkStudentInput,
  CreateStudentInput,
  SearchStudentInput,
} from "./students.schema";

export const linkStudentService = async (
  parentId: string,
  input: LinkStudentInput
) => {
  const { studentToken, linkCode } = input;

  const student = await db.query.students.findFirst({
    where: eq(students.studentToken, studentToken),
  });

  if (!student) {
    throw new AppError("Student not found. Check the student token.", 404);
  }

  if (student.linkCode !== linkCode) {
    throw new AppError("Invalid link code.", 400);
  }

  if (student.isFrozen) {
    throw new AppError("This student account is frozen.", 403);
  }

  const existingLink = await db.query.parentStudents.findFirst({
    where: and(
      eq(parentStudents.parentId, parentId),
      eq(parentStudents.studentId, student.id)
    ),
  });

  if (existingLink) {
    throw new AppError("You have already linked this student.", 409);
  }

  await db.insert(parentStudents).values({
    parentId,
    studentId: student.id,
  });

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, student.schoolId),
  });

  return {
    id: student.id,
    fullName: student.fullName,
    class: student.class,
    admissionNumber: student.admissionNumber,
    studentToken: student.studentToken,
    balance: student.balance,
    school: {
      id: school?.id,
      name: school?.name,
    },
  };
};

export const getMyStudentsService = async (parentId: string) => {
  const linkedStudents = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      class: students.class,
      admissionNumber: students.admissionNumber,
      studentToken: students.studentToken,
      balance: students.balance,
      isFrozen: students.isFrozen,
      linkedAt: parentStudents.linkedAt,
      schoolId: students.schoolId,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, parentId));

  const withSchool = await Promise.all(
    linkedStudents.map(async (s) => {
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, s.schoolId),
      });
      return {
        ...s,
        school: { id: school?.id, name: school?.name },
      };
    })
  );

  return withSchool;
};

export const getStudentByIdService = async (
  parentId: string,
  studentId: string
) => {
  const link = await db.query.parentStudents.findFirst({
    where: and(
      eq(parentStudents.parentId, parentId),
      eq(parentStudents.studentId, studentId)
    ),
  });

  if (!link) {
    throw new AppError("Student not found or not linked to your account.", 404);
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, student.schoolId),
  });

  return {
    id: student.id,
    fullName: student.fullName,
    class: student.class,
    admissionNumber: student.admissionNumber,
    studentToken: student.studentToken,
    balance: student.balance,
    isFrozen: student.isFrozen,
    school: {
      id: school?.id,
      name: school?.name,
      address: school?.address,
    },
    linkedAt: link.linkedAt,
  };
};

export const searchStudentsService = async (
  schoolId: string,
  input: SearchStudentInput
) => {
  const { q } = input;

  const results = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      class: students.class,
      admissionNumber: students.admissionNumber,
      studentToken: students.studentToken,
      balance: students.balance,
      isFrozen: students.isFrozen,
    })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        or(
          ilike(students.fullName, `%${q}%`),
          ilike(students.admissionNumber, `%${q}%`)
        )
      )
    )
    .limit(20);

  return results;
};

export const createStudentService = async (
  schoolId: string,
  input: CreateStudentInput
) => {
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  if (!school) {
    throw new AppError("School not found.", 404);
  }

  if (school.isFrozen) {
    throw new AppError("This school account is frozen.", 403);
  }

  const studentToken = generateStudentToken();
  const linkCode = generateLinkCode();
  const plainPin = generatePin();
  const admissionNumber = generateAdmissionNumber(school.prefix);

  const pinHash = await hashOtp(plainPin);

  const [newStudent] = await db
    .insert(students)
    .values({
      schoolId,
      fullName: input.fullName,
      class: input.class,
      admissionNumber,
      studentToken,
      linkCode,
      pinHash,
      balance: 0,
    })
    .returning();

  return {
    id: newStudent.id,
    fullName: newStudent.fullName,
    class: newStudent.class,
    admissionNumber: newStudent.admissionNumber,
    studentToken: newStudent.studentToken,
    linkCode: newStudent.linkCode,
    pin: plainPin,
    school: {
      id: school.id,
      name: school.name,
    },
  };
};
