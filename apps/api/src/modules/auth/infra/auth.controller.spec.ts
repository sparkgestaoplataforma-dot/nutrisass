import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, refresh, logout, me } from "./auth.controller";
import * as loginUseCase from "../application/login.usecase";
import * as refreshUseCase from "../application/refresh.usecase";
import * as logoutUseCase from "../application/logout.usecase";

vi.mock("../application/login.usecase", () => ({
  loginUseCase: vi.fn().mockResolvedValue({ accessToken: "abc", refreshToken: "def" }),
}));

vi.mock("../application/refresh.usecase", () => ({
  refreshUseCase: vi.fn().mockResolvedValue({ accessToken: "abc", refreshToken: "def" }),
}));

vi.mock("../application/logout.usecase", () => ({
  logoutUseCase: vi.fn().mockResolvedValue(true),
}));

describe("auth.controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
      headers: { authorization: "Bearer token123" },
      user: { userId: "user-1", email: "test@test.com" }
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("login", () => {
    it("deve realizar login e retornar tokens", async () => {
      mockReq.body = { email: "test@test.com", senha: "123" };
      await login(mockReq, mockRes);

      expect(loginUseCase.loginUseCase).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { accessToken: "abc", refreshToken: "def" }
      }));
    });
  });

  describe("refresh", () => {
    it("deve dar erro se refreshToken não for enviado", async () => {
      await refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it("deve renovar os tokens", async () => {
      mockReq.body = { refreshToken: "def" };
      await refresh(mockReq, mockRes);

      expect(refreshUseCase.refreshUseCase).toHaveBeenCalledWith("def");
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("logout", () => {
    it("deve realizar logout", async () => {
      await logout(mockReq, mockRes);

      expect(logoutUseCase.logoutUseCase).toHaveBeenCalledWith("user-1", "token123");
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("me", () => {
    it("deve retornar o usuário logado", async () => {
      await me(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockReq.user
      }));
    });
  });
});
