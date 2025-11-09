import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSurveyStore } from '../stores/surveyStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { CustomButton } from '../components/CustomButton';
import { Navbar } from '../components/Navbar';
import { Question } from '../../core/domain/entities/Survey';
import { MainStackParamList } from '../navigation/types';
import { surveyDataSource } from '../../data/datasources/survey.datasource';

type Props = NativeStackScreenProps<MainStackParamList, 'SurveyResponse'>;

const SurveyResponseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { surveyId } = route.params;
  const user = useAuthStore((state) => state.user);
  const getPublicSurvey = useSurveyStore((state) => state.getPublicSurvey);
  const showToast = useToastStore((state) => state.showToast);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [respondentEmail, setRespondentEmail] = useState(user?.email || '');

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const data = await getPublicSurvey(surveyId);
      
      if (!data.isPublished) {
        showToast('Esta encuesta no está publicada', 'error');
        navigation.goBack();
        return;
      }

      if (data.expiresAt) {
        const expiryDate = new Date(data.expiresAt);
        const now = new Date();
        if (expiryDate < now) {
          showToast('Esta encuesta ha expirado', 'warning');
          navigation.goBack();
          return;
        }
      }

      // Normalizar tipos de pregunta y asegurar que haya opciones
      const normalizedSurvey = {
        ...data,
        questions: data.questions.map((q: any) => ({
          ...q,
          type: q.type.toLowerCase().replace(/_/g, '-'),
          options: q.options || [],
        })),
      };
      
      setSurvey(normalizedSurvey);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar la encuesta', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user && !respondentEmail.trim()) {
      showToast('Ingresa tu correo electrónico', 'error');
      return;
    }

    const missingRequired = survey.questions.some(
      (q: Question) => q.required && !answers[q.id]
    );

    if (missingRequired) {
      showToast('Por favor completa todas las preguntas requeridas', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const formattedAnswers = survey.questions.map((q: Question) => {
        const answer = answers[q.id];
        let value: string[];

        if (!answer) {
          value = [];
        } else if (Array.isArray(answer)) {
          value = answer;
        } else {
          value = [answer];
        }

        return {
          questionId: q.id,
          value: value,
        };
      });

      const requestData = {
        respondentEmail: user?.email || respondentEmail,
        answers: formattedAnswers,
      };

      await surveyDataSource.submitResponse(surveyId, requestData);

      showToast('¡Respuesta enviada exitosamente!', 'success');
      
      setAnswers({});
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || 'Error al enviar respuesta', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      return newAnswers;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Responder Encuesta"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Cargando encuesta...</Text>
        </View>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Responder Encuesta"
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No se pudo cargar la encuesta</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Responder Encuesta"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView style={styles.content}>
        {/* Survey Header */}
        <View style={styles.headerCard}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          {survey.description && (
            <Text style={styles.surveyDescription}>{survey.description}</Text>
          )}
          
          {/* Required fields note */}
          {survey.questions.some((q: Question) => q.required) && (
            <View style={styles.requiredNote}>
              <Text style={styles.requiredNoteText}>
                * Campos obligatorios
              </Text>
            </View>
          )}
          
          {survey.expiresAt && (
            <View style={styles.expirationBadge}>
              <Text style={styles.expirationText}>
                ⏰ Expira: {new Date(survey.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Email Input for non-authenticated users */}
        {!user && (
          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>Correo electrónico *</Text>
            <TextInput
              style={styles.input}
              value={respondentEmail}
              onChangeText={setRespondentEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Questions */}
        {survey.questions.map((question: Question, index: number) => (
          <QuestionResponse
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={(value) => setAnswer(question.id, value)}
          />
        ))}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          {submitting && (
            <View style={styles.submittingIndicator}>
              <ActivityIndicator size="small" color="#DC2626" />
              <Text style={styles.submittingText}>Enviando respuesta...</Text>
            </View>
          )}
          <CustomButton
            title={submitting ? 'Enviando...' : 'Enviar respuestas'}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

interface QuestionResponseProps {
  question: Question;
  index: number;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

const QuestionResponse: React.FC<QuestionResponseProps> = ({
  question,
  index,
  value,
  onChange,
}) => {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentValues = (value as string[]) || [];
    if (checked) {
      onChange([...currentValues, option]);
    } else {
      onChange(currentValues.filter((v) => v !== option));
    }
  };

  return (
    <View style={styles.questionCard}>
      <Text style={styles.questionTitle}>
        {index + 1}. {question.title}
        {question.required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Mostrar imagen si existe */}
      {question.imageUrl && (
        <View style={styles.questionImageContainer}>
          <Image
            source={{ uri: question.imageUrl }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        </View>
      )}

      {question.type === 'text' && (
        <TextInput
          style={styles.input}
          value={(value as string) || ''}
          onChangeText={onChange}
          placeholder="Tu respuesta"
          multiline
        />
      )}

      {question.type === 'multiple-choice' && (
        <View style={styles.optionsContainer}>
          {(!question.options || question.options.length === 0) ? (
            <Text style={styles.noOptionsText}>
              Esta pregunta no tiene opciones configuradas
            </Text>
          ) : (
            question.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionButton,
                  value === option && styles.optionButtonSelected,
                ]}
                onPress={() => onChange(option)}
              >
                <View style={styles.radio}>
                  {value === option && <View style={styles.radioSelected} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    value === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {question.type === 'checkbox' && (
        <View style={styles.optionsContainer}>
          {(!question.options || question.options.length === 0) ? (
            <Text style={styles.noOptionsText}>
              Esta pregunta no tiene opciones configuradas
            </Text>
          ) : (
            question.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionButton,
                  ((value as string[]) || []).includes(option) &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  handleCheckboxChange(
                    option,
                    !((value as string[]) || []).includes(option)
                  )
                }
              >
                <View style={styles.checkbox}>
                  {((value as string[]) || []).includes(option) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    ((value as string[]) || []).includes(option) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {question.type === 'dropdown' && (
        <View style={styles.dropdownContainer}>
          {(!question.options || question.options.length === 0) ? (
            <Text style={styles.noOptionsText}>
              Esta pregunta no tiene opciones configuradas
            </Text>
          ) : (
            <View style={styles.dropdownOptionsWrapper}>
              <Text style={styles.dropdownLabel}>Selecciona una opción:</Text>
              <View style={styles.optionsContainer}>
                {question.options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      value === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => onChange(option)}
                  >
                    <View style={styles.radio}>
                      {value === option && <View style={styles.radioSelected} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        value === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {question.type === 'scale' && (
        <View style={styles.scaleContainer}>
          {(!question.options || question.options.length === 0) ? (
            <Text style={styles.noOptionsText}>
              Esta pregunta no tiene opciones configuradas
            </Text>
          ) : (
            <>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabel}>Menor</Text>
                <Text style={styles.scaleLabel}>Mayor</Text>
              </View>
              <View style={styles.scaleButtons}>
                {question.options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.scaleButton,
                      value === option && styles.scaleButtonSelected,
                    ]}
                    onPress={() => onChange(option)}
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        value === option && styles.scaleButtonTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
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
  headerCard: {
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  requiredNote: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requiredNoteText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  expirationBadge: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  expirationText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  emailCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  alreadyRespondedCard: {
    backgroundColor: '#F0FDF4',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alreadyRespondedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  alreadyRespondedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  alreadyRespondedText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  required: {
    color: '#DC2626',
  },
  questionImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionImage: {
    width: '100%',
    height: 200,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 50,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#DC2626',
    fontWeight: '600',
  },
  dropdownContainer: {
    marginTop: 4,
  },
  dropdownOptionsWrapper: {
    gap: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  scaleContainer: {
    marginTop: 4,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  scaleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  scaleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  scaleButtonTextSelected: {
    color: '#fff',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#DC2626',
    fontStyle: 'italic',
    padding: 12,
    textAlign: 'center',
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submittingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submittingText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
});

export default SurveyResponseScreen;
