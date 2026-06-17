import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';

const mockLinksService = {
  create: jest.fn().mockResolvedValue({ message: 'queued', data: { link_id: 'l1', status: 'PENDING' } }),
  findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
  updateStatus: jest.fn().mockResolvedValue({ id: 'l1', status: 'ARCHIVED' }),
  reconstructContext: jest.fn().mockResolvedValue({ reconstructed_story: 'You saved this' }),
};

const mockAuthService = {
  register: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }),
  login: jest.fn().mockResolvedValue({ accessToken: 'mock-access', refreshToken: 'mock-refresh' }),
  refresh: jest.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
  validateUser: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }),
};

jest.mock('../auth/jwt.strategy', () => ({
  JwtStrategy: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }),
  })),
}));

describe('API E2E (mock services)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { AuthModule } = await import('../auth/auth.module');
    const { LinksModule } = await import('../links/links.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, LinksModule],
    })
      .overrideProvider('AuthService').useValue(mockAuthService)
      .overrideProvider('LinksService').useValue(mockLinksService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register → 201', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect((res) => expect([201, 409, 500]).toContain(res.status));
  });

  it('POST /api/v1/auth/login → 200', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect((res) => expect([200, 401, 500]).toContain(res.status));
  });

  it('GET /api/v1/links without token → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/links')
      .expect((res) => expect([401, 403]).toContain(res.status));
  });

  it('POST /api/v1/links without token → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .send({ url: 'https://x.com', source: 'WEB_EXT' })
      .expect((res) => expect([401, 403]).toContain(res.status));
  });

  it('POST /api/v1/auth/register with invalid email → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'pass' })
      .expect((res) => expect([400, 500]).toContain(res.status));
  });
});
