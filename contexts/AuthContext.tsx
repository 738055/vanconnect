// Dentro do seu arquivo contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Subscription } from '../types/database';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  registerPushToken: () => Promise<void>; // ✅ NOVO: Adicione a função para registrar o token
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Falha ao obter o token para push notification!');
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } else {
    alert('As notificações push não funcionam em simuladores!');
    return;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // ✅ FUNÇÃO CORRIGIDA PARA BUSCAR O PERFIL E INSCRIÇÃO
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setSubscription(subscriptionData || null);

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
      setSubscription(null);
    }
  };

  // ✅ NOVO: Lógica para registrar o token de push
  const registerPushToken = async () => {
    if (!user || !profile) return;
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await supabase.from('profiles').update({ push_token: token }).eq('id', profile.id);
      }
    } catch (error) {
      console.error('Erro ao registrar token de push:', error);
    }
  };

  // ✅ FUNÇÃO CORRIGIDA PARA LOGIN
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
      registerPushToken(); // ✅ Registra o token após o login
    } else {
      setLoading(false);
    }
    return { error };
  };

  // ✅ FUNÇÃO CORRIGIDA PARA REGISTRO
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) return { error: authError };
    if (!authData.user) return { error: new Error("Usuário não encontrado após o registo.") };
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: authData.user.id, full_name: fullName, status: 'onboarding' }, { onConflict: 'id' });

    return { error: profileError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        registerPushToken(); // ✅ Registra o token na inicialização ou mudança de estado
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, subscription, session, loading, isAuthenticated, signIn, signUp, signOut, refreshProfile, registerPushToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};