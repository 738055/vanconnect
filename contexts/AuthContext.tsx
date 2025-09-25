// Em: contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log("-> AuthContext: Tentando buscar perfil para o user ID:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data || null);
      console.log("-> AuthContext: Perfil encontrado e definido no estado.");
    } catch (error) {
      console.error("-> AuthContext: ERRO ao buscar perfil:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("-> AuthContext: 1. Iniciando autenticação...");
      setLoading(true);
      
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("-> AuthContext: ERRO CRÍTICO ao obter sessão:", error);
        setLoading(false);
        return;
      }
      
      console.log("-> AuthContext: 2. getSession() concluído.", initialSession ? "Sessão encontrada." : "Nenhuma sessão.");

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      console.log("-> AuthContext: 3. Estado inicial definido. Fim do loading.");
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log(`-> AuthContext: Evento de autenticação recebido: ${_event}`);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    session,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, fullName) => 
      supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: { full_name: fullName } } 
      }),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (user) await fetchProfile(user.id);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};