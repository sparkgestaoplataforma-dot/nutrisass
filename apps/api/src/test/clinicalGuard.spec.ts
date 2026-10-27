import { describe, it, expect, vi } from "vitest";
import { clinicalGuard } from "../shared/middlewares/clinicalGuard";
import { AppError } from "../shared/middlewares/errorHandler";

function run(user?: { perfil: string; tipoClinica: "AUTONOMO" | "CLINICA" }) {
  const next = vi.fn();
  const req: any = { user };
  let error: unknown;
  try {
    clinicalGuard(req, {} as any, next);
  } catch (err) {
    error = err;
  }
  return { next, error };
}

describe("clinicalGuard", () => {
  it("deve retornar 401 quando não há usuário autenticado", () => {
    const { next, error } = run(undefined);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 403 para SECRETARIA em clínica", () => {
    const { next, error } = run({ perfil: "SECRETARIA", tipoClinica: "CLINICA" });
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 403 para perfil desconhecido em clínica", () => {
    const { next, error } = run({ perfil: "OUTRO", tipoClinica: "CLINICA" });
    expect((error as AppError).statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(["NUTRICIONISTA", "ADMIN"])("deve permitir %s em clínica", (perfil) => {
    const { next, error } = run({ perfil, tipoClinica: "CLINICA" });
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(["ADMIN", "SECRETARIA", "NUTRICIONISTA"])(
    "deve manter acesso total para %s em clínica AUTONOMO",
    (perfil) => {
      const { next, error } = run({ perfil, tipoClinica: "AUTONOMO" });
      expect(error).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    },
  );
});
