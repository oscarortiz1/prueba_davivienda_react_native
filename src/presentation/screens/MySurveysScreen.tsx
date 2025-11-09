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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useSurveyStore } from '../stores/surveyStore';
import { useToastStore } from '../stores/toastStore';
import { useAuth } from '../hooks/useAuth';
import { CustomButton } from '../components/CustomButton';
import { Survey } from '../../core/domain/entities/Survey';
import { Navbar } from '../components/Navbar';
import { MainStackParamList } from '../navigation/types';

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

  useEffect(() => {
    loadSurveys();
    
    // Refresh all surveys every 3 seconds for real-time updates
    const interval = setInterval(() => {
      refreshMySurveys().catch(() => {});
      refreshPublishedSurveys().catch(() => {});
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSurveys = async () => {
    try {
      await Promise.all([refreshMySurveys(), refreshPublishedSurveys()]);
    } catch (error: any) {
      // Don't show toast for 401/403 - interceptor handles logout
      const status = error?.response?.status;
      if (status !== 401 && status !== 403) {
        showToast(error.message || 'Error al cargar encuestas', 'error');
      }
    } finally {
      setInitialLoading(false);
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
      // Generate the correct survey response link
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

  const handleDelete = async (survey: Survey) => {
    console.log('🗑️ [Delete] Survey ID:', survey.id);
    
    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined' 
      ? window.confirm(`¿Estás seguro de eliminar "${survey.title}"? Esta acción no se puede deshacer.`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Eliminar encuesta',
            `¿Estás seguro de eliminar "${survey.title}"? Esta acción no se puede deshacer.`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (!confirmed) {
      console.log('❌ [Delete] Cancelled by user');
      return;
    }
    
    try {
      console.log('🗑️ [Delete] Calling deleteSurvey...');
      await deleteSurvey(survey.id);
      console.log('✅ [Delete] Survey deleted successfully');
      showToast('Encuesta eliminada', 'success');
    } catch (error: any) {
      console.error('❌ [Delete] Error:', error);
      showToast(error.message || 'Error al eliminar', 'error');
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  heroHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  statNumberPublished: {
    color: '#059669',
  },
  statNumberDraft: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
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
  publishedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  publishedHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishedIconText: {
    fontSize: 24,
  },
  publishedHeaderContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardAccentPublished: {
    backgroundColor: '#059669',
  },
  cardAccentDraft: {
    backgroundColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionButtonDelete: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
  },
  quickActionIcon: {
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
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
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 8,
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
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
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
