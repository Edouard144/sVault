declare global {
  namespace Express {
    interface Request {
      parent?: {
        parentId: string;
        phone: string;
      };
      staff?: {
        staffId: string;
        schoolId: string;
        role: "staff" | "admin";
      };
    }
  }
}

export {};
