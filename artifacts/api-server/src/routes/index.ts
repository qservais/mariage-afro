import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import leadsRouter from "./leads";
import quotesPublicRouter from "./quotes-public";
import clientRouter from "./client";
import storageRouter from "./storage";
import vendorRouter from "./vendor";
import agentationRouter from "./agentation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(leadsRouter);
router.use(quotesPublicRouter);
router.use(storageRouter);
router.use(clientRouter);
router.use(vendorRouter);
router.use(agentationRouter);

export default router;
