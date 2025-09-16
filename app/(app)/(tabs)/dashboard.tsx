import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { TrendingUp, Users, DollarSign, Calendar, ChartBar as BarChart3, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { profile, subscription } = useAuth();
  const [stats, setStats] = useState({
    totalTransfers: 0,
    activeTransfers: 0,
    completedTransfers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPassengers: 0,
    privateTransfers: 0,
    publicTransfers: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch transfers
      const { data: transfers } = await supabase
        .from('transfers')
        .select('*, transfer_participations(*)')
        .eq('creator_id', profile.id);

      if (transfers) {
        const activeTransfers = transfers.filter(t => 
          t.status === 'available' || t.status === 'full'
        );
        
        const completedTransfers = transfers.filter(t => t.status === 'completed');
        
        const totalRevenue = transfers.reduce((sum, transfer) => {
          return sum + ((transfer.price_per_seat || 0) * transfer.occupied_seats);
        }, 0);

        // Calculate current month revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = transfers
          .filter(t => {
            const transferDate = new Date(t.created_at);
            return transferDate.getMonth() === currentMonth && 
                   transferDate.getFullYear() === currentYear;
          })
          .reduce((sum, transfer) => {
            return sum + ((transfer.price_per_seat || 0) * transfer.occupied_seats);
          }, 0);

        const totalPassengers = transfers.reduce((sum, transfer) => {
          return sum + transfer.occupied_seats;
        }, 0);

        const privateTransfers = transfers.filter(t => t.visibility === 'private').length;
        const publicTransfers = transfers.filter(t => t.visibility === 'public').length;

        setStats({
          totalTransfers: transfers.length,
          activeTransfers: activeTransfers.length,
          completedTransfers: completedTransfers.length,
          totalRevenue,
          monthlyRevenue,
          totalPassengers,
          privateTransfers,
          publicTransfers,
        });

        // Calculate monthly data for chart
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const monthTransfers = transfers.filter(t => {
            const transferDate = new Date(t.created_at);
            return transferDate.getMonth() === month && 
                   transferDate.getFullYear() === year;
          });

          const monthRevenue = monthTransfers.reduce((sum, transfer) => {
            return sum + ((transfer.price_per_seat || 0) * transfer.occupied_seats);
          }, 0);

          last6Months.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short' }),
            revenue: monthRevenue,
            transfers: monthTransfers.length,
          });
        }
        
        setMonthlyData(last6Months);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = '#2563eb', 
    subtitle 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { width: (width - 60) / 2 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          {React.cloneElement(icon as React.ReactElement, { 
            size: 20, 
            color 
          })}
        </View>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (subscription?.plan !== 'enterprise') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.upgradeContainer}>
          <BarChart3 size={64} color="#64748b" />
          <Text style={styles.upgradeTitle}>Dashboard Enterprise</Text>
          <Text style={styles.upgradeDescription}>
            Upgrade para o plano Enterprise para acessar relatórios avançados e estatísticas detalhadas.
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Fazer Upgrade</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Enterprise</Text>
        <Text style={styles.subtitle}>Visão geral do seu negócio</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total de Transfers"
            value={stats.totalTransfers}
            icon={<TrendingUp />}
            color="#2563eb"
          />
          
          <StatCard
            title="Transfers Ativos"
            value={stats.activeTransfers}
            icon={<Calendar />}
            color="#10b981"
          />
          
          <StatCard
            title="Faturamento Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={<DollarSign />}
            color="#f59e0b"
          />
          
          <StatCard
            title="Faturamento Mensal"
            value={`R$ ${stats.monthlyRevenue.toFixed(2)}`}
            icon={<DollarSign />}
            color="#10b981"
          />
          
          <StatCard
            title="Total de Passageiros"
            value={stats.totalPassengers}
            icon={<Users />}
            color="#8b5cf6"
          />
          
          <StatCard
            title="Transfers Concluídos"
            value={stats.completedTransfers}
            icon={<TrendingUp />}
            color="#6b7280"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibilidade dos Transfers</Text>
          <View style={styles.visibilityStats}>
            <View style={styles.visibilityItem}>
              <Eye size={24} color="#10b981" />
              <View style={styles.visibilityInfo}>
                <Text style={styles.visibilityNumber}>{stats.publicTransfers}</Text>
                <Text style={styles.visibilityLabel}>Públicos</Text>
              </View>
            </View>
            <View style={styles.visibilityItem}>
              <EyeOff size={24} color="#f59e0b" />
              <View style={styles.visibilityInfo}>
                <Text style={styles.visibilityNumber}>{stats.privateTransfers}</Text>
                <Text style={styles.visibilityLabel}>Privados</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos 6 Meses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartContainer}>
              {monthlyData.map((data, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartValues}>
                    <Text style={styles.chartRevenue}>
                      R$ {data.revenue.toFixed(0)}
                    </Text>
                    <Text style={styles.chartTransfers}>
                      {data.transfers} transfers
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(data.revenue / 100, 10),
                        backgroundColor: data.revenue > 0 ? '#10b981' : '#e5e7eb',
                      },
                    ]}
                  />
                  <Text style={styles.chartMonth}>{data.month}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Exportar Relatório</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Gerenciar Motoristas</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 16,
  },
  upgradeDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  visibilityStats: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  visibilityItem: {
    alignItems: 'center',
    gap: 8,
  },
  visibilityInfo: {
    alignItems: 'center',
  },
  visibilityNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  visibilityLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartBar: {
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  chartValues: {
    alignItems: 'center',
    marginBottom: 8,
  },
  chartRevenue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  chartTransfers: {
    fontSize: 10,
    color: '#64748b',
  },
  bar: {
    width: 20,
    backgroundColor: '#10b981',
    borderRadius: 2,
    minHeight: 10,
  },
  chartMonth: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});