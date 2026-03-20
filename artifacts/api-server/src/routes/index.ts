import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import analyzeRouter from "./analyze.js";
import recommendationsRouter from "./recommendations.js";
import portfolioRouter from "./portfolio.js";
import watchlistRouter from "./watchlist.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(recommendationsRouter);
router.use(portfolioRouter);
router.use(watchlistRouter);

export default router;
