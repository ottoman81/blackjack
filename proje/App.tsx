import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}