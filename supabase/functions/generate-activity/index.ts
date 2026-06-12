import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      topic,
      source,
      mode = "web",
      modelText = "",
      questionCount = 5,
      school = "",
      subject = "",
      teacher = "",
      className = "",
      answerKeyMode = "simple",
      authorRole = "Aluno",
    } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Tema é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce server-side question limits by role
    const maxQuestions = authorRole === "Professor" ? 30 : 10;
    const count = Math.max(1, Math.min(maxQuestions, Number(questionCount) || 5));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um assistente pedagógico especialista em provas e vestibulares brasileiros (ENEM, FUVEST, ITA, UNICAMP, UNESP, etc.).

REGRAS INVIOLÁVEIS:
1. TODAS as questões devem ser questões REAIS de exames e vestibulares brasileiros. Nunca invente questões fictícias.
2. Cada enunciado DEVE começar com a banca e o ano entre colchetes, ex: "[ENEM 2023] ...".
3. Cada questão DEVE ter EXATAMENTE 5 alternativas de múltipla escolha (A, B, C, D, E).
4. Indique a letra correta e uma justificativa clara passo a passo.
5. Responda em português brasileiro, texto limpo, SEM markdown e SEM código.
6. Retorne SOMENTE um JSON válido e parseável, sem texto antes ou depois.`;

    let contextBlock = "";
    if (mode === "pdf" && modelText) {
      contextBlock = `MODO ESPELHAR MODELO (Few-Shot):
Abaixo está o texto extraído de um TD modelo enviado pelo professor. Use-o APENAS como molde estrutural (formato, estilo, presença ou não de resumo teórico e quantidade de questões).

--- INÍCIO DO MODELO ---
${modelText}
--- FIM DO MODELO ---

Instruções para este modo:
- Conte quantas questões existem no modelo e gere EXATAMENTE a mesma quantidade para o NOVO TEMA "${topic}". Se não for possível contar com clareza, gere ${count} questões.
- Se o modelo contiver um resumo teórico inicial, gere um novo resumo teórico PROPORCIONAL focado em "${topic}". Se o modelo NÃO tiver teoria, deixe "theory" como string vazia.
- Mantenha o mesmo nível de dificuldade aparente do modelo.`;
    } else {
      contextBlock = `MODO IA + WEB:
Gere uma atividade sobre o tema "${topic}", priorizando questões reais provenientes da fonte selecionada: "${source}".
- Gere EXATAMENTE ${count} questões.
- Inclua um breve resumo teórico didático (2-4 parágrafos) sobre o tema em "theory".`;
    }

    const userPrompt = `${contextBlock}

Cada questão do array "questions" deve ter:
- "text": enunciado completo, iniciando OBRIGATORIAMENTE com a banca e ano entre colchetes (ex: "[FUVEST 2021] ...").
- "origin": a banca/ano (ex: "ENEM 2023").
- "alternatives": array com EXATAMENTE 5 strings (apenas o conteúdo das alternativas A, B, C, D, E, sem a letra).
- "correct": a letra correta entre "A", "B", "C", "D", "E".
- "explanation": justificativa comentada e passo a passo da resposta correta.
- "level": "facil", "media" ou "dificil".

Formato de resposta (JSON puro):
{
  "theory": "resumo teórico ou string vazia",
  "questions": [
    {
      "text": "[ENEM 2023] enunciado...",
      "origin": "ENEM 2023",
      "alternatives": ["alt A", "alt B", "alt C", "alt D", "alt E"],
      "correct": "C",
      "explanation": "justificativa...",
      "level": "media"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = rawContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LETTERS = ["A", "B", "C", "D", "E"];
    const questions = (parsed.questions || []).map((q: any, i: number) => {
      let alts = Array.isArray(q.alternatives) ? q.alternatives.map((a: any) => String(a)) : [];
      // Always force exactly 5 alternatives
      alts = alts.slice(0, 5);
      while (alts.length < 5) alts.push("");
      let correct = String(q.correct || "A").trim().toUpperCase().charAt(0);
      if (!LETTERS.includes(correct)) correct = "A";
      const level = ["facil", "media", "dificil"].includes(q.level) ? q.level : "media";
      return {
        id: `q-${Date.now()}-${i}`,
        text: q.text || "",
        origin: q.origin || "Vestibular",
        alternatives: alts,
        correct,
        explanation: q.explanation || q.answer || "",
        level,
      };
    });

    const userId = claimsData.claims.sub;

    const { data: td, error: dbError } = await supabase
      .from("generated_tds")
      .insert({
        user_id: userId,
        school: school || "EEEP Deputado Roberto Mesquita",
        subject: subject || "",
        teacher: teacher || "",
        class_name: className || "",
        topic,
        source: source || "",
        mode,
        theory: parsed.theory || "",
        questions,
        question_count: questions.length,
        answer_key_mode: answerKeyMode,
        author_role: authorRole,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Erro ao salvar atividade" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(td), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-activity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
