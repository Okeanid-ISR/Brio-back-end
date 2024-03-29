import { Router } from "express";
import AdminPromotionsController from "../controllers/adminPromotionsController.js";
import { authAdmin } from "../middlewares/auth.js";

const router = Router();
router.get("/", AdminPromotionsController.getAllPromotions);
router.post("/", authAdmin, AdminPromotionsController.createPromotion);
router.delete("/:id", authAdmin, AdminPromotionsController.deletePromotion);

export default router;
