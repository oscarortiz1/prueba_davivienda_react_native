import { QuestionType } from '../../core/domain/entities/Survey';

// Survey DTOs
export interface CreateSurveyRequest {
  title: string;
  description: string;
  durationValue?: number | null;
  durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
}

export interface UpdateSurveyRequest {
  title: string;
  description: string;
  durationValue?: number | null;
  durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
}

export interface SurveyResponse {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  durationValue?: number | null;
  durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
  expiresAt?: string | null;
  questions: QuestionResponse[];
}

// Question DTOs
export interface CreateQuestionRequest {
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  imageUrl?: string;
}

export interface UpdateQuestionRequest {
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  imageUrl?: string;
}

export interface QuestionResponse {
  id: string;
  surveyId: string;
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  imageUrl?: string;
}

// Response DTOs
export interface SubmitResponseRequest {
  respondentEmail: string;
  answers: {
    questionId: string;
    value: string[];
  }[];
}

export interface ResponseDetailResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  answers: {
    id: string;
    questionId: string;
    surveyId: string;
    value: string | string[];
    respondentId?: string;
    createdAt: string;
  }[];
  completedAt: string;
}
