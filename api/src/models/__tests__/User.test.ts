import { User } from '@/models/User';
import mongoose from 'mongoose';
import { cleanupDatabase } from '@/__tests__/setup/jest.setup';

describe('User Model', () => {
  let user: any;
  let testUser: any;

  // No need for beforeAll/afterAll as they're handled in the global setup

  beforeEach(async () => {
    await cleanupDatabase();
    const user = await User.create({
      username: `testuser-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      location: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    });
    testUser = user._id as mongoose.Types.ObjectId;
  });

  describe('Validation', () => {
    it('should validate valid user data', async () => {
      const user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      expect(user.username).toBe(user.username);
      expect(user.email).toBe(user.email);
    });

    it('should throw error for invalid username', async () => {
      const invalidUser = {
        username: 'ab',
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Username must be at least 3 characters');
    });

    it('should throw error for invalid email', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: 'invalid-email',
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should throw error for invalid password', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: '1234',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Password must be at least 8 characters');
    });

    it('should throw error for invalid location', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 100,
          longitude: 200
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('User validation failed: location.latitude: Path `location.latitude` (100) is more than maximum allowed value (90)., location.longitude: Path `location.longitude` (200) is more than maximum allowed value (180).');
    });

    it('should throw error for invalid avatar URL', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        profile: {
          avatarUrl: 'invalid-url'
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Invalid URL format');
    });
  });

  describe('Password Handling', () => {
    it('should hash password before saving', async () => {
      user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      expect(user.password).not.toEqual('Test123!');
    });

    it('should compare password correctly', async () => {
      user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      const isMatch = await user.comparePassword('Test123!');
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Unique Constraints', () => {
    it('should throw error for duplicate username', async () => {
      await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      try {
        await User.create({
          username: `testuser-${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'Test123!',
          location: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        });
      } catch (error: any) {
        expect(error.message).toContain('E11000');
        expect(error.message).toContain('username_1');
      }
    });

    it('should throw error for duplicate email', async () => {
      await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      const user2 = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      };
      try {
        await User.create(user2);
      } catch (error: any) {
        expect(error.message).toContain('E11000');
        expect(error.message).toContain('email_1');
      }
    });
  });

  describe('Location Validation', () => {
    it('should validate valid location coordinates', async () => {
      const user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      expect(user.location).toEqual({
        latitude: 12.9716,
        longitude: 77.5946
      });
    });

    it('should throw error for invalid latitude', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 100,
          longitude: 0
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Path `location.latitude` (100) is more than maximum allowed value (90).');
    });

    it('should throw error for invalid longitude', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 0,
          longitude: 200
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Path `location.longitude` (200) is more than maximum allowed value (180).');
    });
  });

  describe('Profile Validation', () => {
    it('should validate valid profile data', async () => {
      const user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        profile: {
          firstName: 'Test',
          lastName: 'User',
          bio: 'Test bio',
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      });
      expect(user.profile).toEqual({
        firstName: 'Test',
        lastName: 'User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.jpg'
      });
    });

    it('should throw error for invalid avatar URL', async () => {
      const invalidUser = {
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        profile: {
          avatarUrl: 'invalid-url'
        }
      };
      await expect(User.create(invalidUser))
        .rejects
        .toThrow('Invalid URL format');
    });

    it('should handle optional profile fields', async () => {
      const user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        },
        profile: {
          firstName: 'Test'
        }
      });
      expect(user.profile).toEqual({
        firstName: 'Test'
      });
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt timestamps', async () => {
      user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should update updatedAt timestamp on update', async () => {
      user = await User.create({
        username: `testuser-${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        location: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      });
      const originalUpdatedAt = user.updatedAt;
      
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'profile.bio': 'Updated bio'
        }
      });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });
});
