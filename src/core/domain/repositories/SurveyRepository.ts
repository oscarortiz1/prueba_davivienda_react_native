import { Survey, Question } from '../entities/Survey';

export interface SurveyRepository {
  // Survey CRUD
  createSurvey(data: {
    title: string;
    description: string;
    durationValue?: number | null;
    durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
  }): Promise<Survey>;
  
  getSurvey(id: string): Promise<Survey>;
  getPublicSurvey(id: string): Promise<Survey>;
  getAllSurveys(): Promise<Survey[]>;
  getMySurveys(): Promise<Survey[]>;
  getPublishedSurveys(): Promise<Survey[]>;
  
  updateSurvey(
    id: string,
    data: {
      title: string;
      description: string;
      durationValue?: number | null;
      durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
    }
  ): Promise<Survey>;
  
  deleteSurvey(id: string): Promise<void>;
  publishSurvey(id: string): Promise<Survey>;
  
  // Question CRUD
  addQuestion(surveyId: string, question: Partial<Question>): Promise<Survey>;
  updateQuestion(surveyId: string, questionId: string, question: Partial<Question>): Promise<Survey>;
  deleteQuestion(surveyId: string, questionId: string): Promise<Survey>;
}
