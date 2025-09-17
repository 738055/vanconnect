import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Subscription } from '../types/database';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Este listener é ótimo para manter a sessão ativa quando o app é reaberto.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser); // Atualiza o usuário com base na sessão

        if (currentUser) {
          // Apenas busca o perfil se ele ainda não estiver carregado
          if (!profile || profile.id !== currentUser.id) {
            await fetchProfile(currentUser.id);
          } else {
            setLoading(false);
          }
        } else {
          // Limpa tudo se não houver sessão
          setProfile(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []); // Dependência vazia para rodar apenas uma vez

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(); // Usar .single() é mais seguro se o perfil sempre deve existir

      if (profileError) throw profileError;
      
      setProfile(profileData); // Atualiza o estado do perfil

      if (profileData) {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        setSubscription(subscriptionData || null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      // Limpa os dados em caso de erro para evitar um estado inconsistente
      setProfile(null);
      setSubscription(null);
    } finally {
      // Garante que o loading seja desativado ao final
      setLoading(false);
    }
  };

  // ✅ FUNÇÃO CORRIGIDA
  const signIn = async (email: string, password: string) => {
    setLoading(true); // Ativa o loading no início do processo de login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (data.user) {
      // Se o login for bem-sucedido, atualiza o estado do usuário IMEDIATAMENTE
      setUser(data.user);
      // E em seguida, busca os dados do perfil associado
      await fetchProfile(data.user.id);
    } else {
      // Se o login falhar, desativa o loading
      setLoading(false);
    }

    // Retorna o erro, se houver, para a tela de login poder exibi-lo
    return { error };
  };

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
    // Limpa todos os estados manualmente para garantir uma transição limpa
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

  return (
    <AuthContext.Provider
      value={{ user, profile, subscription, session, loading, isAuthenticated, signIn, signUp, signOut, refreshProfile }}
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