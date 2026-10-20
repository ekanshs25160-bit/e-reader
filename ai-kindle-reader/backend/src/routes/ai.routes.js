import { Router } from "express"
import { aiAssist, aiSummary } from "../controllers/ai.controller.js";

const router = Router()

// router.route('/assist').post()
// router.route('/assist').get()
// router.route('/author-grounding').get()
router.route('/assist').post(aiAssist);
router.route('/summary').post(aiSummary);

export default router