import { Router } from "express"
import { downloadBook, searchBooks } from "../controllers/catalog.controller.js"
const router = Router()

router.route('/search').get(searchBooks)
router.route('/download/:bookId').get(downloadBook)

export default router