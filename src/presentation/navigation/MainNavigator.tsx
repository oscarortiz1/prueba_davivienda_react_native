import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MySurveysScreen from '../screens/MySurveysScreen';
import SurveyEditorScreen from '../screens/SurveyEditorScreen';
import SurveyResultsScreen from '../screens/SurveyResultsScreen';
import SurveyResponseScreen from '../screens/SurveyResponseScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="MySurveys" 
        component={MySurveysScreen}
      />
      <Stack.Screen 
        name="SurveyEditor" 
        component={SurveyEditorScreen}
      />
      <Stack.Screen 
        name="SurveyResults" 
        component={SurveyResultsScreen}
      />
      <Stack.Screen 
        name="SurveyResponse" 
        component={SurveyResponseScreen}
      />
    </Stack.Navigator>
  );
};
