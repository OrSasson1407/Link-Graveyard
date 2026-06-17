import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const mockService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
};

const mockResponse = () => {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (cookies = {}) => ({ cookies }) as any;

describe("AuthController", () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it("should call authService.register", async () => {
    mockService.register.mockResolvedValue({ id: "u1", email: "a@b.com" });
    await controller.register({ email: "a@b.com", password: "pass12345" });
    expect(mockService.register).toHaveBeenCalledWith("a@b.com", "pass12345");
  });

  it("should call authService.login on login", async () => {
    mockService.login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
    });
    const res = mockResponse();
    await controller.login({ email: "a@b.com", password: "pass12345" }, res);
    expect(mockService.login).toHaveBeenCalledWith("a@b.com", "pass12345");
  });

  it("should set refresh_token cookie on login", async () => {
    mockService.login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
    });
    const res = mockResponse();
    await controller.login({ email: "a@b.com", password: "pass12345" }, res);
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "rt",
      expect.any(Object),
    );
  });

  it("should return only accessToken on login", async () => {
    mockService.login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
    });
    const res = mockResponse();
    const result = await controller.login(
      { email: "a@b.com", password: "pass12345" },
      res,
    );
    expect(result).toHaveProperty("accessToken");
    expect(result).not.toHaveProperty("refreshToken");
  });

  it("should call authService.refresh with cookie value", async () => {
    mockService.refresh.mockResolvedValue({
      accessToken: "new-at",
      refreshToken: "new-rt",
    });
    const req = mockRequest({ refresh_token: "old-rt" });
    const res = mockResponse();
    await controller.refresh(req, res);
    expect(mockService.refresh).toHaveBeenCalledWith("old-rt");
  });

  it("should set new cookie on refresh", async () => {
    mockService.refresh.mockResolvedValue({
      accessToken: "new-at",
      refreshToken: "new-rt",
    });
    const req = mockRequest({ refresh_token: "old-rt" });
    const res = mockResponse();
    await controller.refresh(req, res);
    expect(res.cookie).toHaveBeenCalled();
  });

  it("should clear cookie on logout", async () => {
    const res = mockResponse();
    await controller.logout(res);
    expect(res.clearCookie).toHaveBeenCalledWith("refresh_token");
  });

  it("should return logged out message on logout", async () => {
    const res = mockResponse();
    const result = await controller.logout(res);
    expect(result.message).toContain("Logged out");
  });

  it("should throw UnauthorizedException if no refresh cookie", async () => {
    const req = mockRequest({});
    const res = mockResponse();
    await expect(controller.refresh(req, res)).rejects.toThrow();
  });
});
