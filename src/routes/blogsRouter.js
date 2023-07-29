import { Router } from "express";

import { auth, authAdmin } from "../middlewares/auth.js";
import blogsController from "../controllers/blogsController.js";

const router = Router();
router.get("/", blogsController.getAllBlogs);

router.get("/:id/", blogsController.getBlogsById);

router.post("/post/", blogsController.postUserBlog);

export default router;
