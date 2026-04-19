import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import leadsRouter from "./leads";
import clientRouter from "./client";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(leadsRouter);
router.use(clientRouter);

export default router;
