import { Router } from "express";
import * as SearchController from "../controllers/search.controller";

const router = Router();

router.get("/search/suggestions", SearchController.getSuggestions);
router.post("/search/suggestions/:id/click", SearchController.clickSuggestion);
router.post("/search", SearchController.saveSearch);

export default router;
