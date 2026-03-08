// app/register.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen bir isim giriniz.');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Hata', 'İsim en az 2 karakter olmalıdır.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Kayıt işlemi başlatılıyor...');
      await register(name.trim());
      console.log('✅ Kayıt başarılı, yönlendiriliyor...');
      // Otomatik yönlendirme yapılacak, burada gerek yok
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🎮 Blackjack'e Hoş Geldin!</Text>
        <Text style={styles.subtitle}>Oynamak için ismini gir</Text>
        
        <TextInput
          style={styles.input}
          placeholder="İsminizi giriniz..."
          placeholderTextColor="#95a5a6"
          value={name}
          onChangeText={setName}
          maxLength={20}
          autoCapitalize="words"
          autoFocus
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Kaydediliyor...' : 'Oyuna Başla!'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          * İsmin skor tablosunda görünecek
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  card: {
    backgroundColor: '#2c3e50',
    padding: 30,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#34495e',
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    color: '#bdc3c7',
    fontSize: 12,
    marginTop: 15,
    textAlign: 'center',
  },
});