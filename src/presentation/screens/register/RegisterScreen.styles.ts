import { StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
    textShadowColor: 'rgba(237, 28, 36, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
