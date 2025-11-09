/**
 * API Configuration
 * Centralizes all API-related configuration
 */

import { ENV } from './env.config';

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  TIMEOUT: ENV.API_TIMEOUT,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  SURVEYS: {
    CREATE: '/surveys',
    GET_ALL: '/surveys',
    GET_MY_SURVEYS: '/surveys/my-surveys',
    GET_PUBLISHED: '/surveys/published',
    GET_BY_ID: (id: string) => `/surveys/${id}`,
    GET_PUBLIC: (id: string) => `/surveys/public/${id}`,
    UPDATE: (id: string) => `/surveys/${id}`,
    DELETE: (id: string) => `/surveys/${id}`,
    PUBLISH: (id: string) => `/surveys/${id}/publish`,
    ADD_QUESTION: (surveyId: string) => `/surveys/${surveyId}/questions`,
    UPDATE_QUESTION: (surveyId: string, questionId: string) =>
      `/surveys/${surveyId}/questions/${questionId}`,
    DELETE_QUESTION: (surveyId: string, questionId: string) =>
      `/surveys/${surveyId}/questions/${questionId}`,
    SUBMIT_RESPONSE: (surveyId: string) => `/surveys/${surveyId}/responses`,
    GET_RESPONSES: (surveyId: string) => `/surveys/${surveyId}/responses`,
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
} as const;
