import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
// ✅ CORREÇÃO 1: Importando do caminho 'legacy' para compatibilidade.
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function CompleteProfileScreen() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [documentUris, setDocumentUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshProfile, loading: authLoading } = useAuth();

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (!result.canceled) { setAvatarUri(result.assets[0].uri); }
    } catch (error) { Alert.alert('Erro', 'Não foi possível selecionar a imagem.'); }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true, multiple: true });
      if (!result.canceled) { const uris = result.assets.map(asset => asset.uri); setDocumentUris(uris); }
    } catch (error) { Alert.alert('Erro', 'Não foi possível selecionar os documentos'); }
  };

  const uploadFile = async (uri: string, bucket: string, fileName: string) => {
    // ✅ CORREÇÃO 2: Voltamos a usar o 'readAsStringAsync', que agora é importado corretamente sem o aviso.
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const fileExt = fileName.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const contentType = fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, decode(base64), { contentType });
    if (error) throw error;
  };

  const handleCompleteProfile = async () => {
    if (!cpfCnpj || !phone || !avatarUri || documentUris.length === 0) {
      Toast.show({ type: 'error', text1: 'Campos obrigatórios' }); return;
    }
    if (!user) {
      Toast.show({ type: 'error', text1: 'Erro de Autenticação' }); return;
    }
    setIsSubmitting(true);
    try {
      const avatarExt = avatarUri.split('.').pop();
      const avatarFileName = `${user.id}/avatar.${avatarExt}`;
      await uploadFile(avatarUri, 'avatars', avatarFileName);
      const { data: avatarData } = supabase.storage.from('avatars').getPublicUrl(avatarFileName);
      const avatarUrl = avatarData.publicUrl;
      
      const documentPaths = await Promise.all(
        documentUris.map(async (uri, index) => {
          const docExt = uri.split('.').pop();
          const documentFileName = `${user.id}/document_${index}_${Date.now()}.${docExt}`;
          await uploadFile(uri, 'documents', documentFileName);
          const { data: docData } = supabase.storage.from('documents').getPublicUrl(documentFileName);
          return docData.publicUrl;
        })
      );

      const { error } = await supabase.from('profiles').update({ 
        cpf_cnpj: cpfCnpj, 
        phone: phone, 
        avatar_url: avatarUrl, 
        document_url: documentPaths, 
        status: 'pending'
      }).eq('id', user.id);

      if (error) throw error;
      
      Toast.show({ type: 'success', text1: 'Cadastro enviado para análise!' });
      await refreshProfile();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao enviar', text2: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1e2d3b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete o seu perfil</Text>
          <Text style={styles.subtitle}>
            Adicione as suas informações para podermos analisar o seu cadastro.
          </Text>
        </View>
        <View style={styles.form}>
            <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF ou CNPJ *</Text>
            <TextInput
              style={styles.input}
              value={cpfCnpj}
              onChangeText={setCpfCnpj}
              placeholder="000.000.000-00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone com DDD *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Foto de Perfil *</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Camera size={32} color="#64748b" />
                  <Text style={styles.uploadText}>Adicionar foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Documento (CNH frente e verso) *</Text>
            <TouchableOpacity style={styles.documentButton} onPress={pickDocument}>
              <Upload size={24} color="#64748b" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  {documentUris.length > 0
                    ? `${documentUris.length} ficheiro(s) selecionado(s)`
                    : 'Selecionar documento(s)'}
                </Text>
                <Text style={styles.documentSubtitle}>
                  PDF, JPG ou PNG
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.completeButton, isSubmitting && styles.disabledButton]}
            onPress={handleCompleteProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.completeButtonText}>
                Enviar para Análise
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollView: { flex: 1 },
    header: { paddingHorizontal: 24, paddingVertical: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#64748b' },
    form: { paddingHorizontal: 24, paddingBottom: 32 },
    inputContainer: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
    uploadSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 16 },
    uploadButton: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 16, color: '#64748b' },
    avatarPreview: { width: 100, height: 100, borderRadius: 50 },
    documentButton: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    documentInfo: { flex: 1 },
    documentTitle: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
    documentSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
    completeButton: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    disabledButton: { backgroundColor: '#93c5fd' },
    completeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});