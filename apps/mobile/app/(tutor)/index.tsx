import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { RoleSwitcherPill } from '@/components/RoleSwitcherPill';
import { colors, radius, spacing, typography } from '@/theme';

type RequestFilter = 'ALL' | 'OPEN_AUTO_MATCH' | 'DIRECT';

export default function TutorRequestsScreen() {
  const router = useRouter();
  const {
    user,
    tutorIncomingRequests,
    tutorConfirmedSessions,
    tutorEarnings,
    acceptTutorRequest,
    declineTutorRequest,
    logout,
  } = useAuth();

  const [filter, setFilter] = useState<RequestFilter>('ALL');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    if (filter === 'ALL') return tutorIncomingRequests;
    return tutorIncomingRequests.filter((r) => r.path === filter);
  }, [tutorIncomingRequests, filter]);

  const handleAccept = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      const res = await acceptTutorRequest(requestId);
      Alert.alert(res.ok ? 'تم قبول الطلب بنجاح' : 'تنبيه', res.message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = (requestId: string) => {
    declineTutorRequest(requestId);
    Alert.alert('تم رفض الطلب', 'تمت إزالة الطلب من قائمتك الواردة.');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Tutor Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greetingSub}>بوابة المعلم المعتمد</Text>
            <Text style={typography.h2} numberOfLines={1}>
              {user?.fullName}
            </Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        {/* Role Switcher for Demo/Testing */}
        <View style={styles.roleBar}>
          <Text style={styles.roleBarLabel}>تبديل الدور:</Text>
          <View style={{ flex: 1 }}>
            <RoleSwitcherPill />
          </View>
        </View>

        {/* Approved Status & KPIs */}
        <Card tone="teal" style={styles.kpiCard}>
          <View style={styles.approvedRow}>
            <View style={styles.approvedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primaryDark} />
              <Text style={styles.approvedText}>حساب معلم معتمد ومؤهل لاستقبال الطلبات</Text>
            </View>
          </View>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiVal}>{tutorIncomingRequests.length}</Text>
              <Text style={styles.kpiLabel}>طلبات واردة</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiVal}>{tutorConfirmedSessions.length}</Text>
              <Text style={styles.kpiLabel}>جلسات مؤكدة</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiVal}>{tutorEarnings.averageRating} ★</Text>
              <Text style={styles.kpiLabel}>التقييم العام</Text>
            </View>
          </View>
        </Card>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'ALL' as const, label: 'الكل' },
            { key: 'OPEN_AUTO_MATCH' as const, label: 'طلبات مفتوحة (Auto-Match)' },
            { key: 'DIRECT' as const, label: 'طلبات مباشرة' },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Incoming Requests */}
        <View>
          <SectionHeader
            title="الطلبات الواردة (قبول ذري فوري)"
            subtitle="أول معلم يقبل الطلب المفتوح يحصل على التثبيت الفوري دون تعارض"
          />

          {filteredRequests.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle-outline" size={38} color={colors.primary} />
              <Text style={styles.emptyTitle}>لا توجد طلبات معلقة حالياً</Text>
              <Text style={styles.emptySub}>
                ستصلك إشعارات فورية فور توفر طلبات جديدة في تخصصاتك.
              </Text>
            </Card>
          ) : (
            <View style={styles.stack}>
              {filteredRequests.map((req) => (
                <Card key={req.id} style={styles.reqCard}>
                  <View style={styles.reqHeader}>
                    <View style={styles.reqTitleWrap}>
                      <Text style={typography.h3}>{req.subject}</Text>
                      <Text style={styles.reqStudent}>
                        الطالب: {req.studentName} • {req.grade}
                      </Text>
                    </View>
                    <Badge
                      label={req.path === 'DIRECT' ? 'طلب مباشر' : 'مفتوح Auto-Match'}
                      tone={req.path === 'DIRECT' ? 'sky' : 'amber'}
                    />
                  </View>

                  <View style={styles.reqMetaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {req.preferredDate} • {req.preferredTime}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{req.durationMinutes} دقيقة</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons name="cash-outline" size={14} color={colors.primaryDark} />
                      <Text style={[styles.metaText, { color: colors.primaryDark, fontWeight: '800' }]}>
                        {req.priceSar} ر.س
                      </Text>
                    </View>
                  </View>

                  {req.notes ? <Text style={styles.reqNotes}>{req.notes}</Text> : null}

                  <View style={styles.actionsRow}>
                    <Button
                      title="قبول فوري وتثبيت"
                      onPress={() => void handleAccept(req.id)}
                      loading={acceptingId === req.id}
                      icon="checkmark-circle-outline"
                      size="md"
                      style={styles.acceptBtn}
                    />
                    <Button
                      title="رفض"
                      onPress={() => handleDecline(req.id)}
                      variant="outline"
                      size="md"
                      style={styles.declineBtn}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Confirmed Sessions */}
        <View>
          <SectionHeader title="جلساتك المؤكدة القادمة" />
          <View style={styles.stack}>
            {tutorConfirmedSessions.map((sess) => (
              <Card key={sess.id} tone="sky" style={styles.confirmedCard}>
                <View style={styles.reqHeader}>
                  <View style={styles.reqTitleWrap}>
                    <Text style={typography.h3}>{sess.subject}</Text>
                    <Text style={styles.reqStudent}>
                      {sess.studentName} • {sess.preferredDate} ({sess.preferredTime})
                    </Text>
                  </View>
                  <Badge label="مؤكدة ✓" tone="success" />
                </View>
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
  greetingSub: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
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
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBarLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  kpiCard: { gap: spacing.md },
  approvedRow: { flexDirection: 'row', alignItems: 'center' },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  kpiGrid: { flexDirection: 'row', gap: spacing.sm },
  kpiItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  kpiVal: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  kpiLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary },
  stack: { gap: spacing.md },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  reqCard: { gap: spacing.sm },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  reqTitleWrap: { flex: 1, gap: 2 },
  reqStudent: { fontSize: 13, color: colors.textSecondary },
  reqMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  reqNotes: {
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    lineHeight: 20,
  },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  acceptBtn: { flex: 2 },
  declineBtn: { flex: 1 },
  confirmedCard: { padding: spacing.md },
});
