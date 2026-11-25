import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Badge, BadgeTone } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { RoleSwitcherPill } from '@/components/RoleSwitcherPill';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const {
    user,
    adminKpis,
    maintenanceMode,
    auditLogs,
    pendingTutorApps,
    pendingRefunds,
    toggleMaintenanceMode,
    logout,
  } = useAuth();

  const pendingTutorsCount = pendingTutorApps.filter((a) => a.status === 'PENDING').length;
  const pendingRefundsCount = pendingRefunds.filter((r) => r.status === 'PENDING').length;

  const handleToggleMaintenance = (next: boolean) => {
    Alert.alert(
      next ? 'تفعيل وضع الصيانة' : 'إيقاف وضع الصيانة',
      next
        ? 'سيتم إظهار شاشة الصيانة مؤقتاً للزوار مع بقاء لوحة الإدارة متاحة. هل تريد المتابعة؟'
        : 'هل تريد إعادة فتح المنصة لجميع المستخدمين الآن؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          style: next ? 'destructive' : 'default',
          onPress: () => void toggleMaintenanceMode(next),
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding');
  };

  const severityTone = (s: 'INFO' | 'WARNING' | 'CRITICAL'): BadgeTone =>
    s === 'CRITICAL' ? 'danger' : s === 'WARNING' ? 'amber' : 'teal';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.subTitle}>تطبيق الإدارة التنفيذية • السوبر أدمن</Text>
            <Text style={typography.h2} numberOfLines={1}>
              {user?.fullName}
            </Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        {/* Role Switcher */}
        <View style={styles.roleBar}>
          <Text style={styles.roleBarLabel}>تبديل الدور:</Text>
          <View style={styles.roleSwitcherFlex}>
            <RoleSwitcherPill />
          </View>
        </View>

        {/* Executive Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>إيرادات الشهر الحالي</Text>
            <Badge
              label={maintenanceMode ? 'وضع الصيانة مفعّل' : 'المنصة تعمل بكفاءة'}
              tone={maintenanceMode ? 'danger' : 'amber'}
            />
          </View>
          <Text style={styles.heroValue}>
            {adminKpis.monthlyRevenueSar.toLocaleString()} ر.س
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>إجمالي المستخدمين</Text>
              <Text style={styles.heroStatVal}>{adminKpis.totalUsers.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>جلسات اليوم</Text>
              <Text style={styles.heroStatVal}>{adminKpis.activeSessionsToday}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>التزام SLA</Text>
              <Text style={styles.heroStatVal}>{adminKpis.slaCompliancePct}%</Text>
            </View>
          </View>
        </View>

        {/* Pending Approvals Quick Jump */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push('/(admin)/approvals')}
            style={[styles.quickBox, { backgroundColor: colors.surfaceSoftAmber, borderColor: colors.highlightLight }]}
          >
            <Ionicons name="school" size={22} color={colors.highlightDark} />
            <Text style={styles.quickCount}>{pendingTutorsCount}</Text>
            <Text style={styles.quickLabel}>طلبات اعتماد معلمين</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(admin)/approvals')}
            style={[styles.quickBox, { backgroundColor: colors.surfaceSoftSky, borderColor: colors.accentLight }]}
          >
            <Ionicons name="cash" size={22} color={colors.accentDark} />
            <Text style={styles.quickCount}>{pendingRefundsCount}</Text>
            <Text style={styles.quickLabel}>موافقات Maker-Checker</Text>
          </Pressable>
        </View>

        {/* Quick Maintenance Toggle */}
        <Card tone={maintenanceMode ? 'amber' : 'default'} style={styles.maintCard}>
          <View style={styles.maintRow}>
            <View style={styles.maintInfo}>
              <View style={styles.maintTitleRow}>
                <Ionicons
                  name="construct-outline"
                  size={20}
                  color={maintenanceMode ? colors.danger : colors.primary}
                />
                <Text style={styles.maintTitle}>وضع الصيانة السريع (Maintenance)</Text>
              </View>
              <Text style={styles.maintDesc}>
                إيقاف الحجوزات مؤقتاً وتوثيق التغيير فوراً في سجل التدقيق.
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: colors.border, true: colors.dangerLight }}
              thumbColor={maintenanceMode ? colors.danger : colors.textMuted}
            />
          </View>
        </Card>

        {/* Recent Audit Feed */}
        <View>
          <SectionHeader
            title="سجل التدقيق الحي (Audit Feed)"
            subtitle="تتبع فوري للإجراءات الحساسة والحوكمة"
          />
          <View style={styles.auditStack}>
            {auditLogs.map((log) => (
              <Card key={log.id} style={styles.auditCard}>
                <View style={styles.auditTop}>
                  <Badge label={log.action} tone={severityTone(log.severity)} />
                  <Text style={styles.auditTime}>{log.createdAt}</Text>
                </View>
                <Text style={styles.auditSummary}>{log.summary}</Text>
                <Text style={styles.auditMeta}>
                  المنفذ: {log.actorName} ({log.actorRole}) • {log.entity}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  subTitle: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBarLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  roleSwitcherFlex: { flex: 1 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.elevated,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 13, color: colors.primaryLight, fontWeight: '600' },
  heroValue: { fontSize: 30, fontWeight: '800', color: colors.textOnPrimary },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroStatLabel: { fontSize: 11, color: colors.primaryLight },
  heroStatVal: { fontSize: 15, fontWeight: '800', color: colors.textOnPrimary },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickBox: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  quickCount: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  maintCard: { padding: spacing.lg },
  maintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  maintInfo: { flex: 1, gap: 4 },
  maintTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  maintTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  maintDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  auditStack: { gap: spacing.sm },
  auditCard: { padding: spacing.md, gap: 6 },
  auditTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auditTime: { fontSize: 11, color: colors.textMuted },
  auditSummary: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  auditMeta: { fontSize: 11, color: colors.textSecondary },
});
