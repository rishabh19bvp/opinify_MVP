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
const DiscussionChannel_1 = require("../DiscussionChannel");
const dbHandler = __importStar(require("../../__tests__/setup/mongo-memory-server"));
beforeAll(async () => {
    await dbHandler.connect();
});
afterAll(async () => {
    await dbHandler.closeDatabase();
});
afterEach(async () => {
    await dbHandler.clearDatabase();
});
describe('DiscussionChannel Model Basic Tests', () => {
    it('should create a new discussion channel successfully', async () => {
        // Create test user ID
        const userId = new mongoose_1.default.Types.ObjectId();
        // Create test poll ID
        const pollId = new mongoose_1.default.Types.ObjectId();
        // Create test channel
        const channel = await DiscussionChannel_1.DiscussionChannel.create({
            name: 'Test Channel',
            description: 'Test channel description',
            poll: pollId,
            creator: userId,
            participants: [userId],
            maxParticipants: 50
        });
        expect(channel).toBeTruthy();
        expect(channel.name).toBe('Test Channel');
        expect(channel.description).toBe('Test channel description');
        expect(channel.poll.toString()).toBe(pollId.toString());
        expect(channel.creator.toString()).toBe(userId.toString());
        expect(channel.participants.length).toBe(1);
        expect(channel.participants[0].toString()).toBe(userId.toString());
        expect(channel.isActive).toBe(true);
        expect(channel.maxParticipants).toBe(50);
    });
    it('should require a name', async () => {
        const userId = new mongoose_1.default.Types.ObjectId();
        const pollId = new mongoose_1.default.Types.ObjectId();
        try {
            await DiscussionChannel_1.DiscussionChannel.create({
                poll: pollId,
                creator: userId,
                participants: [userId]
            });
            fail('Should have thrown a validation error');
        }
        catch (error) {
            expect(error.name).toBe('ValidationError');
            expect(error.errors.name).toBeDefined();
        }
    });
});
