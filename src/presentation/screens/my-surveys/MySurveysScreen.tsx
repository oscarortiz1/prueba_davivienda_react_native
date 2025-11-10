import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useSurveyStore } from '../../stores/surveyStore';
import { useToastStore } from '../../stores/toastStore';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../../components/CustomButton';
import { Survey } from '../../../core/domain/entities/Survey';
import { Navbar } from '../../components/Navbar';
import { MainStackParamList } from '../../navigation/types';
import { surveyDataSource } from '../../../data/datasources/survey.datasource';
import { styles } from './MySurveysScreen.styles';

type Props = NativeStackScreenProps<MainStackParamList, 'MySurveys'>;

const MySurveysScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const surveys = useSurveyStore((state) => state.surveys);
  const publishedSurveys = useSurveyStore((state) => state.publishedSurveys);
  const loading = useSurveyStore((state) => state.loading);
  const refreshMySurveys = useSurveyStore((state) => state.refreshMySurveys);
  const refreshPublishedSurveys = useSurveyStore((state) => state.refreshPublishedSurveys);
  const deleteSurvey = useSurveyStore((state) => state.deleteSurvey);
  const showToast = useToastStore((state) => state.showToast);
  const { logout } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [respondedSurveys, setRespondedSurveys] = useState<Set<string>>(new Set());
  const [isCheckingResponses, setIsCheckingResponses] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const refreshAll = async () => {
        try {
          await refreshPublishedSurveys();
          await checkRespondedSurveys();
        } catch (error) {
        }
      };

      refreshAll();
    }, [user?.email])
  );

  useEffect(() => {
    loadSurveys();

    const interval = setInterval(() => {
      loadSurveysSilently();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSurveys = async () => {
    try {
      await Promise.all([refreshMySurveys(), refreshPublishedSurveys()]);
      await checkRespondedSurveys();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        showToast(error.message || 'Error al cargar encuestas', 'error');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const loadSurveysSilently = async () => {
    try {
      await Promise.all([refreshMySurveys(), refreshPublishedSurveys()]);
      await checkRespondedSurveys();
    } catch (error) {
    }
  };

  const checkRespondedSurveys = async () => {
    if (!user?.email) {
      return;
    }

    if (isCheckingResponses) {
      return;
    }

    setIsCheckingResponses(true);

    try {
      const currentPublishedSurveys = await surveyDataSource.getPublishedSurveys();
      const responded = new Set<string>();

      for (const survey of currentPublishedSurveys) {
        try {
          const responses = await surveyDataSource.getSurveyResponses(survey.id);

          const userEmailLower = user.email?.toLowerCase().trim();

          const hasResponded = responses.some((response) => {
            const respondentIdLower = response.respondentId?.toLowerCase().trim();
            return respondentIdLower === userEmailLower;
          });

          if (hasResponded) {
            responded.add(survey.id);
          }
        } catch (error: any) {
        }
      }

      setRespondedSurveys(responded);
    } catch (error: any) {
    } finally {
      setIsCheckingResponses(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMySurveys();
      await refreshPublishedSurveys();
      await checkRespondedSurveys();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const isExpired = (expiresAt: Date | null | undefined): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < new Date().getTime();
  };

  const handleCopyLink = async (surveyId: string) => {
    try {
      const link = `http://localhost:5173/survey/${surveyId}/respond`;
      await Share.share({
        message: `Responde esta encuesta: ${link}`,
        url: link,
      });
      showToast('Enlace compartido', 'success');
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        showToast('Error al compartir', 'error');
      }
    }
  };

  const handleDelete = (survey: Survey) => {
    setSurveyToDelete(survey);
    setDeleteModalVisible(true);
  };

  const confirmDeleteSurvey = async () => {
    if (!surveyToDelete) return;

    try {
      await deleteSurvey(surveyToDelete.id);
      showToast('Encuesta eliminada', 'success');
      setDeleteModalVisible(false);
      setSurveyToDelete(null);
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
      setDeleteModalVisible(false);
      setSurveyToDelete(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showToast('Sesión cerrada', 'success');
            } catch (error: any) {
              showToast(error.message || 'Error al cerrar sesión', 'error');
            }
          },
        },
      ]
    );
  };

  const mySurveys = surveys.filter((s) => s.createdBy === user?.id);
  const otherPublishedSurveys = publishedSurveys.filter((s) => s.createdBy !== user?.id);

  const renderSurveyCard = (survey: Survey, isMine: boolean) => (
    <View key={survey.id} style={styles.card}>
      {/* Accent bar at top */}
      <View style={[
        styles.cardAccent,
        survey.isPublished ? styles.cardAccentPublished : styles.cardAccentDraft
      ]} />

      <View style={styles.cardHeader}>
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              survey.isPublished ? styles.badgePublished : styles.badgeDraft,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                survey.isPublished ? styles.badgeTextPublished : styles.badgeTextDraft,
              ]}
            >
              {survey.isPublished ? '● Publicada' : '○ Borrador'}
            </Text>
          </View>

          {survey.isPublished && survey.expiresAt && isExpired(survey.expiresAt) && (
            <View style={[styles.badge, styles.badgeExpired]}>
              <Text style={styles.badgeTextExpired}>⏰ Expirada</Text>
            </View>
          )}
        </View>

        {/* Quick Actions in Top Right */}
        {isMine && (
          <View style={styles.quickActions}>
            {survey.isPublished && (
              <TouchableOpacity
                onPress={() => handleCopyLink(survey.id)}
                style={styles.quickActionButton}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>🔗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleDelete(survey)}
              style={[styles.quickActionButton, styles.quickActionButtonDelete]}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!survey.isPublished && isMine && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>⚠️ Guardado - No publicado</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{survey.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {survey.description}
      </Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>❓ {survey.questions.length} preguntas</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>
            📅 {new Date(survey.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {survey.expiresAt && survey.isPublished && (
        <View
          style={[
            styles.expirationBadge,
            isExpired(survey.expiresAt) ? styles.expirationExpired : styles.expirationActive,
          ]}
        >
          <Text
            style={[
              styles.expirationText,
              isExpired(survey.expiresAt)
                ? styles.expirationTextExpired
                : styles.expirationTextActive,
            ]}
          >
            ⏰{' '}
            {isExpired(survey.expiresAt)
              ? `Expiró: ${new Date(survey.expiresAt).toLocaleDateString()}`
              : `Expira: ${new Date(survey.expiresAt).toLocaleDateString()}`}
          </Text>
        </View>
      )}

      <View style={styles.cardActions}>
        {isMine ? (
          <>
            <CustomButton
              title="Editar"
              onPress={() => navigation.navigate('SurveyEditor', { surveyId: survey.id })}
              style={styles.actionButton}
            />
            <CustomButton
              title="Resultados"
              onPress={() => navigation.navigate('SurveyResults', { surveyId: survey.id })}
              variant="secondary"
              style={styles.actionButton}
            />
          </>
        ) : (
          <>
            {respondedSurveys.has(survey.id) ? (
              <View style={styles.respondedBadgeContainer}>
                <View style={styles.respondedBadge}>
                  <Text style={styles.respondedBadgeIcon}>✅</Text>
                  <Text style={styles.respondedBadgeText}>Ya respondiste</Text>
                </View>
              </View>
            ) : (
              <CustomButton
                title={isExpired(survey.expiresAt) ? 'Encuesta expirada' : 'Responder'}
                onPress={() => navigation.navigate('SurveyResponse', { surveyId: survey.id })}
                disabled={isExpired(survey.expiresAt)}
                style={{ flex: 1 }}
              />
            )}
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <Navbar
        title="Mis Encuestas"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        showBackButton={false}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* My Surveys Section */}
        <View style={styles.section}>
          {/* Hero Header */}
          <View style={styles.heroHeader}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>✨ Mis encuestas creadas</Text>
              <Text style={styles.heroSubtitle}>
                Gestiona y publica tus encuestas
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('SurveyEditor', { surveyId: 'new' })}
            >
              <View style={styles.createButtonContent}>
                <Text style={styles.createButtonIcon}>+</Text>
                <Text style={styles.createButtonText}>Nueva</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mySurveys.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberPublished]}>
                {mySurveys.filter(s => s.isPublished).length}
              </Text>
              <Text style={styles.statLabel}>Publicadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberDraft]}>
                {mySurveys.filter(s => !s.isPublished).length}
              </Text>
              <Text style={styles.statLabel}>Borradores</Text>
            </View>
          </View>

          {initialLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Cargando...</Text>
            </View>
          ) : mySurveys.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>No tienes encuestas</Text>
              <Text style={styles.emptyStateDescription}>
                Comienza creando tu primera encuesta
              </Text>
              <CustomButton
                title="Crear mi primera encuesta"
                onPress={() => navigation.navigate('SurveyEditor', { surveyId: 'new' })}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            mySurveys.map((survey) => renderSurveyCard(survey, true))
          )}
        </View>

        {/* Published Surveys Section */}
        {otherPublishedSurveys.length > 0 && (
          <View style={styles.section}>
            <View style={styles.publishedHeader}>
              <View style={styles.publishedHeaderIcon}>
                <Text style={styles.publishedIconText}>🌍</Text>
              </View>
              <View style={styles.publishedHeaderContent}>
                <Text style={styles.sectionTitle}>Encuestas publicadas</Text>
                <Text style={styles.sectionSubtitle}>
                  Explora y responde encuestas de otros usuarios
                </Text>
              </View>
            </View>
            {otherPublishedSurveys.map((survey) => renderSurveyCard(survey, false))}
          </View>
        )}
      </ScrollView>

      {/* Modal de confirmación de eliminación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar encuesta</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de eliminar "{surveyToDelete?.title}"?{'\n\n'}
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSurveyToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteSurvey}
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

export default MySurveysScreen;
