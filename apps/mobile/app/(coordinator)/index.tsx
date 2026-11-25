import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
import { LessonRequest } from '@/types';

export default function CoordinatorInboxScreen() {
  const router = useRouter();
  const {
    user,
    lessonRequests,
    tutors,
    tickets,
    assignTutorToRequest,
    logout,
  } = useAuth();

  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'COORDINATOR'>('ALL');
  const [assigningReq, setAssigningReq] = useState<LessonRequest | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<string>(tutors[0]?.id ?? 'tut-1');
  const [submitting, setSubmitting] = useState(false);

  const filteredRequests = useMemo(() => {
    return lessonRequests.filter((r) => {
      if (filter === 'OPEN') return r.status === 'OPEN';
      if (filter === 'COORDINATOR') return r.path === 'COORDINATOR';
      return true;
    });
  }, [lessonRequests, filter]);

  const handleAssign = async () => {
    if (!assigningReq) return;
    setSubmitting(true);
    try {
      const res = await assignTutorToRequest(assigningReq.id, selectedTutorId);
      setAssigningReq(null);
      Alert.alert(res.ok ? 'تم الإسناد بنجاح' : 'تنبيه', res.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding');
  };

  const openRequestsCount = lessonRequests.filter((r) => r.status === 'OPEN').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'RESOLVED').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.flex1}>
            <Text style={styles.subTitle}>تطبيق المنسق وخدمة العملاء</Text>
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
          <View style={styles.flex1}>
            <RoleSwitcherPill />
          </View>
        </View>

        {/* Summary KPI Strip */}
        <View style={styles.kpiRow}>
          <Card tone="amber" style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: colors.highlightDark }]}>
              {openRequestsCount}
            </Text>
            <Text style={styles.kpiLabel}>طلبات بانتظار الإسناد</Text>
          </Card>
          <Card tone="sky" style={styles.kpiBox}>
            <Text style={[styles.kpiVal, { color: colors.accentDark }]}>{openTicketsCount}</Text>
            <Text style={styles.kpiLabel}>تذاكر SLA مفتوحة</Text>
          </Card>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'ALL' as const, label: 'جميع الطلبات' },
            { key: 'OPEN' as const, label: 'بانتظار الإسناد' },
            { key: 'COORDINATOR' as const, label: 'مسار المنسق' },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Incoming Requests Inbox */}
        <View>
          <SectionHeader
            title="صندوق طلبات التقوية الواردة"
            subtitle="إسناد يدوي سريع لأفضل معلم معتمد"
          />
          <View style={styles.stack}>
            {filteredRequests.map((req) => (
              <Card key={req.id} style={styles.reqCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={typography.h3}>
                      {req.subject} • {req.studentName}
                    </Text>
                    <Text style={styles.metaText}>
                      {req.grade} • {req.preferredDate} ({req.preferredTime})
                    </Text>
                  </View>
                  <Badge
                    label={req.status === 'CONFIRMED' ? 'مسند ✓' : 'مفتوح'}
                    tone={req.status === 'CONFIRMED' ? 'success' : 'amber'}
                  />
                </View>

                <View style={styles.badgesRow}>
                  <Badge
                    label={
                      req.path === 'COORDINATOR'
                        ? 'عبر المنسق'
                        : req.path === 'OPEN_AUTO_MATCH'
                        ? 'مطابقة تلقائية'
                        : 'مباشر'
                    }
                    tone="slate"
                  />
                  <Badge label={`${req.priceSar} ر.س`} tone="teal" />
                  {req.tutorName ? <Badge label={req.tutorName} tone="sky" /> : null}
                </View>

                {req.notes ? <Text style={styles.notesText}>{req.notes}</Text> : null}

                {req.status !== 'CONFIRMED' ? (
                  <Button
                    title="إسناد يدوي لمعلم معتمد"
                    onPress={() => {
                      setSelectedTutorId(tutors[0]?.id ?? 'tut-1');
                      setAssigningReq(req);
                    }}
                    icon="person-add-outline"
                    size="sm"
                    fullWidth
                  />
                ) : null}
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Manual Tutor Assignment Modal */}
      <Modal
        visible={Boolean(assigningReq)}
        transparent
        animationType="slide"
        onRequestClose={() => setAssigningReq(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={typography.h3}>
                إسناد معلم لطلب {assigningReq?.subject}
              </Text>
              <Pressable onPress={() => setAssigningReq(null)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.metaText}>
              الطالب: {assigningReq?.studentName} • {assigningReq?.preferredDate} ({assigningReq?.preferredTime})
            </Text>

            <View style={styles.stack}>
              {tutors.map((t) => {
                const active = selectedTutorId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTutorId(t.id)}
                    style={[styles.tutorOpt, active && styles.tutorOptActive]}
                  >
                    <View style={styles.flex1}>
                      <Text style={styles.tutorOptName}>{t.fullName}</Text>
                      <Text style={styles.metaText}>
                        {t.subjects.join(' • ')} • ★ {t.rating}
                      </Text>
                    </View>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Button
              title="تأكيد الإسناد وإشعار الأطراف"
              onPress={handleAssign}
              loading={submitting}
              icon="checkmark-done-outline"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </Modal>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex1: { flex: 1 },
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
  kpiRow: { flexDirection: 'row', gap: spacing.md },
  kpiBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  kpiVal: { fontSize: 24, fontWeight: '800' },
  kpiLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
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
  reqCard: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  metaText: { fontSize: 12, color: colors.textSecondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  notesText: {
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  tutorOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  tutorOptActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoftTeal,
  },
  tutorOptName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
});
