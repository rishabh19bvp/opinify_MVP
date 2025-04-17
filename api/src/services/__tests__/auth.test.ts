import { authService } from '@/services/auth';
import { cleanupDatabase } from '@/__tests__/setup/jest.setup';
import { User } from '@/models/User';
import { testUser } from './__mocks__/testData';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

describe('Auth Service', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register(testUser);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.email).toBe(testUser.email);
    });

    it('should throw error for duplicate email', async () => {
      await authService.register(testUser);
      try {
        await authService.register(testUser);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error.message).toBe('Email already registered');
      }
    });

    it('should throw error for duplicate username', async () => {
      await authService.register(testUser);
      const user2 = { ...testUser, email: 'test2@example.com' };
      try {
        await authService.register(user2);
        throw new Error('Expected error was not thrown');
      } catch (error: any) {
        expect(error.message).toBe('Username already taken');
      }
    });
  });

  describe('Token Verification', () => {
    let registeredUser: any;

    beforeEach(async () => {
      await cleanupDatabase();
      registeredUser = await authService.register(testUser);
    });

    it('should verify valid token', async () => {
      const verifiedUser = await authService.verifyToken(registeredUser.token);
      expect(verifiedUser._id.toString()).toBe(registeredUser.user._id.toString());
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid.token.here'))
        .rejects
        .toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', async () => {
      const token = jwt.sign({ userId: registeredUser.user._id.toString() }, config.jwt.secret as string, {
        expiresIn: '1s'
      });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      await expect(authService.verifyToken(token))
        .rejects
        .toThrow('Invalid or expired token');
    });

    it('should throw error for invalid user ID format', async () => {
      const token = jwt.sign({ userId: 'invalid-id-format' }, config.jwt.secret as string);
      await expect(authService.verifyToken(token))
        .rejects
        .toThrow('Invalid user ID format');
    });
  });
});
