import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { onboardingSchema, type OnboardingInput, type ApiResponse, type AuthTokens, type TokenPayload } from '@nutricao/shared';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import styles from './OnboardingPage.module.scss';

export function OnboardingPage() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
  });

  const mutation = useMutation({
    mutationFn: async (input: OnboardingInput) => {
      const { data } = await api.post<ApiResponse<{ clinica: any; tokens: AuthTokens }>>('/clinica/onboarding', input);
      return data.data!;
    },
    onSuccess: async (result) => {
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);

      const { data } = await api.get<ApiResponse<TokenPayload>>('/auth/me');
      setUser(data.data!);

      navigate('/');
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>NutriSaaS</h1>
        <p className={styles.subtitle}>Cadastre sua clínica</p>

        <form className={styles.form} onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          {mutation.error && (
            <div className={styles.apiError}>
              {(mutation.error as any).response?.data?.message || 'Erro ao cadastrar'}
            </div>
          )}

          <h3 className={styles.sectionTitle}>Dados da Clínica</h3>

          <div className={styles.field}>
            <label>Nome da Clínica *</label>
            <input placeholder="Ex: Clínica Nutri Vida" {...register('clinica.nome')} />
            {errors.clinica?.nome && <span className={styles.error}>{errors.clinica.nome.message}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>CNPJ</label>
              <input placeholder="00.000.000/0001-00" {...register('clinica.cnpj')} />
            </div>
            <div className={styles.field}>
              <label>Telefone</label>
              <input placeholder="(00) 0000-0000" {...register('clinica.telefone')} />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Seu Acesso (Administrador)</h3>

          <div className={styles.field}>
            <label>Nome completo *</label>
            <input placeholder="Seu nome" {...register('admin.nome')} />
            {errors.admin?.nome && <span className={styles.error}>{errors.admin.nome.message}</span>}
          </div>

          <div className={styles.field}>
            <label>E-mail *</label>
            <input type="email" placeholder="seu@email.com" {...register('admin.email')} />
            {errors.admin?.email && <span className={styles.error}>{errors.admin.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Senha *</label>
            <input type="password" placeholder="Mínimo 6 caracteres" {...register('admin.senha')} />
            {errors.admin?.senha && <span className={styles.error}>{errors.admin.senha.message}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Cadastrando...' : 'Cadastrar Clínica'}
          </button>

          <p className={styles.loginLink}>
            Já tem conta? <Link to="/login">Acessar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
