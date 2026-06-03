import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { onboardingSchema, type OnboardingInput } from "@nutricao/shared";
import { useAuthStore } from "@/stores/authStore";
import { postOnboarding, getMe } from "@/services/clinica";
import { criarQuestionarioDefault } from "@/services/questionarios";
import styles from "./OnboardingPage.module.scss";
import { PatternFormat } from "react-number-format";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Building04Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";

export function OnboardingPage() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [tipoSelecionado, setTipoSelecionado] = useState<
    "AUTONOMO" | "CLINICA" | null
  >(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
  });

  const mutation = useMutation({
    mutationFn: (input: OnboardingInput) =>
      postOnboarding({ ...input, tipo: tipoSelecionado! }),
    onSuccess: async (result) => {
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);

      const user = await getMe();
      setUser(user);

      // Cria o questionário padrão automaticamente ao cadastrar a clínica
      await criarQuestionarioDefault().catch(() => {
        // Silencia o erro caso o questionário default já exista
      });

      navigate("/dashboard");
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>NutriSaaS</h1>
        <p className={styles.subtitle}>
          {tipoSelecionado === null
            ? "Como você deseja usar a plataforma?"
            : tipoSelecionado === "AUTONOMO"
              ? "Cadastre seu consultório"
              : "Cadastre sua clínica"}
        </p>

        {tipoSelecionado === null ? (
          <>
            <div className={styles.typeSelection}>
              <button
                type="button"
                className={styles.typeCard}
                onClick={() => setTipoSelecionado("AUTONOMO")}
              >
                <HugeiconsIcon
                  icon={UserMultipleIcon}
                  size={32}
                  color="#16a34a"
                />
                <h3>Sou Autônomo(a)</h3>
                <p>
                  Trabalho sozinho(a) e quero gerenciar meus pacientes de forma
                  eficiente.
                </p>
              </button>

              <button
                type="button"
                className={styles.typeCard}
                onClick={() => setTipoSelecionado("CLINICA")}
              >
                <HugeiconsIcon
                  icon={Building04Icon}
                  size={32}
                  color="#16a34a"
                />
                <h3>Tenho uma Clínica</h3>
                <p>
                  Tenho uma equipe e quero gerenciar minha clínica e múltiplos
                  profissionais.
                </p>
              </button>
            </div>

            <p className={styles.loginLink}>
              Já tem conta? <Link to="/login">Acessar</Link>
            </p>
          </>
        ) : (
          <>
            <button
              className={styles.backBtn}
              onClick={() => setTipoSelecionado(null)}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} /> Voltar
            </button>

            <form
              className={styles.form}
              onSubmit={handleSubmit((data) => mutation.mutate(data))}
            >
              {mutation.error && (
                <div className={styles.apiError}>
                  {(mutation.error as any).response?.data?.message ||
                    "Erro ao cadastrar"}
                </div>
              )}

              <h3 className={styles.sectionTitle}>
                {tipoSelecionado === "AUTONOMO"
                  ? "Dados do Consultório"
                  : "Dados da Clínica"}
              </h3>

              <div className={styles.field}>
                <label>
                  {tipoSelecionado === "AUTONOMO"
                    ? "Nome do Consultório *"
                    : "Nome da Clínica *"}
                </label>
                <input
                  placeholder={
                    tipoSelecionado === "AUTONOMO"
                      ? "Ex: Consultório Nutri Vida"
                      : "Ex: Clínica Nutri Vida"
                  }
                  {...register("clinica.nome")}
                />
                {errors.clinica?.nome && (
                  <span className={styles.error}>
                    {errors.clinica.nome.message}
                  </span>
                )}
              </div>

              <div className={styles.row}>
                {tipoSelecionado === "CLINICA" && (
                  <div className={styles.field}>
                    <label>CNPJ</label>
                    <Controller
                      control={control}
                      name="clinica.cnpj"
                      render={({ field }) => (
                        <PatternFormat
                          value={field.value || ""}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          placeholder="00.000.000/0001-00"
                          format="##.###.###/####-##"
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </div>
                )}
                <div
                  className={styles.field}
                  style={{
                    gridColumn:
                      tipoSelecionado === "AUTONOMO" ? "span 2" : "auto",
                  }}
                >
                  <label>Telefone</label>
                  <Controller
                    control={control}
                    name="clinica.telefone"
                    render={({ field }) => (
                      <PatternFormat
                        value={field.value || ""}
                        onValueChange={(values) => {
                          field.onChange(values.value);
                        }}
                        placeholder="(00) 0000-0000"
                        format="(##) ####-#####"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
              </div>

              <h3 className={styles.sectionTitle}>
                {tipoSelecionado === "AUTONOMO"
                  ? "Seu Acesso"
                  : "Seu Acesso (Administrador)"}
              </h3>

              <div className={styles.field}>
                <label>Nome completo *</label>
                <input placeholder="Seu nome" {...register("admin.nome")} />
                {errors.admin?.nome && (
                  <span className={styles.error}>
                    {errors.admin.nome.message}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label>E-mail *</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  {...register("admin.email")}
                />
                {errors.admin?.email && (
                  <span className={styles.error}>
                    {errors.admin.email.message}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label>Senha *</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...register("admin.senha")}
                />
                {errors.admin?.senha && (
                  <span className={styles.error}>
                    {errors.admin.senha.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? "Cadastrando..."
                  : tipoSelecionado === "AUTONOMO"
                    ? "Cadastrar Consultório"
                    : "Cadastrar Clínica"}
              </button>

              <p className={styles.loginLink}>
                Já tem conta? <Link to="/login">Acessar</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
