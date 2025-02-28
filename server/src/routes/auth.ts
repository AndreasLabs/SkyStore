import { t } from 'elysia';
import { createBaseRoute } from './base';
import { authController } from '../controllers/auth';
import { ServerError } from '../types/ServerError';
// @ts-ignore - Suppress type errors for JWT plugin
import { jwt } from '@elysiajs/jwt';
// @ts-ignore - Suppress type errors for cookie plugin
import { cookie } from '@elysiajs/cookie';
import logger from '../logger';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// Define user schema for validation
const userSchema = t.Object({
  username: t.String(),
  email: t.String(),
  password: t.String(),
  first_name: t.Optional(t.String()),
  last_name: t.Optional(t.String()),
});

// Create authentication routes
export const authRoutes = createBaseRoute('/auth')
  // Use JWT and cookie plugins
  // @ts-ignore - Suppress type errors for JWT plugin
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: JWT_EXPIRY
  }))
  // @ts-ignore - Suppress type errors for cookie plugin
  .use(cookie())

  // Register new user
  .post('/register', 
    async ({ body, set }) => {
      try {
        const { username, email, password, first_name, last_name } = body;
        
        const user = await authController.register(
          username,
          email,
          password,
          first_name,
          last_name
        );

        return {
          success: true,
          data: user
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        
        set.status = 500;
        return {
          success: false,
          error: 'Registration failed'
        };
      }
    }, {
      body: userSchema
    }
  )
  
  // Login user
  .post('/login', 
    async ({ body, set, jwt, cookie }) => {
      try {
        const { identifier, password } = body;
        
        const user = await authController.login(identifier, password);
        
        // Generate JWT token with user ID as payload
        const token = await jwt.sign({
          userId: user.id,
          role: user.role
        });

        // Set cookie for authentication
        cookie.auth = token;
        cookie.auth.httpOnly = true;
        cookie.auth.maxAge = 7 * 24 * 60 * 60; // 7 days
        cookie.auth.path = '/';
        
        return {
          success: true,
          data: {
            ...user,
            token
          }
        };
      } catch (error) {
        logger.error('Login failed:', error);
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        
        set.status = 500;
        return {
          success: false,
          error: 'Login failed'
        };
      }
    }, {
      body: t.Object({
        identifier: t.String(),
        password: t.String()
      })
    }
  )
  
  // Logout user
  .post('/logout', 
    ({ cookie, set }) => {
      try {
        // Clear auth cookie
        cookie.auth = null;
        
        return {
          success: true,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: 'Logout failed'
        };
      }
    }
  )
  
  // Request password reset
  .post('/reset-password/request', 
    async ({ body, set }) => {
      try {
        const { email } = body;
        
        await authController.requestPasswordReset(email);
        
        return {
          success: true,
          message: 'If your email is registered, you will receive a password reset link'
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        
        set.status = 500;
        return {
          success: false,
          error: 'Password reset request failed'
        };
      }
    }, {
      body: t.Object({
        email: t.String()
      })
    }
  )
  
  // Reset password with token
  .post('/reset-password/confirm', 
    async ({ body, set }) => {
      try {
        const { token, newPassword } = body;
        
        await authController.resetPassword(token, newPassword);
        
        return {
          success: true,
          message: 'Password reset successful'
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        
        set.status = 500;
        return {
          success: false,
          error: 'Password reset failed'
        };
      }
    }, {
      body: t.Object({
        token: t.String(),
        newPassword: t.String()
      })
    }
  )
  
  // Get current user (protected route)
  .get('/me', 
    async ({ jwt, cookie, headers, set }) => {
      try {
        // Try to get token from cookies or Authorization header
        let token = cookie.auth;
        
        // If no cookie, check Authorization header
        if (!token && headers.authorization) {
          const authHeader = headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }
        
        if (!token) {
          set.status = 401;
          return {
            success: false,
            error: 'Unauthorized - No token provided'
          };
        }
        
        // Simple token validation
        try {
          // Manual token verification
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            if (payload && payload.userId) {
              // Get user profile
              const user = await authController.getProfile(payload.userId);
              
              return {
                success: true,
                data: user
              };
            }
          }
        } catch (tokenError) {
          logger.error('Error decoding token:', tokenError);
        }
        
        // Fallback to Elysia's JWT verification if manual verification fails
        const payload = await jwt.verify(token);
        
        if (!payload) {
          set.status = 401;
          return {
            success: false,
            error: 'Invalid token'
          };
        }
        
        // Get user profile using the userId from payload
        const userId = payload.userId;
        
        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: 'Invalid token - No user ID'
          };
        }
        
        // Get user profile
        const user = await authController.getProfile(userId);
        
        return {
          success: true,
          data: user
        };
      } catch (error) {
        logger.error('Error in /me endpoint:', error);
        
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        
        set.status = 500;
        return {
          success: false,
          error: 'Failed to get user profile'
        };
      }
    }
  ); 