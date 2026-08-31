/**
 * Camada de sanitização de entrada (defesa XSS / injeção de prompt).
 * Todo texto digitado pelo usuário passa por aqui antes de ir ao banco ou à IA.
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const HTML_CHARS = /[<>]/g;
// Marcadores comuns de injeção de prompt
const PROMPT_INJECTION =
  /(ignore\s+(as\s+)?(instru[çc][õo]es|previous|todas)|system\s*:|assistant\s*:|<\|.*?\|>)/gi;

export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHARS, ' ')
    .replace(HTML_CHARS, '')
    .replace(PROMPT_INJECTION, '')
    .replace(/\s{3,}/g, '  ')
    .trim()
    .slice(0, maxLength);
}

/** Sanitização para blocos longos (teoria, enunciados) preservando quebras de linha. */
export function sanitizeRich(input: string, maxLength = 20000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(HTML_CHARS, '')
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Aceita telefones brasileiros com 10 ou 11 dígitos (com ou sem máscara). */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
