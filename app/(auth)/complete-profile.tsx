import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

export default function CompleteProfileScreen() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar uma foto');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setDocumentUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento');
    }
  };

  const uploadFile = async (uri: string, bucket: string, fileName: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: blob.type,
      });

    if (error) throw error;
    return data;
  };

  const handleCompleteProfile = async () => {
    if (!cpfCnpj || !phone) {
      Toast.show({
        type: 'error',
        text1: 'Campos obrigatórios',
        text2: 'Preencha CPF/CNPJ e telefone',
      });
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl = null;
      let documentUrl = null;

      // Upload avatar
      if (avatarUri) {
        const avatarFileName = `${user.id}/avatar_${Date.now()}.jpg`;
        await uploadFile(avatarUri, 'avatars', avatarFileName);
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarFileName);
        avatarUrl = data.publicUrl;
      }

      // Upload document
      if (documentUri) {
        const documentFileName = `${user.id}/document_${Date.now()}.pdf`;
        await uploadFile(documentUri, 'documents', documentFileName);
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(documentFileName);
        documentUrl = data.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          cpf_cnpj: cpfCnpj,
          phone: phone,
          avatar_url: avatarUrl,
          document_url: documentUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      
      Toast.show({
        type: 'success',
        text1: 'Perfil atualizado!',
        text2: 'Aguarde a análise da nossa equipe',
      });

      router.push('/(auth)/pending');
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível atualizar o perfil',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete seu perfil</Text>
          <Text style={styles.subtitle}>
            Adicione suas informações para continuar
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
            <Text style={styles.label}>Telefone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Foto de Perfil</Text>
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
            <Text style={styles.sectionTitle}>Documento (CNH)</Text>
            <TouchableOpacity style={styles.documentButton} onPress={pickDocument}>
              <Upload size={24} color="#64748b" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>
                  {documentUri ? 'Documento selecionado' : 'Selecionar documento'}
                </Text>
                <Text style={styles.documentSubtitle}>
                  PDF, JPG ou PNG até 5MB
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.completeButton, loading && styles.disabledButton]}
            onPress={handleCompleteProfile}
            disabled={loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'Salvando...' : 'Finalizar Cadastro'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: '#64748b',
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  documentButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  documentSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  completeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});