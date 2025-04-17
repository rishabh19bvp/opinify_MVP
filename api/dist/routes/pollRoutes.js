"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pollController_1 = require("../controllers/pollController");
const auth_1 = require("../middleware/auth"); // fixed path
const router = express_1.default.Router();
// Public routes
router.get('/', pollController_1.getPolls);
router.get('/nearby', pollController_1.getNearbyPolls);
router.get('/:id', pollController_1.getPollById);
router.get('/user/:userId', pollController_1.getPollsByUser);
router.get('/category/:category', pollController_1.getPollsByCategory);
// Protected routes
router.post('/', auth_1.authenticate, pollController_1.createPoll);
router.post('/:id/vote', auth_1.authenticate, pollController_1.votePoll);
router.delete('/:id', auth_1.authenticate, pollController_1.deletePoll);
exports.default = router;
