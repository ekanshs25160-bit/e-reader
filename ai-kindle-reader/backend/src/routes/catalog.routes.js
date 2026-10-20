import { Router } from "express"
import { downloadBook, searchBooks, browseCatalog, getBookById } from "../controllers/catalog.controller.js"
const router = Router()

router.route('/search').get(searchBooks)
router.route('/download/:bookId').get(downloadBook)
router.route("/browse").get(browseCatalog);
router.route('/book/:id').get(getBookById)

export default router