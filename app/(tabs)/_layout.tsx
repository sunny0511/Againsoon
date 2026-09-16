import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { colors, fonts } from '@/src/theme';

export default function TabLayout() {
  const tabHeight = useClientOnlyValue(64, 78);
  const tabPad = useClientOnlyValue(8, 18);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDeep,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: tabPad,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="us"
        options={{
          title: 'Us',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
