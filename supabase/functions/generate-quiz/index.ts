import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True or False',
  'identification': 'Identification',
  'enumeration': 'Enumeration',
  'matching': 'Matching Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, counts, pointsPerQ } = await req.json() as {
      content: string;
      counts: Record<string, number>;
      pointsPerQ: number;
    };

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'No content provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalQuestions === 0) {
      return new Response(JSON.stringify({ error: 'No question counts specified.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const typeLines = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `- ${count} ${TYPE_LABELS[type] ?? type} question${count > 1 ? 's' : ''}`)
      .join('\n');

    const prompt = `You are a quiz question generator. Given educational content, generate quiz questions exactly as specified. Return ONLY a valid JSON object with no markdown, no code fences, no extra text.

Generate the following quiz questions based on the content below:
${typeLines}

Return this exact JSON structure (include only question types that were requested):
{
  "questions": [
    { "type": "multiple-choice", "text": "Question?", "options": ["A", "B", "C", "D"], "correctAnswer": 0 },
    { "type": "true-false", "text": "Statement.", "correctAnswer": "true" },
    { "type": "identification", "text": "What is...?", "correctAnswer": "answer" },
    { "type": "enumeration", "text": "List the...", "correctAnswer": ["item1", "item2", "item3"] },
    { "type": "matching", "text": "Match the following.", "pairs": [{"left": "term", "right": "definition"}] }
  ]
}

Rules:
- Multiple choice must have exactly 4 options; correctAnswer is the 0-based index of the correct option.
- True-false correctAnswer must be "true" or "false".
- Identification correctAnswer is the exact answer string.
- Enumeration correctAnswer is an array of strings that students must list.
- Matching pairs must have at least 3 pairs with clear left and right values.
- Questions must be based solely on the provided content. Do not invent unrelated facts.

Content:
${content.slice(0, 14000)}`;

    const client = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed: { questions: unknown[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'Claude returned invalid JSON. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions were generated. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
