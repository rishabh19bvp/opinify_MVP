"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const discussionController_1 = require("../controllers/discussionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.get('/', discussionController_1.getChannels);
router.get('/:id', discussionController_1.getChannel);
// Protected routes
router.post('/', auth_1.authenticate, discussionController_1.createChannel);
router.post('/:id/join', auth_1.authenticate, discussionController_1.joinChannel);
router.post('/:id/leave', auth_1.authenticate, discussionController_1.leaveChannel);
router.post('/:id/messages', auth_1.authenticate, discussionController_1.sendMessage);
router.get('/:id/messages', auth_1.authenticate, discussionController_1.getMessages);
router.post('/:id/messages/:messageId/read', auth_1.authenticate, discussionController_1.markMessageAsRead);
router.put('/:id/close', auth_1.authenticate, discussionController_1.closeChannel);
exports.default = router;
