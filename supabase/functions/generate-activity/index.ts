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
    // Auth check
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

    const { topic, source, levels, school, subject, teacher } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalQuestions = (levels?.teoria || 0) + (levels?.facil || 0) + (levels?.media || 0) + (levels?.dificil || 0);

    const systemPrompt = `Você é um assistente pedagógico especializado em criar listas de exercícios para professores brasileiros. 
Suas respostas devem ser em português brasileiro, limpas (sem código, sem markdown de programação), apenas texto formatado para leitura.
Quando mencionar fórmulas, escreva-as por extenso de forma legível.`;

    const userPrompt = `Crie uma atividade educacional completa sobre o tema: "${topic}"${source ? ` baseando-se preferencialmente no conteúdo do site/fonte: "${source}"` : ""}.

A atividade deve conter EXATAMENTE estas seções, no formato JSON abaixo:

1. "theory": Um resumo teórico completo e didático sobre o tema (3-5 parágrafos), usando linguagem clara e acessível para alunos do ensino médio. Inclua conceitos fundamentais, fórmulas importantes (escritas por extenso) e exemplos práticos. NÃO use markdown, apenas texto puro com quebras de linha.

2. "questions": Um array com exatamente ${totalQuestions} questões, distribuídas assim:
   - ${levels?.teoria || 0} questões de nível "teoria" (conceituais, definições)
   - ${levels?.facil || 0} questões de nível "facil" (aplicação direta)
   - ${levels?.media || 0} questões de nível "media" (aplicação intermediária)
   - ${levels?.dificil || 0} questões de nível "dificil" (problemas complexos)

   Cada questão deve ter:
   - "text": o enunciado completo da questão
   - "origin": a origem real da questão (ex: "ENEM 2022", "ITA 2021", "FUVEST 2023", "UNICAMP 2020", "UNESP 2019"). Para questões de teoria, use "Autoral". SEMPRE cite vestibulares reais brasileiros para questões de nível médio e difícil.
   - "level": o nível ("teoria", "facil", "media", "dificil")
   - "answer": resposta completa e comentada, explicando o raciocínio passo a passo

IMPORTANTE: 
- Priorize questões que realmente apareceram em vestibulares brasileiros
- A teoria deve ser baseada no conteúdo da fonte "${source || "livros didáticos"}"
- Retorne APENAS o JSON válido, sem texto antes ou depois
- O texto deve ser limpo, sem marcações de código

Formato de resposta (JSON puro):
{
  "theory": "texto do resumo teórico aqui...",
  "questions": [
    {
      "text": "enunciado",
      "origin": "ENEM 2022",
      "level": "facil",
      "answer": "resposta comentada"
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
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

    // Parse JSON from response (strip markdown code blocks if present)
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

    // Build activity and save to DB
    const userId = claimsData.claims.sub;
    const questions = (parsed.questions || []).map((q: any, i: number) => ({
      id: `q-${Date.now()}-${i}`,
      text: q.text || "",
      origin: q.origin || "Autoral",
      level: q.level || "facil",
      answer: q.answer || "",
    }));

    const { data: activity, error: dbError } = await supabase
      .from("activities")
      .insert({
        user_id: userId,
        school: school || "",
        subject: subject || "",
        teacher: teacher || "",
        topic,
        source: source || "",
        theory: parsed.theory || "",
        questions,
        levels: levels || { teoria: 0, facil: 0, media: 0, dificil: 0 },
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

    return new Response(JSON.stringify(activity), {
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
