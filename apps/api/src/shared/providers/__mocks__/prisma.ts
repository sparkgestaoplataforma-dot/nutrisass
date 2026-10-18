import { PrismaClient } from "../../../../prisma/generated/client";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { vi, beforeEach } from "vitest";

export const prismaMock = mockDeep<PrismaClient>();

vi.mock("@/shared/providers/prisma", () => ({
  __esModule: true,
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
