import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout/DashboardLayout';
import { LoginPage } from '@/pages/Login/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { AgendaPage } from '@/pages/Agenda/AgendaPage';
import { PacientesPage } from '@/pages/Pacientes/Listagem/PacientesPage';
import { PacienteFormPage } from '@/pages/Pacientes/Cadastro/PacienteFormPage';
import { ProntuarioPage } from '@/pages/Pacientes/Prontuario/ProntuarioPage';
import { ConfigPage } from '@/pages/Configuracoes/ConfigPage';
import { RelatoriosPage } from '@/pages/Relatorios/RelatoriosPage';
import { ExamesPage } from '@/pages/Exames/ExamesPage';
import { OnboardingPage } from '@/pages/Onboarding/OnboardingPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<OnboardingPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/pacientes/novo" element={<PacienteFormPage />} />
            <Route path="/pacientes/:id" element={<ProntuarioPage />} />
            <Route path="/pacientes/:id/editar" element={<PacienteFormPage />} />
            <Route path="/exames" element={<ExamesPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/configuracoes" element={<ConfigPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
