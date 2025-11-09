import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSurveyStore } from '../stores/surveyStore';
import { useToastStore } from '../stores/toastStore';
import { useAuth } from '../hooks/useAuth';
import { CustomButton } from '../components/CustomButton';
import { Survey } from '../../core/domain/entities/Survey';

interface MySurveysScreenProps {
  navigation: any;
}

const MySurveysScreen: React.FC<MySurveysScreenProps> = ({ navigation }) => {
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

  useEffect(() => {
    loadSurveys();
    
    // Refresh published surveys every 5 seconds for real-time updates
    const interval = setInterval(() => {
      refreshPublishedSurveys().catch(() => {});
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSurveys = async () => {
    try {
      await Promise.all([refreshMySurveys(), refreshPublishedSurveys()]);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar encuestas', 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSurveys();
    setRefreshing(false);
  };

  const isExpired = (expiresAt: Date | null | undefined): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < new Date().getTime();
  };

  const handleCopyLink = async (surveyId: string) => {
    try {
      // In a real app, you'd have a proper deep link or web URL
      const link = `https://yourapp.com/survey/${surveyId}`;
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
    Alert.alert(
      'Eliminar encuesta',
      `¿Estás seguro de eliminar "${survey.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSurvey(survey.id);
              showToast('Encuesta eliminada', 'success');
            } catch (error: any) {
              showToast(error.message || 'Error al eliminar', 'error');
            }
          },
        },
      ]
    );
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
        <Text style={styles.metaText}>❓ {survey.questions.length} preguntas</Text>
        <Text style={styles.metaText}>
          📅 {new Date(survey.updatedAt).toLocaleDateString()}
        </Text>
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
            {survey.isPublished && (
              <TouchableOpacity
                onPress={() => handleCopyLink(survey.id)}
                style={styles.iconButton}
              >
                <Text style={styles.iconButtonText}>🔗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleDelete(survey)} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🗑️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <CustomButton
            title={isExpired(survey.expiresAt) ? 'Encuesta expirada' : 'Responder'}
            onPress={() => navigation.navigate('SurveyResponse', { surveyId: survey.id })}
            disabled={isExpired(survey.expiresAt)}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Encuestas</Text>
          <Text style={styles.headerSubtitle}>Hola, {user?.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <CustomButton
            title="+ Nueva"
            onPress={() => navigation.navigate('surveyEditor', { surveyId: 'new' })}
          />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* My Surveys Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis encuestas creadas</Text>
          {loading && mySurveys.length === 0 ? (
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
            <Text style={styles.sectionTitle}>Encuestas publicadas</Text>
            <Text style={styles.sectionSubtitle}>
              Explora y responde encuestas de otros usuarios
            </Text>
            {otherPublishedSurveys.map((survey) => renderSurveyCard(survey, false))}
          </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePublished: {
    backgroundColor: '#D1FAE5',
  },
  badgeDraft: {
    backgroundColor: '#F3F4F6',
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextPublished: {
    color: '#065F46',
  },
  badgeTextDraft: {
    color: '#374151',
  },
  badgeTextExpired: {
    color: '#991B1B',
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expirationBadge: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  expirationActive: {
    backgroundColor: '#DBEAFE',
  },
  expirationExpired: {
    backgroundColor: '#FEE2E2',
  },
  expirationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expirationTextActive: {
    color: '#1E40AF',
  },
  expirationTextExpired: {
    color: '#991B1B',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default MySurveysScreen;
