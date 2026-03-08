// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('🔍 Auth durumu:', { user: !!user, isLoading, segments });
    
    if (!isLoading) {
      // Eğer kullanıcı yoksa ve register sayfasında değilsek, register'a yönlendir
      if (!user && segments[0] !== 'register') {
        console.log('➡️ Register sayfasına yönlendiriliyor...');
        router.replace('/register');
      }
      // Eğer kullanıcı varsa ve register sayfasındaysak, tabs'a yönlendir
      else if (user && segments[0] === 'register') {
        console.log('➡️ Tabs sayfasına yönlendiriliyor...');
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);

  // Loading ekranı
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="register" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthLayout />
    </AuthProvider>
  );
}