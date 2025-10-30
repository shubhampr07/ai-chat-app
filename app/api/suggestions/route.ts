import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const categoryPrompts: Record<string, string> = {
  code: 'Generate 4 short, practical coding-related questions or prompts that a user might ask an AI assistant. Focus on common programming tasks, debugging, explanations, or implementations. Return ONLY a JSON array of strings, no additional text.',
  create: 'Generate 4 short, creative prompts related to design, UI/UX, or creative projects that a user might ask an AI assistant. Return ONLY a JSON array of strings, no additional text.',
  learn: 'Generate 4 short educational questions about technology, computer science, or programming concepts that a user might want to learn. Return ONLY a JSON array of strings, no additional text.',
  write: 'Generate 4 short prompts related to writing documentation, emails, blog posts, or technical content. Return ONLY a JSON array of strings, no additional text.',
  life: 'Generate 4 short prompts about everyday life topics like health, productivity, travel, or personal organization. Return ONLY a JSON array of strings, no additional text.',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    if (!category || !categoryPrompts[category]) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
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
    const result = await model.generateContent(categoryPrompts[category]);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let suggestions: string[];
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanText);
    } catch (e) {
      // If parsing fails, try to extract suggestions from the text
      suggestions = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*|^\d+\.\s*|^["']|["']$/g, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 4);
    }

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate suggestions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
