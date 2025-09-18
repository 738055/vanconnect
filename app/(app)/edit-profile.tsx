import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { User, Phone, Save, X } from 'lucide-react-native';

export default function EditProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const router = useRouter();

  const fetchProfileData = useCallback(async () => {
    if (!profile || !session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(session.user.email || '');
    } catch (error: any) {
      console.error('Erro ao carregar os dados do perfil:', error.message);
      Alert.alert('Erro', 'Não foi possível carregar as informações do perfil.');
    } finally {
      setLoading(false);
    }
  }, [profile, session]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const handleUpdateProfile = async () => {
    if (!profile) {
      Alert.alert('Erro', 'Não foi possível encontrar o perfil do usuário.');
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Erro de Validação', 'Nome completo e telefone são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        phone: phone.trim(),
      }).eq('id', profile.id);

      if (error) {
        throw error;
      }
      
      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro ao atualizar o perfil:', error.message);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar suas alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>Atualize suas informações pessoais.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputWithIcon}>
              <User size={20} color="#64748b" />
              <TextInput
                style={styles.inputText}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Seu nome completo"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={20} color="#64748b" />
              <TextInput
                style={styles.inputText}
                value={phone}
                onChangeText={setPhone}
                placeholder="(XX) XXXXX-XXXX"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWithIcon, styles.disabledInput]}>
              <X size={20} color="#64748b" />
              <TextInput
                style={styles.inputText}
                value={email}
                editable={false}
              />
            </View>
            <Text style={styles.infoText}>O email não pode ser alterado.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={handleUpdateProfile}
          disabled={isSaving}
        >
          <Save size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollViewContent: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#64748b' },
  form: { gap: 24 },
  inputContainer: { marginBottom: 0 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  inputText: { flex: 1, fontSize: 16, paddingVertical: 14 },
  disabledInput: { backgroundColor: '#f1f5f9' },
  infoText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
});