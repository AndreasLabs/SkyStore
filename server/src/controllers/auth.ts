import prisma from '../lib/prisma';
import { ServerError } from '../types/ServerError';
import logger from '../logger';
import { S3Client } from '../clients/S3Client';
import { randomUUID } from 'crypto';

/**
 * Authentication controller for user management
 */
export const authController = {
  /**
   * Register a new user
   */
  register: async (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ServerError('Email already in use', 400);
        } else {
          throw new ServerError('Username already taken', 400);
        }
      }

      // Hash the password
      const hashedPassword = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 10, // Work factor
      });

      // Create the user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
        },
      });

      // Initialize S3 storage structure for the new user
      const s3Client = S3Client.getInstance();
      await s3Client.ensureUserStructure(user.id);
      await s3Client.ensureDropboxStructure(user.id);
      await s3Client.ensureAssetsStructure(user.id, user.id);

      // Remove password from returned user
      const { password: _, ...userWithoutPassword } = user;
      
      return userWithoutPassword;
    } catch (error) {
      logger.error('User registration failed:', error);
      
      if (error instanceof ServerError) {
        throw error;
      }
      
      throw new ServerError('Registration failed', 500);
    }
  },

  /**
   * Login a user
   */
  login: async (identifier: string, password: string) => {
    try {
      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier }
          ]
        }
      });

      if (!user) {
        throw new ServerError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await Bun.password.verify(password, user.password);
      
      if (!isValidPassword) {
        throw new ServerError('Invalid credentials', 401);
      }

      // Ensure S3 storage structures exist for the user
      try {
        const s3Client = S3Client.getInstance();
        await s3Client.ensureUserStructure(user.id);
        await s3Client.ensureDropboxStructure(user.id);
        await s3Client.ensureAssetsStructure(user.id, user.id);
      } catch (s3Error) {
        // Log the error but don't fail the login - the user can still login even if S3 structure creation fails
        logger.error('Failed to ensure S3 structures during login:', {
          user_id: user.id,
          error: s3Error instanceof Error ? s3Error.message : String(s3Error)
        });
      }

      // Remove password from returned user
      const { password: _, ...userWithoutPassword } = user;
      
      return userWithoutPassword;
    } catch (error) {
      logger.error('User login failed:', error);
      
      if (error instanceof ServerError) {
        throw error;
      }
      
      throw new ServerError('Login failed', 500);
    }
  },

  /**
   * Request a password reset
   */
  requestPasswordReset: async (email: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // For security reasons, don't reveal if the email exists
        return true;
      }

      // Generate reset token
      const resetToken = randomUUID();
      
      // Set expiration time (1 hour from now)
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_token: resetToken,
          reset_expires: resetExpires
        }
      });

      // In real implementation, send an email with reset link
      // For now, we just return the token for testing
      logger.info(`Password reset requested for ${email}. Token: ${resetToken}`);
      
      return true;
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw new ServerError('Password reset request failed', 500);
    }
  },

  /**
   * Reset password using token
   */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      // Find user with the reset token
      const user = await prisma.user.findFirst({
        where: {
          reset_token: token,
          reset_expires: {
            gt: new Date() // Token hasn't expired
          }
        }
      });

      if (!user) {
        throw new ServerError('Invalid or expired reset token', 400);
      }

      // Hash new password
      const hashedPassword = await Bun.password.hash(newPassword, {
        algorithm: 'bcrypt',
        cost: 10, // Work factor
      });

      // Update user with new password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          reset_token: null,
          reset_expires: null
        }
      });

      return true;
    } catch (error) {
      logger.error('Password reset failed:', error);
      
      if (error instanceof ServerError) {
        throw error;
      }
      
      throw new ServerError('Password reset failed', 500);
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new ServerError('User not found', 404);
      }

      // Ensure S3 storage structures exist for the user
      try {
        const s3Client = S3Client.getInstance();
        await s3Client.ensureUserStructure(user.id);
        await s3Client.ensureDropboxStructure(user.id);
        await s3Client.ensureAssetsStructure(user.id, user.id);
      } catch (s3Error) {
        // Log the error but don't fail the profile fetch - the user can still access their profile even if S3 structure creation fails
        logger.error('Failed to ensure S3 structures during profile fetch:', {
          user_id: user.id,
          error: s3Error instanceof Error ? s3Error.message : String(s3Error)
        });
      }

      // Remove password from returned user
      const { password: _, ...userWithoutPassword } = user;
      
      return userWithoutPassword;
    } catch (error) {
      logger.error('Get profile failed:', error);
      
      if (error instanceof ServerError) {
        throw error;
      }
      
      throw new ServerError('Failed to get user profile', 500);
    }
  }
}; 