import React, { useState } from 'react';
import {
  Alert,
  Linking,
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
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { TrainerCohort } from '@/types';

export default function TrainerCoursesScreen() {
  const router = useRouter();
  const { user, trainerCohorts, trainerRecords, logout } = useAuth();
  const [selectedCohort, setSelectedCohort] = useState<TrainerCohort | null>(null);

  const handleOpenClassroom = async (cohort: TrainerCohort) => {
    try {
      const can = await Linking.canOpenURL(cohort.classroomUrl);
      if (can) {
        await Linking.openURL(cohort.classroomUrl);
      } else {
        setSelectedCohort(cohort);
      }
    } catch {
      Alert.alert('قاعة التدريب', cohort.classroomUrl);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding');
  };

  const totalTrainees = trainerCohorts.reduce((acc, c) => acc + c.traineesCount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.subTitle}>تطبيق المدرب المهني</Text>
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

        {/* Trainer Hero Summary */}
        <View style={styles.heroCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.heroLabel}>البرامج المسندة إليك</Text>
            <Badge label="مدرب معتمد" tone="amber" />
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{trainerCohorts.length}</Text>
              <Text style={styles.heroStatLabel}>دفعات نشطة</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{totalTrainees}</Text>
              <Text style={styles.heroStatLabel}>متدرب مسجل</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{trainerRecords.length}</Text>
              <Text style={styles.heroStatLabel}>تقييمات نشطة</Text>
            </View>
          </View>
        </View>

        {/* Assigned Cohorts & Schedule */}
        <View>
          <SectionHeader
            title="الدورات والدفعات وجدول الجلسات"
            subtitle="اضغط لبدء القاعة الافتراضية أو الانتقال لرصد الحضور"
          />
          <View style={styles.stack}>
            {trainerCohorts.map((cohort) => (
              <Card key={cohort.id} style={styles.cohortCard}>
                <View style={styles.rowBetween}>
                  <Badge
                    label={
                      cohort.mode === 'LIVE_ONLINE'
                        ? 'أونلاين مباشر'
                        : cohort.mode === 'IN_PERSON'
                        ? 'حضوري'
                        : 'مسجل'
                    }
                    tone={cohort.mode === 'LIVE_ONLINE' ? 'sky' : 'amber'}
                  />
                  <Badge label={`${cohort.traineesCount} متدرب`} tone="teal" />
                </View>

                <Text style={typography.h3}>{cohort.courseTitle}</Text>
                <Text style={styles.cohortName}>{cohort.cohortName}</Text>

                <View style={styles.scheduleBox}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.scheduleText}>الجلسة القادمة: {cohort.nextSessionLabel}</Text>
                </View>

                <View style={styles.progressWrap}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.metaText}>نسبة إنجاز المنهج</Text>
                    <Text style={styles.pctText}>{cohort.completionPct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${cohort.completionPct}%` }]}
                    />
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Button
                    title="دخول القاعة"
                    onPress={() => setSelectedCohort(cohort)}
                    icon="videocam-outline"
                    size="sm"
                    style={styles.flex1}
                  />
                  <Button
                    title="الحضور والتقييم"
                    onPress={() => router.push('/(trainer)/attendance')}
                    variant="outline"
                    icon="clipboard-outline"
                    size="sm"
                    style={styles.flex1}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Join Classroom Modal */}
      <Modal
        visible={Boolean(selectedCohort)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCohort(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedCohort ? (
            <Card style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <Ionicons name="videocam" size={30} color={colors.textOnPrimary} />
              </View>
              <Text style={[typography.h2, { textAlign: 'center' }]}>
                بدء الجلسة التدريبية
              </Text>
              <Text style={styles.modalDesc}>
                {selectedCohort.courseTitle} — {selectedCohort.cohortName}
              </Text>
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {selectedCohort.classroomUrl}
                </Text>
              </View>
              <Button
                title="فتح رابط القاعة الآن"
                onPress={() => {
                  const target = selectedCohort;
                  setSelectedCohort(null);
                  void handleOpenClassroom(target);
                }}
                icon="open-outline"
                fullWidth
              />
              <Button
                title="إغلاق"
                onPress={() => setSelectedCohort(null)}
                variant="outline"
                fullWidth
              />
            </Card>
          ) : null}
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
  flex1: { flex: 1 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.elevated,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  heroLabel: { fontSize: 14, color: colors.primaryLight, fontWeight: '700' },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroStatVal: { fontSize: 20, fontWeight: '800', color: colors.textOnPrimary },
  heroStatLabel: { fontSize: 11, color: colors.primaryLight },
  stack: { gap: spacing.md },
  cohortCard: { gap: spacing.sm },
  cohortName: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSoftTeal,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  scheduleText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  progressWrap: { gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  pctText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  progressTrack: {
    height: 7,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: { width: '100%', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  linkBox: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkText: { fontSize: 12, color: colors.accentDark, textAlign: 'center' },
});
