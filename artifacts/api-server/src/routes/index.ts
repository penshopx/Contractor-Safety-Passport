import { Router, type IRouter } from "express";
import healthRouter from "./health";
import safetyRouter from "./safety";
import organizationsRouter from "./organizations";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(organizationsRouter);
router.use(storageRouter);
router.use(safetyRouter);

export default router;
