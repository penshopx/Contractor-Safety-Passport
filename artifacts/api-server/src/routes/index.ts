import { Router, type IRouter } from "express";
import healthRouter from "./health";
import safetyRouter from "./safety";
import organizationsRouter from "./organizations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(organizationsRouter);
router.use(safetyRouter);

export default router;
