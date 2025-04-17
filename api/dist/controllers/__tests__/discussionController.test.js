"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const DiscussionChannel_1 = require("../../models/DiscussionChannel");
const discussionRoutes_1 = __importDefault(require("../../routes/discussionRoutes"));
const firebaseService_1 = require("../../services/firebaseService");
const dbHandler = __importStar(require("../../__tests__/setup/mongo-memory-server"));
// Mock Firebase service
jest.mock('../../services/firebaseService');
let app;
let testUserId;
let testPollId;
let testChannelId;
let authToken;
beforeAll(async () => {
    await dbHandler.connect();
    // Setup Express app
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/discussions', discussionRoutes_1.default);
    // Mock middleware for tests to handle authentication
    app.use((req, res, next) => {
        if (req.headers.authorization?.startsWith('Bearer ')) {
            const token = req.headers.authorization.split(' ')[1];
            if (token === 'test-token') {
                req.user = { id: testUserId.toString() };
            }
        }
        next();
    });
    // Mock Firebase service methods
    const mockFirebaseService = firebaseService_1.FirebaseService;
    mockFirebaseService.prototype.isConnected.mockReturnValue(false);
    mockFirebaseService.prototype.createChannel.mockResolvedValue(true);
    mockFirebaseService.prototype.addMessage.mockResolvedValue('mock-message-id');
    mockFirebaseService.prototype.addParticipant.mockResolvedValue(true);
    mockFirebaseService.prototype.removeParticipant.mockResolvedValue(true);
    mockFirebaseService.prototype.markMessageAsRead.mockResolvedValue(true);
    mockFirebaseService.prototype.updateChannel.mockResolvedValue(true);
});
beforeEach(async () => {
    // Clear collections
    await dbHandler.clearDatabase();
    // Create test IDs
    testUserId = new mongoose_1.default.Types.ObjectId();
    testPollId = new mongoose_1.default.Types.ObjectId();
    // Create test channel
    const channel = await DiscussionChannel_1.DiscussionChannel.create({
        name: 'Test Channel',
        description: 'Test channel description',
        poll: testPollId,
        creator: testUserId,
        participants: [testUserId],
        maxParticipants: 50
    });
    testChannelId = channel._id;
    // Generate auth token
    authToken = 'test-token';
});
afterAll(async () => {
    await dbHandler.closeDatabase();
});
describe('Discussion Controller Basic Tests', () => {
    // Test getting all channels
    describe('GET /api/discussions', () => {
        it('should get all discussion channels', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/discussions');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
        });
    });
    // Test getting a specific channel
    describe('GET /api/discussions/:id', () => {
        it('should get a single discussion channel', async () => {
            const res = await (0, supertest_1.default)(app)
                .get(`/api/discussions/${testChannelId}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Test Channel');
        });
        it('should return 404 for non-existent channel', async () => {
            const nonExistentId = new mongoose_1.default.Types.ObjectId();
            const res = await (0, supertest_1.default)(app)
                .get(`/api/discussions/${nonExistentId}`);
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});
