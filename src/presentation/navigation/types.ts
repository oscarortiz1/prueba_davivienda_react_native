import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  MySurveys: undefined;
  SurveyEditor: { surveyId?: string };
  SurveyResults: { surveyId: string };
  SurveyResponse: { surveyId: string };
};

export type DrawerParamList = {
  MainStack: undefined;
};

export type AuthScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
export type DrawerScreenNavigationProp = DrawerNavigationProp<DrawerParamList>;

export type SurveyEditorRouteProp = RouteProp<MainStackParamList, 'SurveyEditor'>;
export type SurveyResultsRouteProp = RouteProp<MainStackParamList, 'SurveyResults'>;
export type SurveyResponseRouteProp = RouteProp<MainStackParamList, 'SurveyResponse'>;
