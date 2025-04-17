"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsController_1 = require("../controllers/newsController");
const router = express_1.default.Router();
// Public routes
router.get('/headlines', newsController_1.getTopHeadlines);
router.get('/search', newsController_1.searchNews);
// router.get('/tags', getNewsByTags); // Not implemented, see docs/news-api-flow.md
router.get('/:id', newsController_1.getNewsById);
// Protected routes
// router.post('/:id/react', authenticate, updateReactions); // Not implemented, see docs/news-api-flow.md
exports.default = router;
