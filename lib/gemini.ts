import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { GeminiHistory } from '@/types/gemini';
import { ChatMessage } from '@/types/api';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('[GEMINI] API key not configured');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * loadSystemPrompt
 * 시스템 프롬프트 파일 로드
 */
export function loadSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'lib/systemPrompt.txt');

  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('[GEMINI] Failed to load system prompt:', error);
    return '당신은 친절한 소프트웨어 개발 전문가입니다.';
  }
}

/**
 * getGeminiModel
 * Gemini 모델 인스턴스 반환
 */
export function getGeminiModel() {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = loadSystemPrompt();
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

  return genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });
}

/**
 * convertHistoryToGeminiFormat
 * ChatMessage[] → GeminiHistory 변환
 */
export function convertHistoryToGeminiFormat(
  history: ChatMessage[]
): GeminiHistory {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}
