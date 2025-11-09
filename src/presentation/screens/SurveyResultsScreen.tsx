import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PieChart } from 'react-native-chart-kit';
import { useSurveyStore } from '../stores/surveyStore';
import { useToastStore } from '../stores/toastStore';
import { Navbar } from '../components/Navbar';
import { surveyDataSource } from '../../data/datasources/survey.datasource';
import { ResponseDetailResponse } from '../../data/models/survey.dto';
import { MainStackParamList } from '../navigation/types';

const screenWidth = Dimensions.get('window').width;

type Props = NativeStackScreenProps<MainStackParamList, 'SurveyResults'>;

const SurveyResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { surveyId } = route.params;
  const currentSurvey = useSurveyStore((state) => state.currentSurvey);
  const getSurvey = useSurveyStore((state) => state.getSurvey);
  const showToast = useToastStore((state) => state.showToast);

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<ResponseDetailResponse[]>([]);

  // Cargar datos inicialmente y configurar actualización automática
  useEffect(() => {
    loadData();

    // Actualización automática cada 5 segundos
    const interval = setInterval(() => {
      loadDataSilently();
    }, 5000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
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

  // Actualización silenciosa (sin mostrar indicador visual)
  const loadDataSilently = async () => {
    try {
      const responsesData = await surveyDataSource.getSurveyResponses(surveyId);
      setResponses(responsesData);
    } catch (error) {
      // Silenciar errores en actualización automática
      console.log('Error en actualización automática:', error);
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

  const getChartDataForQuestion = (question: any) => {
    const answers = getAnswersByQuestion(question.id);
    
    // Para preguntas con opciones (multiple-choice, checkbox, dropdown, scale)
    if (question.options && question.options.length > 0) {
      const optionCounts: { [key: string]: number } = {};
      
      question.options.forEach((option: string) => {
        optionCounts[option] = 0;
      });
      
      answers.forEach((answer) => {
        const values = Array.isArray(answer.value) ? answer.value : [answer.value];
        values.forEach((val: string) => {
          if (optionCounts[val] !== undefined) {
            optionCounts[val]++;
          }
        });
      });
      
      return {
        labels: Object.keys(optionCounts),
        counts: Object.values(optionCounts),
        total: answers.length,
      };
    }
    
    return null;
  };

  const renderQuestionChart = (question: any, index: number) => {
    const answers = getAnswersByQuestion(question.id);
    const questionType = question.type?.toUpperCase();
    const isTextQuestion = questionType === 'TEXT' || questionType === 'TEXTAREA';

    // Para preguntas de texto, mostrar solo información básica
    if (isTextQuestion) {

      return (
        <View key={question.id} style={styles.chartCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionBadge}>
              <Text style={styles.questionNumber}>{index + 1}</Text>
            </View>
            <View style={styles.questionTitleContainer}>
              <Text style={styles.chartTitle}>{question.title}</Text>
              {question.required && (
                <Text style={styles.requiredBadge}>Obligatoria</Text>
              )}
            </View>
          </View>

          {question.imageUrl && (
            <View style={styles.questionImageContainer}>
              <Image
                source={{ uri: question.imageUrl }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.responsesSummary}>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryIcon}>💬</Text>
              <Text style={styles.summaryText}>
                {answers.length} respuesta{answers.length !== 1 ? 's' : ''} de texto
              </Text>
            </View>
          </View>

          {/* Mostrar respuestas de texto */}
          {answers.length > 0 ? (
            <View style={styles.textAnswersContainer}>
              <Text style={styles.textAnswersTitle}>Total de respuestas: {answers.length}</Text>
              {answers.map((answer, idx) => {
                // Manejar arrays y strings
                let answerText = 'Sin respuesta';
                if (answer.value) {
                  if (Array.isArray(answer.value)) {
                    // Si es array, unir los elementos o tomar el primero
                    answerText = answer.value.length > 0 ? answer.value.join(', ') : 'Sin respuesta';
                  } else {
                    answerText = answer.value.toString();
                  }
                }

                return (
                  <View key={idx} style={styles.textAnswerCard}>
                    <View style={styles.textAnswerHeader}>
                      <Text style={styles.textAnswerNumber}>Respuesta #{idx + 1}</Text>
                    </View>
                    <Text style={styles.textAnswerValue}>{answerText}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.textAnswersContainer}>
              <Text style={styles.noAnswersText}>
                No hay respuestas para esta pregunta
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Para preguntas con opciones
    const chartData = getChartDataForQuestion(question);

    if (!chartData || chartData.counts.every(count => count === 0)) {
      return (
        <View key={question.id} style={styles.chartCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionBadge}>
              <Text style={styles.questionNumber}>{index + 1}</Text>
            </View>
            <View style={styles.questionTitleContainer}>
              <Text style={styles.chartTitle}>{question.title}</Text>
              {question.required && (
                <Text style={styles.requiredBadge}>Obligatoria</Text>
              )}
            </View>
          </View>

          <View style={styles.responsesSummary}>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryIcon}>📊</Text>
              <Text style={styles.summaryText}>Sin respuestas aún</Text>
            </View>
          </View>
        </View>
      );
    }

    const colors = [
      '#DC2626', // Rojo Davivienda principal
      '#EA580C', // Naranja vibrante
      '#D97706', // Ámbar
      '#059669', // Verde esmeralda
      '#0284C7', // Azul cielo
      '#7C3AED', // Púrpura
      '#DB2777', // Rosa fuerte
      '#0D9488', // Teal
      '#2563EB', // Azul royal
      '#C026D3', // Fucsia
    ];

    const pieChartData = chartData.labels.map((label, idx) => ({
      name: label.length > 15 ? label.substring(0, 15) + '...' : label,
      count: chartData.counts[idx],
      color: colors[idx % colors.length],
      legendFontColor: '#2C3E50',
      legendFontSize: 12,
    })).filter(item => item.count > 0);

    // Decidir qué tipo de gráfica mostrar (solo una por pregunta)
    // Priorizar gráficas circulares: usar barras solo si hay 1-2 opciones
    const chartType = chartData.labels.length <= 2 ? 'bar' : 'pie';

    return (
      <View key={question.id} style={styles.chartCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionNumber}>{index + 1}</Text>
          </View>
          <View style={styles.questionTitleContainer}>
            <Text style={styles.chartTitle}>{question.title}</Text>
            {question.required && (
              <Text style={styles.requiredBadge}>Obligatoria</Text>
            )}
          </View>
        </View>

        {question.imageUrl && (
          <View style={styles.questionImageContainer}>
            <Image
              source={{ uri: question.imageUrl }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.responsesSummary}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryText}>
              {chartData.total} respuesta{chartData.total !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.chartsWrapper}>
          {chartType === 'pie' ? (
            <View style={styles.pieChartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 60}
                height={260}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
                hasLegend={true}
              />
            </View>
          ) : (
            <View style={styles.barChartContainer}>
              {/* Custom horizontal bar chart */}
              <View style={styles.customBarChart}>
                {chartData.labels.map((label, idx) => {
                  const percentage = (chartData.counts[idx] / chartData.total) * 100;
                  const barColor = colors[idx % colors.length];

                  return (
                    <View key={idx} style={styles.barItem}>
                      <View style={styles.barLabelContainer}>
                        <Text style={styles.barLabel} numberOfLines={2}>{label}</Text>
                      </View>
                      <View style={styles.barRow}>
                        <View style={styles.barBackground}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: barColor
                              }
                            ]}
                          >
                            <Text style={styles.barPercentageText}>{percentage.toFixed(0)}%</Text>
                          </View>
                        </View>
                        <View style={styles.barValueContainer}>
                          <Text style={[styles.barValue, { color: barColor }]}>
                            {chartData.counts[idx]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsGrid}>
          {chartData.labels.map((label, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIndicator, { backgroundColor: colors[idx % colors.length] }]} />
                <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
              </View>
              <View style={styles.statCardBody}>
                <Text style={styles.statValue}>{chartData.counts[idx]}</Text>
                <Text style={styles.statPercentage}>
                  {((chartData.counts[idx] / chartData.total) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.statProgressBar}>
                <View 
                  style={[
                    styles.statProgressFill,
                    { 
                      width: `${(chartData.counts[idx] / chartData.total) * 100}%`,
                      backgroundColor: colors[idx % colors.length]
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
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
            {/* Gráficas de preguntas con opciones */}
            {currentSurvey.questions.map((question, index) => 
              renderQuestionChart(question, index)
            )}

            {/* Detalle de respuestas individuales */}
            <View style={styles.responsesSection}>
              <Text style={styles.sectionTitle}>
                Respuestas Individuales ({responses.length})
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
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  refreshText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
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
    padding: 24,
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  surveyDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
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
  oldStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 56,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
  oldQuestionNumber: {
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  responseNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  responseDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  respondentId: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  answerCount: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  questionImageContainer: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionImage: {
    width: '100%',
    height: 150,
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  questionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  questionTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 26,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B9D',
    backgroundColor: '#FFE6EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  responsesSummary: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  summaryIcon: {
    fontSize: 17,
    marginRight: 7,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  chartsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  chartSection: {
    marginBottom: 16,
  },
  chartSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  pieChartContainer: {
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  barChartContainer: {
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  statCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  statPercentage: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
  },
  statProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  textAnswersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  textAnswersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textAnswerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textAnswerHeader: {
    marginBottom: 8,
  },
  textAnswerNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  textAnswerValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  customBarChart: {
    width: '100%',
    paddingVertical: 8,
  },
  barItem: {
    marginBottom: 20,
  },
  barLabelContainer: {
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBackground: {
    flex: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 50,
  },
  barPercentageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  barValueContainer: {
    minWidth: 40,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 20,
    fontWeight: '800',
  },
});

export default SurveyResultsScreen;
