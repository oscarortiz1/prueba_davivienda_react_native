import { Survey } from '../../core/domain/entities/Survey';
import { SurveyRepository } from '../../core/domain/repositories/SurveyRepository';
import { surveyDataSource } from '../datasources/survey.datasource';
import { SurveyResponse } from '../models/survey.dto';

/**
 * Survey Repository Implementation
 * Implements domain repository using the survey datasource
 */
export class SurveyRepositoryImpl implements SurveyRepository {
  /**
   * Converts API SurveyResponse to domain Survey entity
   */
  private mapToDomain(dto: SurveyResponse): Survey {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      isPublished: dto.isPublished,
      durationValue: dto.durationValue,
      durationUnit: dto.durationUnit,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      questions: dto.questions.map((q) => ({
        id: q.id,
        surveyId: q.surveyId,
        title: q.title,
        type: q.type,
        options: q.options,
        required: q.required,
        order: q.order,
        imageUrl: q.imageUrl,
      })),
    };
  }

  async createSurvey(data: {
    title: string;
    description: string;
    durationValue?: number | null;
    durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
  }): Promise<Survey> {
    const response = await surveyDataSource.createSurvey(data);
    return this.mapToDomain(response);
  }

  async getSurvey(id: string): Promise<Survey> {
    const response = await surveyDataSource.getSurvey(id);
    return this.mapToDomain(response);
  }

  async getPublicSurvey(id: string): Promise<Survey> {
    const response = await surveyDataSource.getPublicSurvey(id);
    return this.mapToDomain(response);
  }

  async getAllSurveys(): Promise<Survey[]> {
    const response = await surveyDataSource.getAllSurveys();
    return response.map((dto) => this.mapToDomain(dto));
  }

  async getMySurveys(): Promise<Survey[]> {
    const response = await surveyDataSource.getMySurveys();
    return response.map((dto) => this.mapToDomain(dto));
  }

  async getPublishedSurveys(): Promise<Survey[]> {
    const response = await surveyDataSource.getPublishedSurveys();
    return response.map((dto) => this.mapToDomain(dto));
  }

  async updateSurvey(
    id: string,
    data: {
      title: string;
      description: string;
      durationValue?: number | null;
      durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
    }
  ): Promise<Survey> {
    const response = await surveyDataSource.updateSurvey(id, data);
    return this.mapToDomain(response);
  }

  async deleteSurvey(id: string): Promise<void> {
    await surveyDataSource.deleteSurvey(id);
  }

  async publishSurvey(id: string): Promise<Survey> {
    const response = await surveyDataSource.publishSurvey(id);
    return this.mapToDomain(response);
  }

  async addQuestion(surveyId: string, question: any): Promise<Survey> {
    const response = await surveyDataSource.addQuestion(surveyId, question);
    return this.mapToDomain(response);
  }

  async updateQuestion(surveyId: string, questionId: string, question: any): Promise<Survey> {
    const response = await surveyDataSource.updateQuestion(surveyId, questionId, question);
    return this.mapToDomain(response);
  }

  async deleteQuestion(surveyId: string, questionId: string): Promise<Survey> {
    const response = await surveyDataSource.deleteQuestion(surveyId, questionId);
    return this.mapToDomain(response);
  }
}

export const surveyRepository = new SurveyRepositoryImpl();
