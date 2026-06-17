import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      const result = await service.register('a@b.com', 'password123');
      expect(result.email).toBe('a@b.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      await expect(service.register('a@b.com', 'password123')).rejects.toThrow(ConflictException);
    });

    it('should hash the password before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      await service.register('a@b.com', 'password123');
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('password123');
    });

    it('should not store plain text password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      await service.register('a@b.com', 'password123');
      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toContain('password123');
    });

    it('should return id and email on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      const result = await service.register('a@b.com', 'password123');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com', passwordHash: hash });
      const result = await service.login('a@b.com', 'password123');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('noone@b.com', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com', passwordHash: hash });
      await expect(service.login('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should call jwtService.sign twice (access + refresh)', async () => {
      const hash = await bcrypt.hash('password123', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com', passwordHash: hash });
      await service.login('a@b.com', 'password123');
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'uuid-1', email: 'a@b.com' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      const result = await service.refresh('valid-refresh-token');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException on expired token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });
      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'deleted-user', email: 'x@b.com' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on malformed token', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('malformed'); });
      await expect(service.refresh('bad.token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1', email: 'a@b.com' });
      const result = await service.validateUser('uuid-1');
      expect(result).not.toBeNull();
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('nonexistent');
      expect(result).toBeNull();
    });
  });
});
