import { Router } from "express";
import { defineWord } from "../controllers/lookup.controller.js";


const router = Router();
router.route("/define").get(defineWord);
export default router;
