"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("@/services/auth");
const jest_setup_1 = require("@/__tests__/setup/jest.setup");
const testData_1 = require("./__mocks__/testData");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config");
describe('Auth Service', () => {
    beforeEach(async () => {
        await (0, jest_setup_1.cleanupDatabase)();
    });
    describe('Registration', () => {
        it('should register a new user successfully', async () => {
            const result = await auth_1.authService.register(testData_1.testUser);
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.username).toBe(testData_1.testUser.username);
            expect(result.user.email).toBe(testData_1.testUser.email);
        });
        it('should throw error for duplicate email', async () => {
            await auth_1.authService.register(testData_1.testUser);
            try {
                await auth_1.authService.register(testData_1.testUser);
                throw new Error('Expected error was not thrown');
            }
            catch (error) {
                expect(error.message).toBe('Email already registered');
            }
        });
        it('should throw error for duplicate username', async () => {
            await auth_1.authService.register(testData_1.testUser);
            const user2 = { ...testData_1.testUser, email: 'test2@example.com' };
            try {
                await auth_1.authService.register(user2);
                throw new Error('Expected error was not thrown');
            }
            catch (error) {
                expect(error.message).toBe('Username already taken');
            }
        });
    });
    describe('Token Verification', () => {
        let registeredUser;
        beforeEach(async () => {
            await (0, jest_setup_1.cleanupDatabase)();
            registeredUser = await auth_1.authService.register(testData_1.testUser);
        });
        it('should verify valid token', async () => {
            const verifiedUser = await auth_1.authService.verifyToken(registeredUser.token);
            expect(verifiedUser._id.toString()).toBe(registeredUser.user._id.toString());
        });
        it('should throw error for invalid token', async () => {
            await expect(auth_1.authService.verifyToken('invalid.token.here'))
                .rejects
                .toThrow('Invalid or expired token');
        });
        it('should throw error for expired token', async () => {
            const token = jsonwebtoken_1.default.sign({ userId: registeredUser.user._id.toString() }, config_1.config.jwt.secret, {
                expiresIn: '1s'
            });
            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 1000));
            await expect(auth_1.authService.verifyToken(token))
                .rejects
                .toThrow('Invalid or expired token');
        });
        it('should throw error for invalid user ID format', async () => {
            const token = jsonwebtoken_1.default.sign({ userId: 'invalid-id-format' }, config_1.config.jwt.secret);
            await expect(auth_1.authService.verifyToken(token))
                .rejects
                .toThrow('Invalid user ID format');
        });
    });
});
