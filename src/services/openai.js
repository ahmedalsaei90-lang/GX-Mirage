import { OpenAI } from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('Missing OpenAI API key - add VITE_OPENAI_API_KEY to .env');
}

const openai = new OpenAI({ 
  apiKey,
  dangerouslyAllowBrowser: true
});

export async function generateQuestions(category, lang = 'en', num = 10, difficulty = 'medium') {
  const systemPrompt = `You are a trivia question generator. Generate ${num} trivia questions on ${category} in ${lang} language, ${difficulty} difficulty.
Output a JSON object with a key 'questions' containing an array of question objects. Each question object should have:
- "question": string
- "options": array of 4 strings
- "correct": integer index (0-3) of the correct option
- "image_desc": string, detailed and specific description for a relevant image (e.g., "a vibrant image of a soccer player kicking a goal in a crowded stadium during night time").
Make image_desc highly relevant to the question for accurate Unsplash search. No extra text outside the JSON.`;

  const examplePrompt = "Generate 1 trivia question on History in en language, medium difficulty.";
  const exampleResponse = JSON.stringify({
    questions: [
      {
        question: "Who was the first President of the United States?",
        options: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"],
        correct: 0,
        image_desc: "a historical portrait of George Washington standing in a revolutionary war setting with American flags"
      }
    ]
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: examplePrompt },
      { role: 'assistant', content: exampleResponse },
      { role: 'user', content: `Generate ${num} trivia questions on ${category} in ${lang} language, ${difficulty} difficulty.` }
    ],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  try {
    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch (err) {
    console.error('Parsing error:', err, 'Content:', content);
    return [];
  }
}