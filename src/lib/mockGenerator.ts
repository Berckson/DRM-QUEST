import { Activity, Question } from '@/types/activity';

const ORIGINS = ['ENEM', 'ITA', 'FUVEST', 'UNICAMP', 'UERJ', 'UFRJ', 'PUC', 'UNESP'];

const THEORY_TEMPLATES: Record<string, string> = {
  default: `O tema abordado é fundamental para a compreensão dos conceitos básicos da disciplina. A seguir, apresentamos um resumo teórico seguido de questões para prática e fixação do conteúdo.

**Conceitos Fundamentais:**
• Definição e propriedades básicas
• Aplicações práticas no cotidiano
• Relação com outros tópicos da disciplina

**Fórmulas e Relações Importantes:**
As relações matemáticas e conceituais devem ser aplicadas conforme o contexto de cada problema.`,
};

function generateQuestion(index: number, level: Question['level'], topic: string): Question {
  const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
  
  const templates: Record<string, string[]> = {
    teoria: [
      `Explique o conceito de ${topic} e sua importância na disciplina.`,
      `Defina ${topic} e cite duas aplicações práticas.`,
      `Descreva as principais características de ${topic}.`,
    ],
    facil: [
      `Considerando os princípios de ${topic}, resolva o seguinte problema básico: Determine o valor da grandeza principal quando os dados iniciais são conhecidos.`,
      `Aplique os conceitos de ${topic} para calcular a grandeza solicitada a partir dos dados fornecidos.`,
    ],
    media: [
      `[${origin}] Um problema envolvendo ${topic} apresenta as seguintes condições. Determine a solução considerando todas as variáveis envolvidas e justifique sua resposta.`,
      `[${origin}] Analise a situação descrita sobre ${topic} e determine o resultado correto, apresentando os cálculos necessários.`,
    ],
    dificil: [
      `[${origin}] Em um problema avançado sobre ${topic}, considere múltiplas variáveis e suas interações. Determine a solução completa e discuta as implicações dos resultados obtidos.`,
      `[${origin}] Resolva o problema complexo envolvendo ${topic}, considerando casos especiais e condições de contorno.`,
    ],
  };

  const options = templates[level] || templates.facil;
  const text = options[Math.floor(Math.random() * options.length)];

  return {
    id: `q-${Date.now()}-${index}`,
    text,
    origin: level === 'media' || level === 'dificil' ? origin : 'Autoral',
    level,
    answer: `Resolução da questão ${index + 1}: A resposta envolve a aplicação direta dos conceitos de ${topic}. Desenvolvendo os cálculos e análises necessárias, chegamos ao resultado esperado.`,
  };
}

export function generateActivity(
  school: string,
  subject: string,
  teacher: string,
  topic: string,
  source: string,
  levels: { teoria: number; facil: number; media: number; dificil: number }
): Activity {
  const questions: Question[] = [];
  let idx = 0;

  for (const [level, count] of Object.entries(levels)) {
    for (let i = 0; i < count; i++) {
      questions.push(generateQuestion(idx++, level as Question['level'], topic));
    }
  }

  return {
    id: `act-${Date.now()}`,
    school,
    subject,
    teacher,
    topic,
    source,
    theory: THEORY_TEMPLATES.default.replace(/\$\{topic\}/g, topic),
    questions,
    levels,
    createdAt: new Date().toISOString(),
  };
}
