import { AuthenticatedParentRequest } from "../../types/index";
import { getStudentTransactionsService, getMyTransactionsService } from "./transactions.service";
import { sendSuccess } from "../../utils/response";

const listForStudent = async (req: AuthenticatedParentRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await getStudentTransactionsService(id, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 20);
    sendSuccess(res, "Transactions fetched", result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
