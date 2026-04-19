import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import leadsRouter from "./leads";
import clientRouter from "./client";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(leadsRouter);
router.use(clientRouter);
router.use(storageRouter);

export default router;
