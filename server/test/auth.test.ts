import { describe, expect, it, afterAll } from 'bun:test';
import { authController } from '../src/controllers/auth';
import prisma from '../src/lib/prisma';

// Define User type based on Prisma schema
type User = {
  id: string;
  email: string;
  username: string;
  password?: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  created_at: Date;
  updated_at: Date;
  reset_token?: string | null;
  reset_expires?: Date | null;
}

// Test user credentials
const testUser = {
  username: 'testuser123',
  email: 'testuser123@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

describe('Authentication', () => {
  // Clean up test data after all tests
  afterAll(async () => {
    // Delete test user if it exists
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
  });

  it('should register a new user', async () => {
    // Register a new user
    const user = await authController.register(
      testUser.username,
      testUser.email,
      testUser.password,
      testUser.firstName,
      testUser.lastName
    );

    // Check if user was created
    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);
    expect(user.username).toBe(testUser.username);
    expect(user.first_name).toBe(testUser.firstName);
    expect(user.last_name).toBe(testUser.lastName);
    // Password should not be returned
    expect('password' in user).toBe(false);
  });

  it('should login a user', async () => {
    // Login with email
    const userByEmail = await authController.login(testUser.email, testUser.password);
    expect(userByEmail).toBeDefined();
    expect(userByEmail.email).toBe(testUser.email);

    // Login with username
    const userByUsername = await authController.login(testUser.username, testUser.password);
    expect(userByUsername).toBeDefined();
    expect(userByUsername.username).toBe(testUser.username);
  });

  it('should get user profile', async () => {
    // Find user to get ID
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    }) as User | null;

    expect(dbUser).toBeDefined();
    
    if (dbUser) {
      // Get user profile
      const profile = await authController.getProfile(dbUser.id);
      expect(profile).toBeDefined();
      expect(profile.email).toBe(testUser.email);
      expect(profile.username).toBe(testUser.username);
      // Password should not be returned
      expect('password' in profile).toBe(false);
    }
  });

  it('should handle password reset request', async () => {
    // Request password reset
    const result = await authController.requestPasswordReset(testUser.email);
    expect(result).toBe(true);

    // Check if reset token was set
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    }) as User | null;

    expect(dbUser).toBeDefined();
    expect(dbUser?.reset_token).toBeDefined();
    expect(dbUser?.reset_expires).toBeDefined();
  });

  it('should reset password', async () => {
    // Get user with reset token
    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    }) as User | null;

    expect(dbUser).toBeDefined();
    
    if (dbUser && dbUser.reset_token) {
      // Reset password
      const newPassword = 'newpassword123';
      const result = await authController.resetPassword(dbUser.reset_token, newPassword);
      expect(result).toBe(true);

      // Try to login with new password
      const user = await authController.login(testUser.email, newPassword);
      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
    }
  });
}); 