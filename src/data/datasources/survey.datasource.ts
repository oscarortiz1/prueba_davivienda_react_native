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
    const response = await httpService.post<SurveyResponse>(API_ENDPOINTS.SURVEYS.CREATE, data);
    return response.data;
  },

  getSurvey: async (id: string): Promise<SurveyResponse> => {
    const response = await httpService.get<SurveyResponse>(API_ENDPOINTS.SURVEYS.GET_BY_ID(id));
    return response.data;
  },

  getPublicSurvey: async (id: string): Promise<SurveyResponse> => {
    const response = await httpService.get<SurveyResponse>(API_ENDPOINTS.SURVEYS.GET_PUBLIC(id));
    return response.data;
  },

  getAllSurveys: async (): Promise<SurveyResponse[]> => {
    const response = await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_ALL);
    return response.data;
  },

  getMySurveys: async (): Promise<SurveyResponse[]> => {
    const response = await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_MY_SURVEYS);
    return response.data;
  },

  getPublishedSurveys: async (): Promise<SurveyResponse[]> => {
    const response = await httpService.get<SurveyResponse[]>(API_ENDPOINTS.SURVEYS.GET_PUBLISHED);
    return response.data;
  },

  updateSurvey: async (id: string, data: UpdateSurveyRequest): Promise<SurveyResponse> => {
    const response = await httpService.put<SurveyResponse>(API_ENDPOINTS.SURVEYS.UPDATE(id), data);
    return response.data;
  },

  deleteSurvey: async (id: string): Promise<void> => {
    await httpService.delete(API_ENDPOINTS.SURVEYS.DELETE(id));
  },

  publishSurvey: async (id: string): Promise<SurveyResponse> => {
    const response = await httpService.put<SurveyResponse>(API_ENDPOINTS.SURVEYS.PUBLISH(id));
    return response.data;
  },

  // Question CRUD
  addQuestion: async (surveyId: string, data: CreateQuestionRequest): Promise<SurveyResponse> => {
    const response = await httpService.post<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.ADD_QUESTION(surveyId),
      data
    );
    return response.data;
  },

  updateQuestion: async (
    surveyId: string,
    questionId: string,
    data: UpdateQuestionRequest
  ): Promise<SurveyResponse> => {
    const response = await httpService.put<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.UPDATE_QUESTION(surveyId, questionId),
      data
    );
    return response.data;
  },

  deleteQuestion: async (surveyId: string, questionId: string): Promise<SurveyResponse> => {
    const response = await httpService.delete<SurveyResponse>(
      API_ENDPOINTS.SURVEYS.DELETE_QUESTION(surveyId, questionId)
    );
    return response.data;
  },

  // Survey Responses
  submitResponse: async (surveyId: string, data: SubmitResponseRequest): Promise<ResponseDetailResponse> => {
    const response = await httpService.post<ResponseDetailResponse>(
      API_ENDPOINTS.SURVEYS.SUBMIT_RESPONSE(surveyId),
      data
    );
    return response.data;
  },

  getSurveyResponses: async (surveyId: string): Promise<ResponseDetailResponse[]> => {
    const response = await httpService.get<ResponseDetailResponse[]>(
      API_ENDPOINTS.SURVEYS.GET_RESPONSES(surveyId)
    );
    return response.data;
  },
};
