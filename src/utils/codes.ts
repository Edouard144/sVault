import { v4 as uuidv4 } from "uuid";

export const generateStudentToken = (): string => {
  const year = new Date().getFullYear();
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `SV-${year}-${digits}`;
};

export const generateLinkCode = (): string => {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `LK-${digits}`;
};

export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const generateId = (): string => {
  return uuidv4();
};

export const generateAdmissionNumber = (schoolPrefix: string): string => {
  const year = new Date().getFullYear();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${schoolPrefix.toUpperCase()}-${year}-${digits}`;
};
