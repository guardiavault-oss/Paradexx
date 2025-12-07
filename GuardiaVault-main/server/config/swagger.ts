/**
 * Swagger/OpenAPI Configuration
 * API Documentation for GuardiaVault
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GuardiaVault API',
      version: '1.0.0',
      description: 'Blockchain-based digital inheritance platform with deadman\'s switch functionality.',
      contact: {
        name: 'GuardiaVault Support',
        email: 'support@guardiavault.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.guardiavault.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication (set automatically after login)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            walletAddress: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email'],
        },
        Vault: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            ownerId: { type: 'string', format: 'uuid' },
            checkInIntervalDays: { type: 'integer', minimum: 1 },
            gracePeriodDays: { type: 'integer', minimum: 1 },
            status: {
              type: 'string',
              enum: ['active', 'pending_recovery', 'recovered', 'expired'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            lastCheckIn: { type: 'string', format: 'date-time', nullable: true },
          },
          required: ['id', 'name', 'ownerId', 'checkInIntervalDays', 'gracePeriodDays'],
        },
        Party: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            vaultId: { type: 'string', format: 'uuid' },
            role: { type: 'string', enum: ['guardian', 'beneficiary', 'attestor'] },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['active', 'pending', 'declined', 'inactive'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
          },
          required: ['id', 'vaultId', 'role', 'name', 'email'],
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
          required: ['message'],
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
          },
        },
        ReadinessCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ready', 'not_ready'] },
            timestamp: { type: 'string', format: 'date-time' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'boolean' },
                blockchain: { type: ['boolean', 'string'] },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Unauthorized' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'Validation error',
                errors: [
                  { path: 'email', message: 'Invalid email format', code: 'invalid_string' },
                ],
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Resource not found' },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Vaults',
        description: 'Vault management operations',
      },
      {
        name: 'Parties',
        description: 'Guardian and beneficiary management',
      },
      {
        name: 'Check-ins',
        description: 'Dead man\'s switch check-in operations',
      },
      {
        name: 'Claims',
        description: 'Inheritance claim and recovery operations',
      },
      {
        name: 'Notifications',
        description: 'Notification management and testing',
      },
      {
        name: 'Payments',
        description: 'Payment processing with Stripe',
      },
    ],
  },
  apis: ['./server/routes.ts', './server/**/*.ts'], // Path to API files
};

export const swaggerSpec = swaggerJsdoc(options);

