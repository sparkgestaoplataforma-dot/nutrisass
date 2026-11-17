import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  createPacienteSchema,
  type CreatePacienteInput,
} from "@nutricao/shared";
import { getPacientePorId, criarPaciente, editarPaciente } from "@/services/pacientes";
import { listarConvenios } from "@/services/convenios";
import { buscarEnderecoPorCep } from "@/services/cep";
import styles from "./PacienteFormPage.module.scss";
import { PatternFormat } from "react-number-format";
import { obterMascaraTelefone } from "@/utils/phone";

export function PacienteFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: convenios } = useQuery({
    queryKey: ["convenios-select"],
    queryFn: () => listarConvenios(),
  });

  const { data: pacienteData } = useQuery({
    queryKey: ["paciente", id],
    queryFn: () => getPacientePorId(id!),
    enabled: isEditing,
  });

  const [carregandoCep, setCarregandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const ultimoCepConsultado = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreatePacienteInput>({
    resolver: zodResolver(createPacienteSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      whatsapp: "",
      sexo: undefined,
      dataNascimento: "",
      identidade: "",
      ufIdentidade: "",
      orgaoExpedidor: "",
      cpf: "",
      cep: "",
      endereco: "",
      bairro: "",
      municipio: "",
      uf: "",
      profissao: "",
      escolaridade: "",
      nomeMae: "",
      convenioId: "",
      numeroCarteira: "",
      validadeCarteira: "",
    },
  });

  useEffect(() => {
    if (pacienteData) {
      if (pacienteData.cep) {
        ultimoCepConsultado.current = pacienteData.cep.replace(/\D/g, "");
      }
      reset({
        nome: pacienteData.nome || "",
        email: pacienteData.email || "",
        telefone: pacienteData.telefone || "",
        whatsapp: pacienteData.whatsapp || "",
        sexo: pacienteData.sexo || undefined,
        dataNascimento: pacienteData.dataNascimento
          ? pacienteData.dataNascimento.split("T")[0]
          : "",
        identidade: pacienteData.identidade || "",
        ufIdentidade: pacienteData.ufIdentidade || "",
        orgaoExpedidor: pacienteData.orgaoExpedidor || "",
        cpf: pacienteData.cpf || "",
        cep: pacienteData.cep || "",
        endereco: pacienteData.endereco || "",
        bairro: pacienteData.bairro || "",
        municipio: pacienteData.municipio || "",
        uf: pacienteData.uf || "",
        profissao: pacienteData.profissao || "",
        escolaridade: pacienteData.escolaridade || "",
        nomeMae: pacienteData.nomeMae || "",
        convenioId: pacienteData.convenioId || "",
        numeroCarteira: pacienteData.numeroCarteira || "",
        validadeCarteira: pacienteData.validadeCarteira
          ? pacienteData.validadeCarteira.split("T")[0]
          : "",
      });
    }
  }, [pacienteData, reset]);

  async function handleCepChange(rawCep: string) {
    const cleanCep = (rawCep || "").replace(/\D/g, "");

    if (cleanCep.length === 8) {
      if (cleanCep === ultimoCepConsultado.current) return;
      ultimoCepConsultado.current = cleanCep;
      setCarregandoCep(true);
      setErroCep(null);

      try {
        const dados = await buscarEnderecoPorCep(cleanCep);
        if (dados) {
          setValue("endereco", dados.logradouro, { shouldValidate: true, shouldDirty: true });
          setValue("bairro", dados.bairro, { shouldValidate: true, shouldDirty: true });
          setValue("municipio", dados.municipio, { shouldValidate: true, shouldDirty: true });
          setValue("uf", dados.uf, { shouldValidate: true, shouldDirty: true });
          setErroCep(null);
        } else {
          ultimoCepConsultado.current = null;
          setErroCep("CEP não encontrado");
        }
      } catch {
        ultimoCepConsultado.current = null;
        setErroCep("Erro ao buscar CEP");
      } finally {
        setCarregandoCep(false);
      }
    } else {
      if (cleanCep.length === 0) {
        ultimoCepConsultado.current = null;
      }
      setErroCep(null);
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: CreatePacienteInput) => {
      if (isEditing) {
        return editarPaciente(id!, data);
      }
      return criarPaciente(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      navigate("/pacientes");
    },
  });

  return (
    <div>
      <div className={styles.header}>
        <h2>{isEditing ? "Editar Paciente" : "Novo Paciente"}</h2>
        <button
          className={styles.voltarBtn}
          onClick={() => navigate("/pacientes")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} />{" "}
          Voltar
        </button>
      </div>

      <div className={styles.card}>
        {mutation.error && (
          <div className={styles.apiError}>
            {(mutation.error as any).response?.data?.message ||
              "Erro ao salvar"}
          </div>
        )}

        <form
          onSubmit={handleSubmit(
            (data) => mutation.mutate(data),
            (formErrors) => console.warn("Erros de validação:", formErrors)
          )}
        >
          <div className={styles.section}>
            <h3>Dados Pessoais</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Nome *</label>
                <input {...register("nome")} placeholder="Nome completo" />
                {errors.nome?.message && (
                  <span className={styles.error}>{String(errors.nome.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>E-mail</label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="email@exemplo.com"
                />
                {errors.email?.message && (
                  <span className={styles.error}>{String(errors.email.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Telefone</label>
                <Controller
                  control={control}
                  name="telefone"
                  render={({ field }) => (
                    <PatternFormat
                      value={field.value || ""}
                      onValueChange={(values) => {
                        field.onChange(values.value);
                      }}
                      placeholder="(00) 0000-0000"
                      format={obterMascaraTelefone(field.value || "")}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {errors.telefone?.message && (
                  <span className={styles.error}>{String(errors.telefone.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>WhatsApp *</label>
                <Controller
                  control={control}
                  name="whatsapp"
                  render={({ field }) => (
                    <PatternFormat
                      value={field.value || ""}
                      onValueChange={(values) => {
                        field.onChange(values.value);
                      }}
                      placeholder="(00) 00000-0000"
                      format={obterMascaraTelefone(field.value || "")}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {errors.whatsapp?.message && (
                  <span className={styles.error}>{String(errors.whatsapp.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Sexo</label>
                <select {...register("sexo")}>
                  <option value="">Selecione</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
                {errors.sexo?.message && (
                  <span className={styles.error}>{String(errors.sexo.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Data de Nascimento</label>
                <input type="date" {...register("dataNascimento")} />
                {errors.dataNascimento?.message && (
                  <span className={styles.error}>{String(errors.dataNascimento.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Profissão</label>
                <input {...register("profissao")} />
              </div>
              <div className={styles.field}>
                <label>Escolaridade</label>
                <input {...register("escolaridade")} />
              </div>
              <div className={styles.field}>
                <label>Nome da Mãe</label>
                <input {...register("nomeMae")} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Documentos</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>CPF *</label>
                <Controller
                  control={control}
                  name="cpf"
                  render={({ field }) => (
                    <PatternFormat
                      value={field.value || ""}
                      onValueChange={(values) => {
                        field.onChange(values.value);
                      }}
                      placeholder="000.000.000-00"
                      format="###.###.###-##"
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {errors.cpf?.message && (
                  <span className={styles.error}>{String(errors.cpf.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Identidade</label>
                <input {...register("identidade")} />
              </div>
              <div className={styles.field}>
                <label>Órgão Expedidor</label>
                <input {...register("orgaoExpedidor")} />
              </div>
              <div className={styles.field}>
                <label>UF Identidade</label>
                <input
                  {...register("ufIdentidade")}
                  maxLength={2}
                  placeholder="UF"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Endereço</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <div className={styles.labelWithStatus}>
                  <label>CEP</label>
                  {carregandoCep && <span className={styles.cepLoading}>Buscando endereço...</span>}
                  {erroCep && <span className={styles.cepErrorText}>{erroCep}</span>}
                </div>

                <div className={styles.inputWrapper}>
                  <Controller
                    control={control}
                    name="cep"
                    render={({ field }) => (
                      <PatternFormat
                        value={field.value || ""}
                        onValueChange={(values) => {
                          field.onChange(values.value);
                          handleCepChange(values.value);
                        }}
                        placeholder="00000-000"
                        format="#####-###"
                        onBlur={(e) => {
                          field.onBlur();
                          handleCepChange(e.target.value);
                        }}
                      />
                    )}
                  />
                  {carregandoCep && (
                    <span className={styles.spinnerIcon}>
                      <span className={styles.spinner} />
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.field}>
                <label>Endereço</label>
                <input {...register("endereco")} />
              </div>
              <div className={styles.field}>
                <label>Bairro</label>
                <input {...register("bairro")} />
              </div>
              <div className={styles.field}>
                <label>Município</label>
                <input {...register("municipio")} />
              </div>
              <div className={styles.field}>
                <label>UF</label>
                <input {...register("uf")} maxLength={2} placeholder="UF" />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Convênio</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Convênio</label>
                <select {...register("convenioId")}>
                  <option value="">Particular</option>
                  {convenios?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {errors.convenioId?.message && (
                  <span className={styles.error}>{String(errors.convenioId.message)}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Número Carteira</label>
                <input {...register("numeroCarteira")} />
              </div>
              <div className={styles.field}>
                <label>Validade Carteira</label>
                <input type="date" {...register("validadeCarteira")} />
                {errors.validadeCarteira?.message && (
                  <span className={styles.error}>{String(errors.validadeCarteira.message)}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/pacientes")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Salvando..."
                : isEditing
                  ? "Salvar"
                  : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
