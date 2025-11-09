import { create } from 'zustand';
import { Survey } from '../../core/domain/entities/Survey';
import { surveyRepository } from '../../data/repositories/SurveyRepositoryImpl';

interface SurveyState {
  surveys: Survey[];
  publishedSurveys: Survey[];
  currentSurvey: Survey | null;
  loading: boolean;

  setLoading: (loading: boolean) => void;
  setSurveys: (surveys: Survey[]) => void;
  setPublishedSurveys: (surveys: Survey[]) => void;
  setCurrentSurvey: (survey: Survey | null) => void;
  
  refreshMySurveys: () => Promise<void>;
  refreshPublishedSurveys: () => Promise<void>;
  createSurvey: (data: {
    title: string;
    description: string;
    durationValue?: number | null;
    durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
  }) => Promise<Survey>;
  getSurvey: (id: string) => Promise<Survey>;
  getPublicSurvey: (id: string) => Promise<Survey>;
  updateSurvey: (
    id: string,
    data: {
      title: string;
      description: string;
      durationValue?: number | null;
      durationUnit?: 'minutes' | 'hours' | 'days' | 'none';
    }
  ) => Promise<Survey>;
  deleteSurvey: (id: string) => Promise<void>;
  publishSurvey: (id: string) => Promise<Survey>;
  
  addQuestion: (surveyId: string, question: any) => Promise<Survey>;
  updateQuestion: (surveyId: string, questionId: string, question: any) => Promise<Survey>;
  deleteQuestion: (surveyId: string, questionId: string) => Promise<Survey>;
  
  reset: () => void;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  publishedSurveys: [],
  currentSurvey: null,
  loading: false,

  setLoading: (loading) => set({ loading }),
  
  setSurveys: (surveys) => set({ surveys }),
  
  setPublishedSurveys: (publishedSurveys) => set({ publishedSurveys }),
  
  setCurrentSurvey: (survey) => set({ currentSurvey: survey }),

  refreshMySurveys: async () => {
    set({ loading: true });
    try {
      const surveys = await surveyRepository.getMySurveys();
      set({ surveys });
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refreshPublishedSurveys: async () => {
    try {
      const publishedSurveys = await surveyRepository.getPublishedSurveys();
      set({ publishedSurveys });
    } catch (error) {
      throw error;
    }
  },

  createSurvey: async (data) => {
    const survey = await surveyRepository.createSurvey(data);
    await get().refreshMySurveys();
    return survey;
  },

  getSurvey: async (id) => {
    const survey = await surveyRepository.getSurvey(id);
    set({ currentSurvey: survey });
    return survey;
  },

  getPublicSurvey: async (id) => {
    const survey = await surveyRepository.getPublicSurvey(id);
    set({ currentSurvey: survey });
    return survey;
  },

  updateSurvey: async (id, data) => {
    if (!id || id === 'new') {
      throw new Error('Debes guardar la encuesta antes de actualizarla');
    }
    const survey = await surveyRepository.updateSurvey(id, data);
    await get().refreshMySurveys();
    return survey;
  },

  deleteSurvey: async (id) => {
    if (!id) {
      throw new Error('ID de encuesta requerido');
    }
    await surveyRepository.deleteSurvey(id);
    await get().refreshMySurveys();
  },

  publishSurvey: async (id) => {
    if (!id || id === 'new') {
      throw new Error('Debes guardar la encuesta antes de publicarla');
    }
    const survey = await surveyRepository.publishSurvey(id);
    await get().refreshMySurveys();
    return survey;
  },

  addQuestion: async (surveyId, question) => {
    if (!surveyId) {
      throw new Error('ID de encuesta requerido para agregar pregunta');
    }
    const survey = await surveyRepository.addQuestion(surveyId, question);
    set({ currentSurvey: survey });
    return survey;
  },

  updateQuestion: async (surveyId, questionId, question) => {
    if (!surveyId || !questionId) {
      throw new Error('IDs requeridos para actualizar pregunta');
    }
    const survey = await surveyRepository.updateQuestion(surveyId, questionId, question);
    set({ currentSurvey: survey });
    return survey;
  },

  deleteQuestion: async (surveyId, questionId) => {
    if (!surveyId || !questionId) {
      throw new Error('IDs requeridos para eliminar pregunta');
    }
    const survey = await surveyRepository.deleteQuestion(surveyId, questionId);
    set({ currentSurvey: survey });
    return survey;
  },

  reset: () =>
    set({
      surveys: [],
      publishedSurveys: [],
      currentSurvey: null,
      loading: false,
    }),
}));
