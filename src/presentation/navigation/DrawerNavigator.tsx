import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '75%',
        },
        overlayColor: 'rgba(0, 0, 0, 0.3)',
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen 
        name="MainStack" 
        component={MainNavigator}
        options={{ 
          title: 'Mis Encuestas',
        }}
      />
    </Drawer.Navigator>
  );
};
