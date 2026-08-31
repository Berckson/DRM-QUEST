export interface PasswordCheck {
  label: string;
  ok: boolean;
}

export interface PasswordStrength {
  score: number; // 0-5
  percent: number;
  label: string;
  color: string;
  checks: PasswordCheck[];
  valid: boolean;
}

export function evaluatePassword(password: string): PasswordStrength {
  const checks: PasswordCheck[] = [
    { label: 'Mínimo de 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', ok: /[a-z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
    { label: 'Caractere especial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'];
  const colors = [
    'bg-destructive',
    'bg-destructive',
    'bg-warning',
    'bg-warning',
    'bg-success',
    'bg-success',
  ];
  return {
    score,
    percent: (score / checks.length) * 100,
    label: labels[score],
    color: colors[score],
    checks,
    valid: score === checks.length,
  };
}

/** Mensagens amigáveis para erros nativos do Supabase (inclui rate limiting). */
export function friendlyAuthError(message: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('seconds'))
    return 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.';
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já possui uma conta. Faça login.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('password')) return 'Senha inválida: use ao menos 8 caracteres com letras, números e símbolos.';
  return 'Não foi possível concluir. Tente novamente.';
}
