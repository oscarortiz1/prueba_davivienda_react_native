export type QuestionType = 'text' | 'multiple-choice' | 'checkbox' | 'dropdown' | 'scale';

export interface Question {
  id: string;
  surveyId: string;
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  imageUrl?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  durationValue?: number | null;
  durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
  expiresAt?: Date | null;
  questions: Question[];
}

export interface Answer {
  id: string;
  questionId: string;
  surveyId: string;
  value: string | string[];
  respondentId?: string;
  createdAt: Date;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  answers: Answer[];
  completedAt: Date;
}
