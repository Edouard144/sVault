import { eq, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../../config/db";
import { staff, schools } from "../../db/schema/index";
import { AppError } from "../../middleware/error.middleware";
import { signStaffToken } from "../../utils/token";
import type {
  StaffLoginInput,
  CreateStaffInput,
  GetStaffListInput,
} from "./staff.schema";

export const staffLoginService = async (input: StaffLoginInput) => {
  const { email, password } = input;

  const member = await db.query.staff.findFirst({
    where: eq(staff.email, email),
  });

  if (!member) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!member.isActive) {
    throw new AppError("Your account has been deactivated. Contact admin.", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, member.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, member.schoolId),
  });

  if (!school) {
    throw new AppError("School not found", 404);
  }

  if (school.isFrozen) {
    throw new AppError("This school account is frozen. Contact support.", 403);
  }

  const token = signStaffToken({
    staffId: member.id,
    schoolId: member.schoolId,
    role: member.role,
  });

  return {
    token,
    staff: {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      role: member.role,
      school: {
        id: school.id,
        name: school.name,
      },
    },
  };
};

export const createStaffService = async (
  schoolId: string,
  input: CreateStaffInput
) => {
  const existing = await db.query.staff.findFirst({
    where: eq(staff.email, input.email),
  });

  if (existing) {
    throw new AppError("A staff member with this email already exists", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(input.password, salt);

  const [newStaff] = await db
    .insert(staff)
    .values({
      schoolId,
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
    })
    .returning();

  return {
    id: newStaff.id,
    fullName: newStaff.fullName,
    email: newStaff.email,
    role: newStaff.role,
    isActive: newStaff.isActive,
    createdAt: newStaff.createdAt,
  };
};

export const getStaffListService = async (
  schoolId: string,
  input: GetStaffListInput
) => {
  const { page, limit } = input;
  const offset = (page - 1) * limit;

  const members = await db
    .select({
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .where(eq(staff.schoolId, schoolId))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(staff)
    .where(eq(staff.schoolId, schoolId));

  return {
    data: members,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
