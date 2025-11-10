import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PieChart } from 'react-native-chart-kit';
import { useSurveyStore } from '../../stores/surveyStore';
import { useToastStore } from '../../stores/toastStore';
import { Navbar } from '../../components/Navbar';
import { surveyDataSource } from '../../../data/datasources/survey.datasource';
import { ResponseDetailResponse } from '../../../data/models/survey.dto';
import { MainStackParamList } from '../../navigation/types';
import { styles } from './SurveyResultsScreen.styles';

const screenWidth = Dimensions.get('window').width;

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

    const interval = setInterval(() => {
      loadDataSilently();
    }, 5000);

    return () => clearInterval(interval);
  }, [surveyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!currentSurvey || currentSurvey.id !== surveyId) {
        await getSurvey(surveyId);
      }

      const responsesData = await surveyDataSource.getSurveyResponses(surveyId);
      setResponses(responsesData);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar resultados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDataSilently = async () => {
    try {
      const responsesData = await surveyDataSource.getSurveyResponses(surveyId);
      setResponses(responsesData);
    } catch (error) {
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
                let answerText = 'Sin respuesta';
                if (answer.value) {
                  if (Array.isArray(answer.value)) {
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

export default SurveyResultsScreen;
