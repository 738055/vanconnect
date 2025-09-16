import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';

export default function PendingScreen() {
  const { signOut, profile } = useAuth();

  const getStatusIcon = () => {
    switch (profile?.status) {
      case 'pending':
        return <Clock size={48} color="#f59e0b" />;
      case 'approved':
        return <CheckCircle size={48} color="#10b981" />;
      case 'rejected':
        return <XCircle size={48} color="#ef4444" />;
      default:
        return <Clock size={48} color="#f59e0b" />;
    }
  };

  const getStatusTitle = () => {
    switch (profile?.status) {
      case 'pending':
        return 'Cadastro em Análise';
      case 'approved':
        return 'Cadastro Aprovado!';
      case 'rejected':
        return 'Cadastro Rejeitado';
      default:
        return 'Cadastro em Análise';
    }
  };

  const getStatusDescription = () => {
    switch (profile?.status) {
      case 'pending':
        return 'Sua conta está sendo analisada por nossa equipe. Você receberá uma notificação quando o processo for concluído.';
      case 'approved':
        return 'Parabéns! Sua conta foi aprovada. Agora você pode acessar todas as funcionalidades do app.';
      case 'rejected':
        return `Infelizmente, sua conta não foi aprovada. ${profile?.rejection_reason || 'Entre em contato para mais informações.'}`;
      default:
        return 'Sua conta está sendo analisada por nossa equipe.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          
          <Text style={styles.title}>{getStatusTitle()}</Text>
          <Text style={styles.description}>{getStatusDescription()}</Text>

          {profile?.status === 'pending' && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>O que analisamos:</Text>
              <Text style={styles.infoItem}>• Documentos enviados</Text>
              <Text style={styles.infoItem}>• Informações pessoais</Text>
              <Text style={styles.infoItem}>• Foto do perfil</Text>
              <Text style={styles.infoText}>
                Este processo pode levar até 24 horas úteis.
              </Text>
            </View>
          )}

          {profile?.status === 'rejected' && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {/* Navigate to complete profile */}}
            >
              <Text style={styles.retryButtonText}>Corrigir Informações</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 24,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});