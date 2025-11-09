import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSurveyStore } from '../stores/surveyStore';
import { useToastStore } from '../stores/toastStore';
import { Navbar } from '../components/Navbar';
import { surveyDataSource } from '../../data/datasources/survey.datasource';
import { ResponseDetailResponse } from '../../data/models/survey.dto';
import { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SurveyResults'>;

const SurveyResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { surveyId } = route.params;
  const currentSurvey = useSurveyStore((state) => state.currentSurvey);
  const getSurvey = useSurveyStore((state) => state.getSurvey);
  const showToast = useToastStore((state) => state.showToast);

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<ResponseDetailResponse[]>([]);

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load survey if not already loaded
      if (!currentSurvey || currentSurvey.id !== surveyId) {
        await getSurvey(surveyId);
      }
      
      // Load responses
      const responsesData = await surveyDataSource.getSurveyResponses(surveyId);
      setResponses(responsesData);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar resultados', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Resultados"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Cargando resultados...</Text>
        </View>
      </View>
    );
  }

  if (!currentSurvey) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Resultados"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No se pudo cargar la encuesta</Text>
        </View>
      </View>
    );
  }

  const getAnswersByQuestion = (questionId: string) => {
    return responses.flatMap((response) =>
      response.answers.filter((answer) => answer.questionId === questionId)
    );
  };

  return (
    <View style={styles.container}>
      <Navbar
        title="Resultados"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.surveyTitle}>{currentSurvey.title}</Text>
          <Text style={styles.surveyDescription}>{currentSurvey.description}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{responses.length}</Text>
              <Text style={styles.statLabel}>Respuestas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{currentSurvey.questions.length}</Text>
              <Text style={styles.statLabel}>Preguntas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {currentSurvey.isPublished ? '✅' : '⏸️'}
              </Text>
              <Text style={styles.statLabel}>
                {currentSurvey.isPublished ? 'Publicada' : 'Borrador'}
              </Text>
            </View>
          </View>
        </View>

        {responses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>Sin respuestas aún</Text>
            <Text style={styles.emptyStateDescription}>
              Los resultados aparecerán aquí cuando los usuarios respondan la encuesta
            </Text>
          </View>
        ) : (
          <>
            {currentSurvey.questions.map((question, index) => {
              const answers = getAnswersByQuestion(question.id);
              
              return (
                <View key={question.id} style={styles.questionCard}>
                  <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                  <Text style={styles.questionTitle}>{question.title}</Text>
                  <Text style={styles.questionType}>Tipo: {question.type}</Text>
                  
                  <View style={styles.answersContainer}>
                    <Text style={styles.answersTitle}>
                      Respuestas ({answers.length})
                    </Text>
                    
                    {answers.length === 0 ? (
                      <Text style={styles.noAnswersText}>
                        Sin respuestas para esta pregunta
                      </Text>
                    ) : (
                      answers.map((answer, idx) => (
                        <View key={answer.id} style={styles.answerItem}>
                          <Text style={styles.answerIndex}>#{idx + 1}</Text>
                          <Text style={styles.answerValue}>
                            {Array.isArray(answer.value)
                              ? answer.value.join(', ')
                              : answer.value}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.responsesSection}>
              <Text style={styles.sectionTitle}>
                Todas las respuestas ({responses.length})
              </Text>
              {responses.map((response, index) => (
                <View key={response.id} style={styles.responseCard}>
                  <View style={styles.responseHeader}>
                    <Text style={styles.responseNumber}>Respuesta #{index + 1}</Text>
                    <Text style={styles.responseDate}>
                      {new Date(response.completedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {response.respondentId && (
                    <Text style={styles.respondentId}>
                      Usuario: {response.respondentId}
                    </Text>
                  )}
                  <Text style={styles.answerCount}>
                    {response.answers.length} respuestas registradas
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  questionType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  answersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  answersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noAnswersText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  answerValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  responsesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  responseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  responseDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  respondentId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  answerCount: {
    fontSize: 14,
    color: '#374151',
  },
});

export default SurveyResultsScreen;
