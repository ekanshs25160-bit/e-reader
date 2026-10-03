import { Router } from "express"
import { downloadBook, searchBooks, browseCatalog } from "../controllers/catalog.controller.js"
const router = Router()

router.route('/search').get(searchBooks)
router.route('/download/:bookId').get(downloadBook)
router.route("/browse").get(browseCatalog);

export default router