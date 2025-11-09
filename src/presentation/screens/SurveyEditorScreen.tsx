import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSurveyStore } from '../stores/surveyStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { CustomButton } from '../components/CustomButton';
import { Navbar } from '../components/Navbar';
import { Question, QuestionType } from '../../core/domain/entities/Survey';
import { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SurveyEditor'>;

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: '📝 Texto' },
  { value: 'multiple-choice', label: '⭕ Opción múltiple' },
  { value: 'checkbox', label: '☑️ Casillas' },
  { value: 'dropdown', label: '📋 Desplegable' },
  { value: 'scale', label: '📊 Escala' },
];

const SurveyEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { surveyId } = route.params || {};
  const isNew = !surveyId || surveyId === 'new';

  const user = useAuthStore((state) => state.user);
  const getSurvey = useSurveyStore((state) => state.getSurvey);
  const createSurvey = useSurveyStore((state) => state.createSurvey);
  const updateSurvey = useSurveyStore((state) => state.updateSurvey);
  const publishSurvey = useSurveyStore((state) => state.publishSurvey);
  const addQuestion = useSurveyStore((state) => state.addQuestion);
  const updateQuestion = useSurveyStore((state) => state.updateQuestion);
  const deleteQuestion = useSurveyStore((state) => state.deleteQuestion);
  const showToast = useToastStore((state) => state.showToast);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(isNew ? null : surveyId || null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!isNew && surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

  const loadSurvey = async () => {
    if (!surveyId) return;
    
    try {
      setLoading(true);
      const survey = await getSurvey(surveyId);
      
      // Verificar si el usuario es el creador
      if (survey.createdBy !== user?.id) {
        showToast('No tienes permiso para editar esta encuesta', 'error');
        navigation.goBack();
        return;
      }
      
      setTitle(survey.title);
      setDescription(survey.description);
      setQuestions(survey.questions.sort((a, b) => a.order - b.order));
      setIsPublished(survey.isPublished);
      setCurrentSurveyId(survey.id);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar encuesta', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('El título es requerido', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('La descripción es requerida', 'error');
      return;
    }

    try {
      setSaving(true);
      
      if (!currentSurveyId) {
        // Create new survey
        const newSurvey = await createSurvey({
          title: title.trim(),
          description: description.trim(),
        });
        setCurrentSurveyId(newSurvey.id);
        showToast('Encuesta creada', 'success');
      } else {
        // Update existing survey
        await updateSurvey(currentSurveyId, {
          title: title.trim(),
          description: description.trim(),
        });
        showToast('Encuesta actualizada', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentSurveyId) {
      showToast('Guarda la encuesta primero', 'info');
      return;
    }

    if (questions.length === 0) {
      showToast('Agrega al menos una pregunta', 'error');
      return;
    }

    Alert.alert(
      'Publicar encuesta',
      '¿Estás seguro de publicar esta encuesta? Los usuarios podrán responderla.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Publicar',
          onPress: async () => {
            try {
              setSaving(true);
              await publishSurvey(currentSurveyId);
              setIsPublished(true);
              showToast('Encuesta publicada exitosamente', 'success');
              navigation.goBack();
            } catch (error: any) {
              showToast(error.message || 'Error al publicar', 'error');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleAddQuestion = async () => {
    if (!currentSurveyId) {
      showToast('Guarda la encuesta primero', 'info');
      return;
    }

    const newQuestion = {
      title: 'Nueva pregunta',
      type: 'text' as QuestionType,
      required: false,
      order: questions.length,
    };

    try {
      setSaving(true);
      const updatedSurvey = await addQuestion(currentSurveyId, newQuestion);
      setQuestions(updatedSurvey.questions.sort((a, b) => a.order - b.order));
      showToast('Pregunta agregada', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al agregar pregunta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    if (!currentSurveyId) return;

    try {
      const updatedSurvey = await updateQuestion(currentSurveyId, questionId, updates);
      setQuestions(updatedSurvey.questions.sort((a, b) => a.order - b.order));
      showToast('Pregunta actualizada', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al actualizar pregunta', 'error');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentSurveyId) return;

    Alert.alert('Eliminar pregunta', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedSurvey = await deleteQuestion(currentSurveyId, questionId);
            setQuestions(updatedSurvey.questions.sort((a, b) => a.order - b.order));
            showToast('Pregunta eliminada', 'success');
          } catch (error: any) {
            showToast(error.message || 'Error al eliminar pregunta', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title={isNew ? 'Nueva Encuesta' : 'Editar Encuesta'}
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

  return (
    <View style={styles.container}>
      <Navbar
        title={isNew ? 'Nueva Encuesta' : 'Editar Encuesta'}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Título de la encuesta"
            editable={!isPublished}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el propósito de esta encuesta"
            multiline
            numberOfLines={3}
            editable={!isPublished}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preguntas ({questions.length})</Text>
            {!isPublished && currentSurveyId && (
              <CustomButton title="+ Agregar" onPress={handleAddQuestion} />
            )}
          </View>

          {questions.length === 0 ? (
            <View style={styles.emptyQuestions}>
              <Text style={styles.emptyQuestionsIcon}>❓</Text>
              <Text style={styles.emptyQuestionsText}>
                No hay preguntas aún. Guarda la encuesta y agrega preguntas.
              </Text>
            </View>
          ) : (
            questions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
                  {!isPublished && (
                    <TouchableOpacity onPress={() => handleDeleteQuestion(question.id)}>
                      <Text style={styles.deleteButton}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  value={question.title}
                  onChangeText={(text) =>
                    handleUpdateQuestion(question.id, { title: text })
                  }
                  placeholder="Título de la pregunta"
                  editable={!isPublished}
                />

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

                <Text style={styles.label}>Tipo de pregunta</Text>
                <View style={styles.typeSelector}>
                  {QUESTION_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeButton,
                        question.type === type.value && styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        !isPublished &&
                        handleUpdateQuestion(question.id, { type: type.value })
                      }
                      disabled={isPublished}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          question.type === type.value && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.requiredToggle}
                  onPress={() =>
                    !isPublished &&
                    handleUpdateQuestion(question.id, { required: !question.required })
                  }
                  disabled={isPublished}
                >
                  <Text style={styles.requiredText}>
                    {question.required ? '☑️' : '☐'} Requerida
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {!isPublished && (
        <View style={styles.footer}>
          <CustomButton
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          />
          {currentSurveyId && questions.length > 0 && (
            <CustomButton
              title="Publicar"
              onPress={handlePublish}
              disabled={saving}
              style={{ flex: 1 }}
              variant="secondary"
            />
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyQuestions: {
    padding: 32,
    alignItems: 'center',
  },
  emptyQuestionsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyQuestionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  deleteButton: {
    fontSize: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  typeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  requiredToggle: {
    paddingVertical: 8,
  },
  requiredText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  questionImageContainer: {
    marginTop: 12,
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
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default SurveyEditorScreen;
