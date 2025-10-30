import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { userQuestion, aiResponse } = await req.json();

    if (!userQuestion || !aiResponse) {
      return new Response(JSON.stringify({ error: 'User question and AI response are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Based on this conversation:

User Question: "${userQuestion}"
AI Response: "${aiResponse}"

Generate 4-5 relevant follow-up questions that the user might want to ask next. These questions should:
- Be specific and contextual to the conversation
- Explore different aspects or go deeper into the topic
- Be concise (one sentence each)
- Be naturally related to what was discussed

Return ONLY a JSON array of strings, no additional text or formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let questions: string[];
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      questions = JSON.parse(cleanText);

      // Ensure we have an array and limit to 5 questions
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      questions = questions.slice(0, 5);
    } catch (e) {
      // If parsing fails, try to extract questions from the text
      questions = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*|^\d+\.\s*|^["']|["']$/g, '').trim())
        .filter(line => line.length > 0 && line.endsWith('?'))
        .slice(0, 5);
    }

    return new Response(JSON.stringify({ questions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate follow-up questions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
