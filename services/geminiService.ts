import { Language } from '../types';
import { evaluateReflectionViaProxy } from './aiProxy';

interface FeedbackResponse {
  score: number; // 0-100
  feedback: string; // 1-2 sentences
  isPass: boolean;
}

export const evaluateReflection = async (
  prompt: string,
  userAnswer: string,
  language: Language
): Promise<FeedbackResponse> => {
  try {
    // Client never holds API keys. Use local proxy (server/index.mjs).
    return await evaluateReflectionViaProxy(prompt, userAnswer, language);
  } catch (error) {
    console.warn('AI proxy unavailable; using simulation mode.', error);
    return simulateEvaluation(userAnswer, language);
  }
};

// Simulation for demo purposes when API key is missing
const simulateEvaluation = (text: string, language: Language): FeedbackResponse => {
  const length = text.trim().length;
  if (length < 10) {
    return {
      score: 20,
      feedback:
        language === 'de'
          ? 'Das war etwas kurz. Kannst du das etwas genauer ausführen?'
          : 'That was a bit short. Can you elaborate?',
      isPass: false,
    };
  }

  return {
    score: 85,
    feedback:
      language === 'de'
        ? 'Guter Gedanke. Es ist wichtig, diese Verbindung zu sehen.'
        : 'Good thought. It is important to see this connection.',
    isPass: true,
  };
};
