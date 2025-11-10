import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSurveyStore } from '../../stores/surveyStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { CustomButton } from '../../components/CustomButton';
import { Navbar } from '../../components/Navbar';
import { Question } from '../../../core/domain/entities/Survey';
import { MainStackParamList } from '../../navigation/types';
import { surveyDataSource } from '../../../data/datasources/survey.datasource';
import { styles } from './SurveyResponseScreen.styles';

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

export default SurveyResponseScreen;
