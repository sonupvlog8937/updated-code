import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ContactScreen from '../screens/ContactScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';
import LoginScreen from '../screens/LoginScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import SecurityScreen from '../screens/SecurityScreen';
import SitemapScreen from '../screens/SitemapScreen';
import StoresScreen from '../screens/StoresScreen';
import LegalNoticeScreen from '../screens/LegalNoticeScreen';
import LiveChatScreen from '../screens/LiveChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Main Navigation Stack
 * Add all your screens here so the Footer can navigate to them
 */
export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Delivery" component={DeliveryScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Sitemap" component={SitemapScreen} />
      <Stack.Screen name="Stores" component={StoresScreen} />
      <Stack.Screen name="LegalNotice" component={LegalNoticeScreen} />
      <Stack.Screen name="LiveChat" component={LiveChatScreen} />
    </Stack.Navigator>
  );
};

/**
 * Bottom Tab Navigator (Optional)
 * Use this if you want a tab-based navigation structure
 */
export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6b00',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,107,0,0.12)',
          paddingBottom: 4,
          paddingTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={HomeScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Navigation Setup
 * Use this in your App.tsx
 */
export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
};
