import { Router } from "express"
import { searchBooks } from "../controllers/catalog.controller.js"
const router = Router()

router.route('/search').get(searchBooks)
router.route('/download/:bookId').get

export default router