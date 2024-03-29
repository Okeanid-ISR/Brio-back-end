import express from "express";
import adminCategoriesController from "../controllers/adminCategoriesController.js";
import { authAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", adminCategoriesController.getAllCategories);
router.get("/:id", adminCategoriesController.getCategoryById);
router.patch("/:id", adminCategoriesController.updateCategoryById);
router.delete("/:id", adminCategoriesController.deleteCategory);
router.post("/", authAdmin, adminCategoriesController.createCategory);
router.get("/", adminCategoriesController.getCategoriesByRestaurant);
router.patch(
  "/:categoryId/add-product/:productId",
  authAdmin,
  adminCategoriesController.addProductToCategory
);

export default router;
