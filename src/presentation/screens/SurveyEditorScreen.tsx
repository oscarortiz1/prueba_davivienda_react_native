import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
  Alert,
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
  { value: 'text', label: '📝 Texto corto' },
  { value: 'multiple-choice', label: '⭕ Opción múltiple' },
  { value: 'checkbox', label: '☑️ Casillas' },
  { value: 'dropdown', label: '📋 Desplegable' },
  { value: 'scale', label: '📊 Escala (1-5)' },
];

// Tipos de preguntas que requieren opciones
const TYPES_WITH_OPTIONS = ['multiple-choice', 'checkbox', 'dropdown'];

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
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(isNew ? null : surveyId || null);
  const [isPublished, setIsPublished] = useState(false);
  const [editingOptions, setEditingOptions] = useState<{ [key: string]: string[] }>({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; title: string } | null>(null);

  // Convertir tipo de pregunta al formato del backend (MAYÚSCULAS)
  const mapTypeToBackend = (type: QuestionType): string => {
    const mapping: Record<QuestionType, string> = {
      'text': 'TEXT',
      'textarea': 'TEXT',
      'multiple-choice': 'MULTIPLE_CHOICE',
      'checkbox': 'CHECKBOX',
      'dropdown': 'DROPDOWN',
      'scale': 'SCALE',
    };
    return mapping[type] || 'TEXT';
  };

  // Convertir tipo de pregunta del backend al formato del frontend (minúsculas)
  const mapTypeFromBackend = (type: string): QuestionType => {
    const mapping: Record<string, QuestionType> = {
      'TEXT': 'text',
      'MULTIPLE_CHOICE': 'multiple-choice',
      'CHECKBOX': 'checkbox',
      'DROPDOWN': 'dropdown',
      'SCALE': 'scale',
    };
    return mapping[type] || 'text';
  };

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
      setExpiresAt(survey.expiresAt ? new Date(survey.expiresAt).toISOString().split('T')[0] : '');

      // Mapear los tipos de preguntas del backend al frontend
      const mappedQuestions = survey.questions.map(q => ({
        ...q,
        type: mapTypeFromBackend(q.type as string) as QuestionType
      }));
      setQuestions(mappedQuestions.sort((a, b) => a.order - b.order));

      setIsPublished(survey.isPublished);
      setCurrentSurveyId(survey.id);

      // Inicializar opciones para edición
      const optionsMap: { [key: string]: string[] } = {};
      survey.questions.forEach(q => {
        if (q.options) {
          optionsMap[q.id] = q.options;
        }
      });
      setEditingOptions(optionsMap);
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

      const surveyData: any = {
        title: title.trim(),
        description: description.trim(),
      };

      // Agregar fecha de expiración si existe
      if (expiresAt) {
        surveyData.expiresAt = new Date(expiresAt);
      }

      if (!currentSurveyId) {
        // Create new survey
        const newSurvey = await createSurvey(surveyData);
        setCurrentSurveyId(newSurvey.id);
        showToast('Encuesta creada', 'success');
      } else {
        // Update existing survey
        await updateSurvey(currentSurveyId, surveyData);
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

    // Validar que las preguntas con opciones tengan al menos 2 opciones
    const invalidQuestions = questions.filter(q => {
      if (TYPES_WITH_OPTIONS.includes(q.type)) {
        return !q.options || q.options.length < 2;
      }
      return false;
    });

    if (invalidQuestions.length > 0) {
      showToast('Las preguntas de opción múltiple, casillas y desplegables deben tener al menos 2 opciones', 'error');
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

    const newQuestion: any = {
      title: 'Nueva pregunta',
      type: 'TEXT' as QuestionType,
      required: false,
      order: questions.length,
    };

    try {
      setSaving(true);
      console.log('📝 Agregando pregunta a la encuesta:', currentSurveyId);
      console.log('📝 Datos de la pregunta:', JSON.stringify(newQuestion, null, 2));
      const updatedSurvey = await addQuestion(currentSurveyId, newQuestion);
      console.log('✅ Pregunta agregada. Encuesta actualizada:', updatedSurvey);
      console.log('📋 Número de preguntas:', updatedSurvey.questions.length);

      // Mapear los tipos de preguntas del backend al frontend
      const mappedQuestions = updatedSurvey.questions.map(q => ({
        ...q,
        type: mapTypeFromBackend(q.type as string) as QuestionType
      }));
      const sortedQuestions = mappedQuestions.sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);
      showToast('Pregunta agregada', 'success');
    } catch (error: any) {
      console.error('❌ Error al agregar pregunta:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      showToast(error.response?.data?.message || error.message || 'Error al agregar pregunta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    if (!currentSurveyId) return;

    try {
      // Obtener la pregunta actual completa
      const currentQuestion = questions.find(q => q.id === questionId);
      if (!currentQuestion) return;

      // Construir el objeto completo con todos los campos requeridos
      const fullUpdate = {
        title: updates.title ?? currentQuestion.title,
        type: mapTypeToBackend(updates.type ?? currentQuestion.type),
        required: updates.required ?? currentQuestion.required,
        order: updates.order ?? currentQuestion.order,
        options: updates.options ?? currentQuestion.options,
        imageUrl: updates.imageUrl ?? currentQuestion.imageUrl,
      };

      const updatedSurvey = await updateQuestion(currentSurveyId, questionId, fullUpdate);

      // Mapear los tipos de preguntas del backend al frontend
      const mappedQuestions = updatedSurvey.questions.map(q => ({
        ...q,
        type: mapTypeFromBackend(q.type as string) as QuestionType
      }));
      setQuestions(mappedQuestions.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      console.error("❌ Error al actualizar pregunta:", error);
      console.error("❌ Response data:", error.response?.data);
      showToast(error.response?.data?.message || error.message || "Error al actualizar pregunta", "error");
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!currentSurveyId) return;

    const question = questions.find(q => q.id === questionId);
    const questionTitle = question?.title || 'esta pregunta';

    setQuestionToDelete({ id: questionId, title: questionTitle });
    setDeleteModalVisible(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!currentSurveyId || !questionToDelete) return;

    try {
      console.log("🗑️ Eliminando pregunta:", questionToDelete.id);
      const updatedSurvey = await deleteQuestion(currentSurveyId, questionToDelete.id);

      // Mapear los tipos de preguntas del backend al frontend
      const mappedQuestions = updatedSurvey.questions.map(q => ({
        ...q,
        type: mapTypeFromBackend(q.type as string) as QuestionType
      }));
      setQuestions(mappedQuestions.sort((a, b) => a.order - b.order));
      showToast('Pregunta eliminada', 'success');
      setDeleteModalVisible(false);
      setQuestionToDelete(null);
    } catch (error: any) {
      console.error("❌ Error al eliminar pregunta:", error);
      console.error("❌ Response data:", error.response?.data);
      showToast(error.response?.data?.message || error.message || "Error al eliminar pregunta", "error");
      setDeleteModalVisible(false);
      setQuestionToDelete(null);
    }
  };

  const handleAddOption = (questionId: string) => {
    const currentOptions = editingOptions[questionId] || [];
    const newOptions = [...currentOptions, `Opción ${currentOptions.length + 1}`];
    setEditingOptions({ ...editingOptions, [questionId]: newOptions });
  };

  const handleUpdateOption = (questionId: string, index: number, value: string) => {
    const currentOptions = editingOptions[questionId] || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setEditingOptions({ ...editingOptions, [questionId]: newOptions });
  };

  const handleDeleteOption = (questionId: string, index: number) => {
    const currentOptions = editingOptions[questionId] || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    setEditingOptions({ ...editingOptions, [questionId]: newOptions });
  };

  const handleSaveOptions = async (questionId: string) => {
    const options = editingOptions[questionId] || [];

    if (options.length < 2) {
      showToast('Debe haber al menos 2 opciones', 'error');
      return;
    }

    // Filtrar opciones vacías
    const validOptions = options.filter(opt => opt.trim() !== '');

    if (validOptions.length < 2) {
      showToast('Debe haber al menos 2 opciones válidas', 'error');
      return;
    }

    await handleUpdateQuestion(questionId, { options: validOptions });
    showToast('Opciones guardadas', 'success');
  };

  const handleTypeChange = async (questionId: string, newType: QuestionType) => {
    // Actualizar el estado local primero
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, type: newType } : q
    );
    setQuestions(updatedQuestions);

    // Si el nuevo tipo requiere opciones y no las tiene, inicializar con opciones por defecto
    let optionsToSet: string[] | undefined;

    if (TYPES_WITH_OPTIONS.includes(newType)) {
      const question = questions.find(q => q.id === questionId);
      if (!question?.options || question.options.length === 0) {
        optionsToSet = ['Opción 1', 'Opción 2'];
        setEditingOptions({
          ...editingOptions,
          [questionId]: optionsToSet
        });
      }
    } else if (newType === 'scale') {
      // Para escala, usar opciones del 1 al 5
      optionsToSet = ['1', '2', '3', '4', '5'];
      setEditingOptions({
        ...editingOptions,
        [questionId]: optionsToSet
      });
    }

    // Actualizar en el backend
    await handleUpdateQuestion(questionId, { type: newType, options: optionsToSet });
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
        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderText}>📋 Información básica</Text>

          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Encuesta de satisfacción del cliente"
            editable={!isPublished}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el propósito de esta encuesta"
            multiline
            numberOfLines={3}
            editable={!isPublished}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Fecha de expiración (opcional)</Text>
          <TextInput
            style={styles.input}
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="YYYY-MM-DD"
            editable={!isPublished}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.helperText}>
            Formato: AAAA-MM-DD (Ej: 2025-12-31)
          </Text>
        </View>

        {/* Preguntas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              ❓ Preguntas ({questions.length})
            </Text>
            {!isPublished && currentSurveyId && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddQuestion}
                disabled={saving}
              >
                <Text style={styles.addButtonText}>+ Agregar pregunta</Text>
              </TouchableOpacity>
            )}
          </View>

          {questions.length === 0 ? (
            <View style={styles.emptyQuestions}>
              <Text style={styles.emptyQuestionsIcon}>❓</Text>
              <Text style={styles.emptyQuestionsText}>
                No hay preguntas aún. {!currentSurveyId ? 'Guarda la encuesta primero y luego ' : ''}Agrega preguntas para comenzar.
              </Text>
            </View>
          ) : (
            questions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionBadge}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  {!isPublished && (
                    <TouchableOpacity
                      onPress={() => handleDeleteQuestion(question.id)}
                      style={styles.deleteIconButton}
                    >
                      <Text style={styles.deleteButton}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.label}>Título de la pregunta *</Text>
                <TextInput
                  style={styles.input}
                  value={question.title}
                  onChangeText={(text) => {
                    const updatedQuestions = questions.map(q =>
                      q.id === question.id ? { ...q, title: text } : q
                    );
                    setQuestions(updatedQuestions);
                  }}
                  onBlur={() => {
                    const currentQuestion = questions.find(q => q.id === question.id);
                    if (currentQuestion) {
                      handleUpdateQuestion(question.id, { title: currentQuestion.title });
                    }
                  }}
                  placeholder="Escribe tu pregunta aquí"
                  editable={!isPublished}
                  placeholderTextColor="#9CA3AF"
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
                        !isPublished && handleTypeChange(question.id, type.value)
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

                {/* Editor de opciones para preguntas de opción múltiple, checkbox y dropdown */}
                {(TYPES_WITH_OPTIONS.includes(question.type) || question.type === 'scale') && (
                  <View style={styles.optionsContainer}>
                    <View style={styles.optionsHeader}>
                      <Text style={styles.optionsLabel}>
                        {question.type === 'scale' ? 'Valores de la escala' : 'Opciones de respuesta'}
                      </Text>
                      {!isPublished && question.type !== 'scale' && (
                        <TouchableOpacity
                          style={styles.addOptionButton}
                          onPress={() => handleAddOption(question.id)}
                        >
                          <Text style={styles.addOptionText}>+ Agregar</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {(editingOptions[question.id] || question.options || []).map((option, optIndex) => (
                      <View key={optIndex} style={styles.optionRow}>
                        <TextInput
                          style={styles.optionInput}
                          value={editingOptions[question.id]?.[optIndex] ?? option}
                          onChangeText={(text) => handleUpdateOption(question.id, optIndex, text)}
                          placeholder={`Opción ${optIndex + 1}`}
                          editable={!isPublished && question.type !== 'scale'}
                          placeholderTextColor="#9CA3AF"
                        />
                        {!isPublished && question.type !== 'scale' && (
                          <TouchableOpacity
                            onPress={() => handleDeleteOption(question.id, optIndex)}
                            style={styles.deleteOptionButton}
                          >
                            <Text style={styles.deleteOptionText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    {!isPublished && editingOptions[question.id] && question.type !== 'scale' && (
                      <CustomButton
                        title="Guardar opciones"
                        onPress={() => handleSaveOptions(question.id)}
                        style={styles.saveOptionsButton}
                      />
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.requiredToggle}
                  onPress={() =>
                    !isPublished &&
                    handleUpdateQuestion(question.id, { required: !question.required })
                  }
                  disabled={isPublished}
                >
                  <Text style={styles.requiredText}>
                    {question.required ? '☑️' : '☐'} Pregunta obligatoria
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer con botones de acción */}
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

      {isPublished && (
        <View style={styles.publishedBanner}>
          <Text style={styles.publishedText}>✅ Esta encuesta ya está publicada</Text>
        </View>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar pregunta</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de eliminar "{questionToDelete?.title}"?{'\n\n'}
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setQuestionToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteQuestion}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
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
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyQuestionsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyQuestionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionBadge: {
    backgroundColor: '#DC2626',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteIconButton: {
    padding: 4,
  },
  deleteButton: {
    fontSize: 24,
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
    fontSize: 13,
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  optionsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  addOptionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOptionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#111827',
  },
  deleteOptionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteOptionText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveOptionsButton: {
    marginTop: 8,
  },
  requiredToggle: {
    paddingVertical: 12,
    marginTop: 8,
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
  publishedBanner: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#86EFAC',
  },
  publishedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SurveyEditorScreen;
