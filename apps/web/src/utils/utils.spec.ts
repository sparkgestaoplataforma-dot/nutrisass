import { getInterpretacaoScore, getClasseCorPorNivel } from './scoreInterpretacao';
import { limparTelefone, obterMascaraTelefone, formatarTelefone } from './phone';
import { formatarDataBrasilia, formatarParaInputDateTime } from './date';

describe('Utilitários de Sistema (scoreInterpretacao, phone, date)', () => {
  describe('scoreInterpretacao', () => {
    const regrasMock: any[] = [
      { id: '1', pontuacaoMin: 0, pontuacaoMax: 20, classificacao: 'Saudável' },
      { id: '2', pontuacaoMin: 21, pontuacaoMax: 40, classificacao: 'Leve' },
      { id: '3', pontuacaoMin: 41, pontuacaoMax: 70, classificacao: 'Moderado' },
      { id: '4', pontuacaoMin: 71, pontuacaoMax: 150, classificacao: 'Severo' },
    ];

    it('deve classificar corretamente nos 4 níveis de risco', () => {
      expect(getInterpretacaoScore(12, regrasMock)).toEqual({
        classificacao: 'Saudável',
        nivel: 0,
      });
      expect(getInterpretacaoScore(30, regrasMock)).toEqual({
        classificacao: 'Leve',
        nivel: 1,
      });
      expect(getInterpretacaoScore(55, regrasMock)).toEqual({
        classificacao: 'Moderado',
        nivel: 2,
      });
      expect(getInterpretacaoScore(90, regrasMock)).toEqual({
        classificacao: 'Severo',
        nivel: 3,
      });
    });

    it('deve retornar fallback se lista de regras for vazia ou score fora das faixas', () => {
      expect(getInterpretacaoScore(10, [])).toEqual({
        classificacao: 'Sem classificação',
        nivel: 3,
      });
      expect(getInterpretacaoScore(999, regrasMock)).toEqual({
        classificacao: 'Sem classificação',
        nivel: 3,
      });
    });

    it('getClasseCorPorNivel deve mapear corretamente a classe CSS', () => {
      const styles = {
        observacaoGreen: 'cls-green',
        observacaoYellow: 'cls-yellow',
        observacaoOrange: 'cls-orange',
        observacaoRed: 'cls-red',
      };
      expect(getClasseCorPorNivel(0, styles)).toBe('cls-green');
      expect(getClasseCorPorNivel(3, styles)).toBe('cls-red');
    });
  });

  describe('phone', () => {
    it('deve limpar e remover código +55 de telefones brasileiros', () => {
      expect(limparTelefone('+55 (11) 98765-4321')).toBe('11987654321');
      expect(limparTelefone('(21) 3344-5566')).toBe('2133445566');
    });

    it('deve formatar celular (11 dígitos) e fixo (10 dígitos)', () => {
      expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
      expect(formatarTelefone('1133445566')).toBe('(11) 3344-5566');
      expect(obterMascaraTelefone('11987654321')).toBe('(##) #####-####');
      expect(obterMascaraTelefone('1133445566')).toBe('(##) ####-####');
    });
  });

  describe('date', () => {
    it('deve formatar data ISO no fuso de Brasília e lidar com valores inválidos', () => {
      expect(formatarDataBrasilia(null)).toBe('-');
      expect(formatarDataBrasilia('data-invalida')).toBe('Data inválida');
      expect(formatarDataBrasilia('2026-05-15T15:30:00.000Z')).toContain('15/05/2026');
      expect(formatarParaInputDateTime('2026-05-15T15:30:00.000Z')).toBe('2026-05-15T12:30');
    });
  });
});

