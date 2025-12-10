export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface SlideContent {
  title: string;
  bulletPoints: string[];
  imagePrompt: string;
  imageUrl?: string; // Base64 or URL
}

export type VideoTheme = 'modern' | 'dark' | 'playful' | 'classic';
export type Language = 'kk' | 'ru' | 'en';

export interface GeneratedContent {
  topic: string;
  explanation: string;
  audioBase64: string | null;
  quiz: QuizQuestion[];
  slides: SlideContent[];
  theme: VideoTheme;
  language: Language;
  createdAt: Date | string; // Allow string for JSON deserialization
}

export enum GenerationStep {
  IDLE = 'IDLE',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
  SLIDES_TEXT = 'SLIDES_TEXT',
  IMAGES = 'IMAGES',
  AUDIO = 'AUDIO',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface GenerationStatus {
  step: GenerationStep;
  message: string;
  progress: number;
}

// New Types for Auth and History
export interface User {
  id: string;
  name: string;
  email: string;
  isFirstLogin: boolean;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  topic: string;
  data: GeneratedContent;
  createdAt: string;
}