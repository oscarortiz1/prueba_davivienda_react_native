import { httpService } from '../../infrastructure/services/http.service';
import { API_ENDPOINTS } from '../../infrastructure/config/api.config';
import {
  CreateSurveyRequest,
  UpdateSurveyRequest,
  SurveyResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  SubmitResponseRequest,
  ResponseDetailResponse,
} from '../models/survey.dto';

export const surveyDataSource = {
  // Survey CRUD
  createSurvey: async (data: CreateSurveyRequest): Promise<SurveyResponse> => {
    return await httpService.post<SurveyResponse>(API_ENDPOINTS.SURVEYS.CREATE, data);
  },

  getSurvey: async (id: string): Promise<SurveyResponse> => {
    return await httpService.get<SurveyResponse>(API_ENDPOINTS.SURVEYS.GET_BY_ID(id));
  },

  getPublicSurvey: async (id: string): Promise<SurveyResponse> => {
    return await httpService.get<SurveyResponse>(API_ENDPOINTS.SURVEYS.GET_PUBLIC(id));
  },

  getAllSurveys: async (): Promise<SurveyResponse[]> => {
    return await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_ALL);
  },

  getMySurveys: async (): Promise<SurveyResponse[]> => {
    return await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_MY_SURVEYS);
  },

  getPublishedSurveys: async (): Promise<SurveyResponse[]> => {
    return await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_PUBLISHED);
  },

  updateSurvey: async (id: string, data: UpdateSurveyRequest): Promise<SurveyResponse> => {
    return await httpService.put<SurveyResponse>(API_ENDPOINTS.SURVEYS.UPDATE(id), data);
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await httpService.delete(API_ENDPOINTS.SURVEYS.DELETE(id));
  },

  publishSurvey: async (id: string): Promise<SurveyResponse> => {
    return await httpService.put<SurveyResponse>(API_ENDPOINTS.SURVEYS.PUBLISH(id));
  },

  // Question CRUD
  addQuestion: async (surveyId: string, data: CreateQuestionRequest): Promise<SurveyResponse> => {
    return await httpService.post<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.ADD_QUESTION(surveyId),
      data
    );
  },

  updateQuestion: async (
    surveyId: string,
    questionId: string,
    data: UpdateQuestionRequest
  ): Promise<SurveyResponse> => {
    return await httpService.put<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.UPDATE_QUESTION(surveyId, questionId),
      data
    );
  },

  deleteQuestion: async (surveyId: string, questionId: string): Promise<SurveyResponse> => {
    return await httpService.delete<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.DELETE_QUESTION(surveyId, questionId)
    );
  },

  // Survey Responses
  submitResponse: async (surveyId: string, data: SubmitResponseRequest): Promise<ResponseDetailResponse> => {
    return await httpService.post<ResponseDetailResponse>(
      API_ENDPOINTS.SURVEYS.SUBMIT_RESPONSE(surveyId),
      data
    );
  },

  getSurveyResponses: async (surveyId: string): Promise<ResponseDetailResponse[]> => {
    return await httpService.get<ResponseDetailResponse[]>(
      API_ENDPOINTS.SURVEYS.GET_RESPONSES(surveyId)
    );
  },
};
