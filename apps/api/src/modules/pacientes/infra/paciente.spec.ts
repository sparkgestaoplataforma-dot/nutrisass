import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { prismaMock } from "@/shared/providers/__mocks__/prisma";
import { AppError } from "@/shared/middlewares/errorHandler";
import {
  createPacienteSchema,
  updatePacienteSchema,
  validarCpf,
  normalizarTelefone,
  validarDataNascimento,
} from "@nutricao/shared";
import * as service from "./pacientes.service";
import * as controller from "./pacientes.controller";
import * as avaliacoesService from "../../avaliacoes/infra/avaliacoes.service";

vi.mock("../../avaliacoes/infra/avaliacoes.service", () => ({
  pegarAvaliacoesPorPacienteId: vi.fn().mockResolvedValue([]),
}));

/* ==========================================================================
   1. TESTES DE SCHEMAS E VALIDAÇÕES (ZOD)
   ========================================================================== */
describe("paciente.schema", () => {
  describe("validarCpf", () => {
    it("deve validar CPFs válidos conhecidos com e sem máscara", () => {
      expect(validarCpf("52998224725")).toBe(true);
      expect(validarCpf("529.982.247-25")).toBe(true);
      expect(validarCpf("11144477735")).toBe(true);
      expect(validarCpf("111.444.777-35")).toBe(true);
    });

    it("deve rejeitar CPFs com dígitos repetidos", () => {
      expect(validarCpf("00000000000")).toBe(false);
      expect(validarCpf("11111111111")).toBe(false);
      expect(validarCpf("22222222222")).toBe(false);
      expect(validarCpf("99999999999")).toBe(false);
    });

    it("deve rejeitar CPFs com dígitos verificadores incorretos", () => {
      expect(validarCpf("52998224726")).toBe(false);
      expect(validarCpf("12345678900")).toBe(false);
      expect(validarCpf("11144477736")).toBe(false);
    });

    it("deve rejeitar CPFs com tamanho diferente de 11", () => {
      expect(validarCpf("123")).toBe(false);
      expect(validarCpf("")).toBe(false);
      expect(validarCpf("123456789012")).toBe(false);
    });
  });

  describe("normalizarTelefone", () => {
    it("deve remover máscara e manter DDD + número", () => {
      expect(normalizarTelefone("(83) 99051-1262")).toBe("83990511262");
      expect(normalizarTelefone("(83) 3243-0475")).toBe("8332430475");
    });

    it("deve remover prefixo 55 internacional", () => {
      expect(normalizarTelefone("+55 (83) 99051-1262")).toBe("83990511262");
      expect(normalizarTelefone("5583990511262")).toBe("83990511262");
    });
  });

  describe("validarDataNascimento", () => {
    it("deve aceitar datas válidas no passado", () => {
      expect(validarDataNascimento("1990-05-20")).toBe(true);
      expect(validarDataNascimento("2000-01-01")).toBe(true);
    });

    it("deve aceitar a data atual (hoje)", () => {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");
      const dataHojeStr = `${ano}-${mes}-${dia}`;

      expect(validarDataNascimento(dataHojeStr)).toBe(true);
    });

    it("deve rejeitar datas futuras em relação a hoje", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 2); // 2 dias no futuro
      const ano = futuro.getFullYear();
      const mes = String(futuro.getMonth() + 1).padStart(2, "0");
      const dia = String(futuro.getDate()).padStart(2, "0");
      const dataFuturaStr = `${ano}-${mes}-${dia}`;

      expect(validarDataNascimento(dataFuturaStr)).toBe(false);
      expect(validarDataNascimento("2099-12-31")).toBe(false);
    });

    it("deve aceitar valores vazios quando opcional", () => {
      expect(validarDataNascimento("")).toBe(true);
    });

    it("deve rejeitar formatos de data inválidos ou anos anômalos", () => {
      expect(validarDataNascimento("data-invalida")).toBe(false);
      expect(validarDataNascimento("1800-01-01")).toBe(false);
    });
  });

  describe("createPacienteSchema", () => {
    const validPayload = {
      nome: "Isabela Ataide Rosendo",
      cpf: "529.982.247-25",
      whatsapp: "(83) 99051-1262",
    };

    it("deve validar com sucesso apenas os campos obrigatórios", () => {
      const result = createPacienteSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe("Isabela Ataide Rosendo");
        expect(result.data.cpf).toBe("52998224725");
        expect(result.data.whatsapp).toBe("83990511262");
      }
    });

    it("deve sanitizar o nome removendo espaços excedentes", () => {
      const result = createPacienteSchema.safeParse({
        ...validPayload,
        nome: "  Maria   da   Silva  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe("Maria da Silva");
      }
    });

    it("deve rejeitar nome com menos de 2 caracteres", () => {
      const result = createPacienteSchema.safeParse({
        ...validPayload,
        nome: "A",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar CPF inválido", () => {
      const result = createPacienteSchema.safeParse({
        ...validPayload,
        cpf: "111.111.111-11",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar WhatsApp com menos de 10 dígitos", () => {
      const result = createPacienteSchema.safeParse({
        ...validPayload,
        whatsapp: "123456789",
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar data de nascimento válida no passado ou hoje", () => {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");
      const hojeStr = `${ano}-${mes}-${dia}`;

      const resPassado = createPacienteSchema.safeParse({
        ...validPayload,
        dataNascimento: "1995-10-10",
      });
      expect(resPassado.success).toBe(true);

      const resHoje = createPacienteSchema.safeParse({
        ...validPayload,
        dataNascimento: hojeStr,
      });
      expect(resHoje.success).toBe(true);
    });

    it("deve rejeitar data de nascimento no futuro", () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 5);
      const ano = futuro.getFullYear();
      const mes = String(futuro.getMonth() + 1).padStart(2, "0");
      const dia = String(futuro.getDate()).padStart(2, "0");

      const result = createPacienteSchema.safeParse({
        ...validPayload,
        dataNascimento: `${ano}-${mes}-${dia}`,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.dataNascimento).toBeDefined();
      }
    });

    it("deve converter campos opcionais vazios '' para null", () => {
      const result = createPacienteSchema.safeParse({
        ...validPayload,
        email: "",
        telefone: "",
        convenioId: "",
        dataNascimento: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeNull();
        expect(result.data.telefone).toBeNull();
        expect(result.data.convenioId).toBeNull();
        expect(result.data.dataNascimento).toBeNull();
      }
    });
  });

  describe("updatePacienteSchema", () => {
    it("deve rejeitar payload completamente vazio", () => {
      const result = updatePacienteSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("deve permitir atualização parcial válida com apenas um campo", () => {
      const result = updatePacienteSchema.safeParse({
        nome: "Novo Nome Paciente",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe("Novo Nome Paciente");
        expect(result.data.cpf).toBeUndefined();
      }
    });

    it("deve permitir limpar campos opcionais passando '' ou null", () => {
      const result = updatePacienteSchema.safeParse({
        email: "",
        telefone: "",
        dataNascimento: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeNull();
        expect(result.data.telefone).toBeNull();
        expect(result.data.dataNascimento).toBeNull();
      }
    });

    it("deve validar CPF se fornecido na atualização", () => {
      const result = updatePacienteSchema.safeParse({
        cpf: "00000000000",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar data de nascimento futura na atualização", () => {
      const result = updatePacienteSchema.safeParse({
        dataNascimento: "2099-01-01",
      });
      expect(result.success).toBe(false);
    });
  });
});

/* ==========================================================================
   2. TESTES DA CAMADA DE SERVIÇO (pacientes.service)
   ========================================================================== */
describe("pacientes.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPacienteId = "paciente-1";
  const mockClinicaId = "clinica-1";
  const mockQuestionarioId = "questionario-1";

  describe("listarPacientes", () => {
    it("deve retornar lista paginada de pacientes da clínica", async () => {
      const mockPacientes = [
        {
          id: "p1",
          nome: "Ana Souza",
          email: "ana@email.com",
          telefone: null,
          whatsapp: "83999999999",
          cpf: "52998224725",
          convenio: null,
        },
      ];

      prismaMock.paciente.findMany.mockResolvedValue(mockPacientes as any);
      prismaMock.paciente.count.mockResolvedValue(1);

      const result = await service.listarPacientes(mockClinicaId, undefined, 1, 20);

      expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clinicaId: mockClinicaId },
          skip: 0,
          take: 20,
        }),
      );
      expect(result.data).toEqual(mockPacientes);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("deve aplicar filtros de busca por nome, documento e telefone", async () => {
      prismaMock.paciente.findMany.mockResolvedValue([]);
      prismaMock.paciente.count.mockResolvedValue(0);

      await service.listarPacientes(mockClinicaId, "Maria 123", 2, 10);

      expect(prismaMock.paciente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clinicaId: mockClinicaId,
            OR: expect.arrayContaining([
              { nome: { contains: "Maria 123", mode: "insensitive" } },
              { cpf: { contains: "Maria 123" } },
            ]),
          }),
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe("buscarPacientePorId", () => {
    it("deve retornar o paciente quando encontrado na clínica", async () => {
      const mockPaciente = {
        id: mockPacienteId,
        clinicaId: mockClinicaId,
        nome: "João",
        convenio: null,
        agendamentos: [],
      };

      prismaMock.paciente.findFirst.mockResolvedValue(mockPaciente as any);

      const result = await service.buscarPacientePorId(mockPacienteId, mockClinicaId);

      expect(prismaMock.paciente.findFirst).toHaveBeenCalledWith({
        where: { id: mockPacienteId, clinicaId: mockClinicaId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPaciente);
    });

    it("deve lançar 404 se o paciente não for encontrado ou pertencer a outra clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);

      await expect(
        service.buscarPacientePorId(mockPacienteId, mockClinicaId),
      ).rejects.toThrow(new AppError("Paciente não encontrado", 404));
    });
  });

  describe("criarPaciente", () => {
    const payload = {
      nome: "Carlos Eduardo",
      cpf: "52998224725",
      whatsapp: "83999999999",
      email: "carlos@email.com",
      convenioId: "conv-1",
    };

    it("deve criar o paciente com sucesso vinculado à clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      prismaMock.convenio.findFirst.mockResolvedValue({ id: "conv-1", clinicaId: mockClinicaId } as any);
      prismaMock.paciente.create.mockResolvedValue({ id: "novo-id", ...payload } as any);

      const result = await service.criarPaciente(mockClinicaId, payload as any);

      expect(prismaMock.paciente.findFirst).toHaveBeenCalledWith({
        where: { clinicaId: mockClinicaId, cpf: payload.cpf },
      });
      expect(prismaMock.paciente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicaId: mockClinicaId,
            nome: "Carlos Eduardo",
            cpf: "52998224725",
          }),
        }),
      );
      expect(result.id).toBe("novo-id");
    });

    it("deve lançar 409 quando o CPF já estiver cadastrado na mesma clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({ id: "outro-id", cpf: payload.cpf } as any);

      await expect(service.criarPaciente(mockClinicaId, payload as any)).rejects.toThrow(
        new AppError("Já existe um paciente cadastrado com este CPF nesta clínica", 409),
      );
    });

    it("deve lançar 400 se o convênio não pertencer à clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);
      prismaMock.convenio.findFirst.mockResolvedValue(null);

      await expect(service.criarPaciente(mockClinicaId, payload as any)).rejects.toThrow(
        new AppError(
          "Convênio informado não pertence a esta clínica ou não foi encontrado",
          400,
        ),
      );
    });
  });

  describe("editarPaciente", () => {
    it("deve atualizar os dados do paciente com sucesso", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
        cpf: "52998224725",
      } as any);
      prismaMock.paciente.update.mockResolvedValue({
        id: mockPacienteId,
        nome: "Nome Atualizado",
      } as any);

      const result = await service.editarPaciente(mockPacienteId, mockClinicaId, {
        nome: "Nome Atualizado",
      });

      expect(prismaMock.paciente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPacienteId },
          data: expect.objectContaining({ nome: "Nome Atualizado" }),
        }),
      );
      expect(result.nome).toBe("Nome Atualizado");
    });

    it("deve lançar 409 se tentar alterar o CPF para um já existente na mesma clínica", async () => {
      prismaMock.paciente.findFirst
        .mockResolvedValueOnce({
          id: mockPacienteId,
          clinicaId: mockClinicaId,
          cpf: "52998224725",
        } as any)
        .mockResolvedValueOnce({
          id: "outro-paciente",
          cpf: "11144477735",
        } as any);

      await expect(
        service.editarPaciente(mockPacienteId, mockClinicaId, { cpf: "11144477735" }),
      ).rejects.toThrow(
        new AppError(
          "Já existe outro paciente cadastrado com este CPF nesta clínica",
          409,
        ),
      );
    });

    it("deve lançar 404 se o paciente a editar não for encontrado na clínica", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);

      await expect(
        service.editarPaciente(mockPacienteId, mockClinicaId, { nome: "Teste" }),
      ).rejects.toThrow(new AppError("Paciente não encontrado", 404));
    });
  });

  describe("excluirPaciente", () => {
    it("deve excluir o paciente com sucesso se não houver registros vinculados", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
        _count: {
          agendamentos: 0,
          evolucoes: 0,
          medidas: 0,
          solicitacoes: 0,
          avaliacoesQuestionarios: 0,
          planosAlimentares: 0,
        },
      } as any);

      prismaMock.paciente.delete.mockResolvedValue({ id: mockPacienteId } as any);

      const result = await service.excluirPaciente(mockPacienteId, mockClinicaId);

      expect(prismaMock.paciente.delete).toHaveBeenCalledWith({
        where: { id: mockPacienteId },
      });
      expect(result.message).toBe("Paciente excluído com sucesso");
    });

    it("deve lançar 400 e bloquear exclusão se houver registros clínicos vinculados", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
        _count: {
          agendamentos: 2,
          evolucoes: 0,
          medidas: 0,
          solicitacoes: 0,
          avaliacoesQuestionarios: 1,
          planosAlimentares: 0,
        },
      } as any);

      await expect(service.excluirPaciente(mockPacienteId, mockClinicaId)).rejects.toThrow(
        new AppError(
          "Não é possível excluir o paciente pois existem agendamentos ou registros clínicos vinculados ao seu prontuário.",
          400,
        ),
      );
      expect(prismaMock.paciente.delete).not.toHaveBeenCalled();
    });

    it("deve lançar 404 se paciente não existir", async () => {
      prismaMock.paciente.findFirst.mockResolvedValue(null);

      await expect(service.excluirPaciente(mockPacienteId, mockClinicaId)).rejects.toThrow(
        new AppError("Paciente não encontrado", 404),
      );
    });
  });

  describe("pegarNomePacientePorId", () => {
    it("deve retornar o nome do paciente", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({ nome: "João" } as any);

      const result = await service.pegarNomePacientePorId(mockPacienteId);

      expect(prismaMock.paciente.findUnique).toHaveBeenCalledWith({
        where: { id: mockPacienteId },
        select: { nome: true },
      });
      expect(result).toBe("João");
    });

    it("deve lançar erro se paciente não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue(null);

      await expect(service.pegarNomePacientePorId(mockPacienteId)).rejects.toThrow(
        new AppError("Paciente não encontrado", 404),
      );
    });
  });

  describe("criarAvaliacaoPaciente", () => {
    it("deve criar uma avaliação com sucesso", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
      } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({
        id: mockQuestionarioId,
        clinicaId: mockClinicaId,
        ativo: true,
      } as any);
      prismaMock.avaliacao.create.mockResolvedValue({
        id: "nova-avaliacao",
        scoreTotal: 10,
      } as any);

      const data = {
        respostas: [
          { perguntaId: "p1", nota: 5 },
          { perguntaId: "p2", nota: 5 },
        ],
      };

      const result = await service.criarAvaliacaoPaciente(
        mockPacienteId,
        mockQuestionarioId,
        data,
      );

      expect(prismaMock.avaliacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicaId: mockClinicaId,
            pacienteId: mockPacienteId,
            questionarioId: mockQuestionarioId,
            scoreTotal: 10,
          }),
        }),
      );
      expect(result.id).toBe("nova-avaliacao");
      expect(result.scoreTotal).toBe(10);
    });

    it("deve lançar erro se o paciente não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue(null);
      await expect(
        service.criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, {
          respostas: [],
        }),
      ).rejects.toThrow(new AppError("Paciente não encontrado", 404));
    });

    it("deve lançar erro se o questionário não for encontrado", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
      } as any);
      prismaMock.questionario.findUnique.mockResolvedValue(null);

      await expect(
        service.criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, {
          respostas: [],
        }),
      ).rejects.toThrow(new AppError("Questionário não encontrado", 404));
    });

    it("deve lançar erro se o questionário estiver inativo", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
      } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({
        id: mockQuestionarioId,
        clinicaId: mockClinicaId,
        ativo: false,
      } as any);

      await expect(
        service.criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, {
          respostas: [],
        }),
      ).rejects.toThrow(
        new AppError(
          "Questionário inativo. Utilize a versão ativa mais recente",
          400,
        ),
      );
    });

    it("deve lançar erro se o paciente e questionário forem de clínicas diferentes", async () => {
      prismaMock.paciente.findUnique.mockResolvedValue({
        id: mockPacienteId,
        clinicaId: mockClinicaId,
      } as any);
      prismaMock.questionario.findUnique.mockResolvedValue({
        id: mockQuestionarioId,
        clinicaId: "outra-clinica",
        ativo: true,
      } as any);

      await expect(
        service.criarAvaliacaoPaciente(mockPacienteId, mockQuestionarioId, {
          respostas: [],
        }),
      ).rejects.toThrow(
        new AppError(
          "Paciente e questionário não pertencem à mesma clínica",
          400,
        ),
      );
    });
  });

  describe("pegarAvaliacoesPaciente", () => {
    it("deve repassar a chamada para avaliacoesService", async () => {
      await service.pegarAvaliacoesPaciente(mockPacienteId, mockClinicaId, 1, 10);
      expect(
        avaliacoesService.pegarAvaliacoesPorPacienteId,
      ).toHaveBeenCalledWith(mockPacienteId, mockClinicaId, 1, 10);
    });
  });
});

/* ==========================================================================
   3. TESTES DA CAMADA DE CONTROLLER (pacientes.controller)
   ========================================================================== */
describe("pacientes.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: {
        clinicaId: "clinica-1",
        userId: "user-1",
        email: "test@nutri.com",
        perfil: "NUTRICIONISTA",
        tipoClinica: "CLINICA",
      },
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  describe("listar", () => {
    it("deve listar os pacientes e retornar com status 200", async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      vi.spyOn(service, "listarPacientes").mockResolvedValue(mockResult as any);

      await controller.listar(req as Request, res as Response);

      expect(service.listarPacientes).toHaveBeenCalledWith("clinica-1", undefined, 1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockResult });
    });

    it("deve passar parâmetros válidos de query para o service", async () => {
      req.query = { busca: "Isabela", page: "2", limit: "15" };
      vi.spyOn(service, "listarPacientes").mockResolvedValue({} as any);

      await controller.listar(req as Request, res as Response);

      expect(service.listarPacientes).toHaveBeenCalledWith("clinica-1", "Isabela", 2, 15);
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar o paciente por ID e retornar 200", async () => {
      req.params = { id: validUuid };
      vi.spyOn(service, "buscarPacientePorId").mockResolvedValue({
        id: validUuid,
        nome: "Isabela",
      } as any);

      await controller.buscarPorId(req as any, res as Response);

      expect(service.buscarPacientePorId).toHaveBeenCalledWith(validUuid, "clinica-1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: validUuid, nome: "Isabela" },
      });
    });

    it("deve rejeitar se o ID não for um UUID válido", async () => {
      req.params = { id: "id-invalido" };

      await expect(controller.buscarPorId(req as any, res as Response)).rejects.toThrow();
    });
  });

  describe("criar", () => {
    it("deve criar o paciente e responder com status 201", async () => {
      req.body = {
        nome: "Ana Clara",
        cpf: "52998224725",
        whatsapp: "83999999999",
      };
      vi.spyOn(service, "criarPaciente").mockResolvedValue({
        id: validUuid,
        ...req.body,
      } as any);

      await controller.criar(req as Request, res as Response);

      expect(service.criarPaciente).toHaveBeenCalledWith("clinica-1", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: validUuid, ...req.body },
      });
    });
  });

  describe("editar", () => {
    it("deve atualizar os dados do paciente e responder com status 200", async () => {
      req.params = { id: validUuid };
      req.body = { nome: "Nome Atualizado" };
      vi.spyOn(service, "editarPaciente").mockResolvedValue({
        id: validUuid,
        nome: "Nome Atualizado",
      } as any);

      await controller.editar(req as any, res as Response);

      expect(service.editarPaciente).toHaveBeenCalledWith(validUuid, "clinica-1", req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: validUuid, nome: "Nome Atualizado" },
      });
    });
  });

  describe("excluir", () => {
    it("deve excluir o paciente e responder com mensagem de sucesso", async () => {
      req.params = { id: validUuid };
      vi.spyOn(service, "excluirPaciente").mockResolvedValue({
        message: "Paciente excluído com sucesso",
      } as any);

      await controller.excluir(req as any, res as Response);

      expect(service.excluirPaciente).toHaveBeenCalledWith(validUuid, "clinica-1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Paciente excluído",
      });
    });
  });

  describe("buscarNomePorId", () => {
    it("deve retornar o nome público do paciente", async () => {
      req.params = { id: validUuid };
      vi.spyOn(service, "pegarNomePacientePorId").mockResolvedValue("João");

      await controller.buscarNomePorId(req as any, res as Response);

      expect(service.pegarNomePacientePorId).toHaveBeenCalledWith(validUuid);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { nome: "João" },
      });
    });
  });
});
