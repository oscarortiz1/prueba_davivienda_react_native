import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSurveyStore } from '../../stores/surveyStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { CustomButton } from '../../components/CustomButton';
import { Navbar } from '../../components/Navbar';
import { Question, QuestionType } from '../../../core/domain/entities/Survey';
import { MainStackParamList } from '../../navigation/types';
import { styles } from './SurveyEditorScreen.styles';

type Props = NativeStackScreenProps<MainStackParamList, 'SurveyEditor'>;

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'text', label: '📝 Texto corto' },
  { value: 'multiple-choice', label: '⭕ Opción múltiple' },
  { value: 'checkbox', label: '☑️ Casillas' },
  { value: 'dropdown', label: '📋 Desplegable' },
  { value: 'scale', label: '📊 Escala (1-5)' },
];

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

      if (survey.createdBy !== user?.id) {
        showToast('No tienes permiso para editar esta encuesta', 'error');
        navigation.goBack();
        return;
      }

      setTitle(survey.title);
      setDescription(survey.description);
      setExpiresAt(survey.expiresAt ? new Date(survey.expiresAt).toISOString().split('T')[0] : '');

      const mappedQuestions = survey.questions.map(q => ({
        ...q,
        type: mapTypeFromBackend(q.type as string) as QuestionType
      }));
      setQuestions(mappedQuestions.sort((a, b) => a.order - b.order));

      setIsPublished(survey.isPublished);
      setCurrentSurveyId(survey.id);

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

      if (expiresAt) {
        surveyData.expiresAt = new Date(expiresAt);
      }

      if (!currentSurveyId) {
        const newSurvey = await createSurvey(surveyData);
        setCurrentSurveyId(newSurvey.id);
        showToast('Encuesta creada', 'success');
      } else {
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
    console.log('[Publicar] currentSurveyId:', currentSurveyId);
    if (!currentSurveyId) {
      showToast('Guarda la encuesta primero', 'info');
      console.log('[Publicar] Encuesta no guardada');
      return;
    }

    console.log('[Publicar] preguntas:', questions);
    if (questions.length === 0) {
      showToast('Agrega al menos una pregunta', 'error');
      console.log('[Publicar] Sin preguntas');
      return;
    }

    const invalidQuestions = questions.filter(q => {
      if (TYPES_WITH_OPTIONS.includes(q.type)) {
        return !q.options || q.options.length < 2;
      }
      return false;
    });

    if (invalidQuestions.length > 0) {
      showToast('Las preguntas de opción múltiple, casillas y desplegables deben tener al menos 2 opciones', 'error');
      console.log('[Publicar] Preguntas inválidas:', invalidQuestions);
      return;
    }

    try {
      setSaving(true);
      console.log('[Publicar] Llamando publishSurvey con id:', currentSurveyId);
      const result = await publishSurvey(currentSurveyId);
      console.log('[Publicar] Resultado:', result);
      setIsPublished(true);
      showToast('Encuesta publicada exitosamente', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || 'Error al publicar', 'error');
      console.log('[Publicar] Error:', error);
    } finally {
      setSaving(false);
    }
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
      const currentQuestion = questions.find(q => q.id === questionId);
      if (!currentQuestion) return;

      const fullUpdate = {
        title: updates.title ?? currentQuestion.title,
        type: mapTypeToBackend(updates.type ?? currentQuestion.type),
        required: updates.required ?? currentQuestion.required,
        order: updates.order ?? currentQuestion.order,
        options: updates.options ?? currentQuestion.options,
        imageUrl: updates.imageUrl ?? currentQuestion.imageUrl,
      };

      const updatedSurvey = await updateQuestion(currentSurveyId, questionId, fullUpdate);

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

    const validOptions = options.filter(opt => opt.trim() !== '');

    if (validOptions.length < 2) {
      showToast('Debe haber al menos 2 opciones válidas', 'error');
      return;
    }

    await handleUpdateQuestion(questionId, { options: validOptions });
    showToast('Opciones guardadas', 'success');
  };

  const handleTypeChange = async (questionId: string, newType: QuestionType) => {
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, type: newType } : q
    );
    setQuestions(updatedQuestions);

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
      optionsToSet = ['1', '2', '3', '4', '5'];
      setEditingOptions({
        ...editingOptions,
        [questionId]: optionsToSet
      });
    }

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

export default SurveyEditorScreen;
