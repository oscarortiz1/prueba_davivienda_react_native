import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';

// Auth Stack Navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Stack Navigation (dentro del Drawer)
export type MainStackParamList = {
  MySurveys: undefined;
  SurveyEditor: { surveyId?: string };
  SurveyResults: { surveyId: string };
  SurveyResponse: { surveyId: string };
};

// Drawer Navigation
export type DrawerParamList = {
  MainStack: undefined;
};

// Navigation Props Types
export type AuthScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
export type DrawerScreenNavigationProp = DrawerNavigationProp<DrawerParamList>;

// Route Props Types
export type SurveyEditorRouteProp = RouteProp<MainStackParamList, 'SurveyEditor'>;
export type SurveyResultsRouteProp = RouteProp<MainStackParamList, 'SurveyResults'>;
export type SurveyResponseRouteProp = RouteProp<MainStackParamList, 'SurveyResponse'>;
