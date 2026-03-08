// app/(tabs)/_layout.tsx - GÜNCELLENMİŞ
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2c3e50',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Oyna',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Koleksiyon',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="scoreboard"
        options={{
          title: 'Skor Tablosu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}