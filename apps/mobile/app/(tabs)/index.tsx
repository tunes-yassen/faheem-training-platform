import React, { useMemo, useState } from 'react';
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

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    role,
    childrenList,
    selectedChild,
    selectedChildId,
    selectChild,
    upcomingSessions,
    wallet,
    enrollments,
    lessonRequests,
    notifications,
  } = useAuth();

  const [classroomModalOpen, setClassroomModalOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const nextSession = useMemo(() => {
    if (role === 'PARENT' && selectedChild) {
      return (
        upcomingSessions.find((s) => s.studentId === selectedChild.id) ??
        upcomingSessions[0] ??
        null
      );
    }
    return upcomingSessions[0] ?? null;
  }, [role, selectedChild, upcomingSessions]);

  const handleOpenClassroomLink = async () => {
    if (!nextSession) return;
    try {
      const supported = await Linking.canOpenURL(nextSession.classroomUrl);
      if (supported) {
        await Linking.openURL(nextSession.classroomUrl);
      } else {
        setClassroomModalOpen(true);
      }
    } catch {
      Alert.alert('الفصل الافتراضي', `رابط الحصة: ${nextSession.classroomUrl}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting & Wallet Pill */}
        <View style={styles.headerRow}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingSub}>
              {role === 'PARENT' ? 'مرحباً بولي الأمر،' : 'أهلاً بك،'}
            </Text>
            <Text style={typography.h2} numberOfLines={1}>
              {user?.fullName ?? 'متدرب فهيم'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(tabs)/wallet')}
              style={styles.walletPill}
            >
              <Ionicons name="wallet" size={16} color={colors.primaryDark} />
              <Text style={styles.walletPillText}>{wallet.availableSar} ر.س</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.notifBtn}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
            </Pressable>
          </View>
        </View>

        {/* Demo Role Switcher Bar */}
        <View style={styles.roleBar}>
          <Text style={styles.roleBarLabel}>تبديل الدور:</Text>
          <View style={{ flex: 1 }}>
            <RoleSwitcherPill />
          </View>
        </View>

        {/* Parent Child-Switcher Pill */}
        {role === 'PARENT' ? (
          <View style={styles.childSection}>
            <Text style={styles.childSectionLabel}>متابعة الابن / الابنة:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childPillsRow}
            >
              {childrenList.map((child) => {
                const active = child.id === selectedChildId;
                return (
                  <Pressable
                    key={child.id}
                    onPress={() => selectChild(child.id)}
                    style={[styles.childPill, active && styles.childPillActive]}
                  >
                    <View
                      style={[
                        styles.childAvatar,
                        active && { backgroundColor: colors.textOnPrimary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.childAvatarText,
                          active && { color: colors.primary },
                        ]}
                      >
                        {child.avatarInitials}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.childName,
                          active && { color: colors.textOnPrimary },
                        ]}
                      >
                        {child.fullName}
                      </Text>
                      <Text
                        style={[
                          styles.childGrade,
                          active && { color: colors.primaryLight },
                        ]}
                      >
                        {child.grade}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Next Upcoming Session Hero Card */}
        {nextSession ? (
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Badge label={nextSession.countdownLabel} tone="amber" />
              <View style={styles.platformBadge}>
                <Ionicons name="videocam" size={14} color={colors.textOnPrimary} />
                <Text style={styles.platformText}>{nextSession.platform}</Text>
              </View>
            </View>

            <Text style={styles.heroSubject}>{nextSession.subject}</Text>
            <Text style={styles.heroTopic}>{nextSession.topic}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="person-circle-outline" size={16} color={colors.primaryLight} />
                <Text style={styles.heroMetaText}>{nextSession.tutorName}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="time-outline" size={16} color={colors.primaryLight} />
                <Text style={styles.heroMetaText}>{nextSession.startsAtLabel}</Text>
              </View>
            </View>

            {role === 'PARENT' ? (
              <Text style={styles.heroStudentTag}>
                الطالب: {nextSession.studentName} • مدة الحصة {nextSession.durationMinutes} دقيقة
              </Text>
            ) : null}

            <Pressable
              onPress={() => setClassroomModalOpen(true)}
              style={({ pressed }) => [
                styles.joinButton,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons name="enter-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.joinButtonText}>دخول الفصل الافتراضي بضغطة زر</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View>
          <SectionHeader title="إجراءات سريعة" />
          <View style={styles.quickGrid}>
            <Pressable
              onPress={() => router.push('/(tabs)/tutoring')}
              style={[styles.quickCard, { backgroundColor: colors.surfaceSoftTeal, borderColor: colors.primaryLight }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="calendar" size={22} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.quickTitle}>حجز درس تقوية</Text>
              <Text style={styles.quickSub}>مباشر أو مطابقة ذكية</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/courses')}
              style={[styles.quickCard, { backgroundColor: colors.surfaceSoftSky, borderColor: colors.accentLight }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="book" size={22} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.quickTitle}>تصفح الدورات</Text>
              <Text style={styles.quickSub}>حضوري • أونلاين • مسجل</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/wallet')}
              style={[styles.quickCard, { backgroundColor: colors.surfaceSoftAmber, borderColor: colors.highlightLight }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.highlight }]}>
                <Ionicons name="card" size={22} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.quickTitle}>شحن المحفظة</Text>
              <Text style={styles.quickSub}>الرصيد {wallet.availableSar} ر.س</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.indigo }]}>
                <Ionicons name="ribbon" size={22} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.quickTitle}>شهاداتي المعتمدة</Text>
              <Text style={styles.quickSub}>عرض رمز QR والتحقق</Text>
            </Pressable>
          </View>
        </View>

        {/* Active Learning Summary */}
        <View>
          <SectionHeader
            title="متابعة التقدم والطلبات"
            actionLabel="عرض الكل"
            onActionPress={() => router.push('/(tabs)/tutoring')}
          />
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {lessonRequests.length}
              </Text>
              <Text style={styles.statLabel}>طلبات تقوية نشطة</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {enrollments.length}
              </Text>
              <Text style={styles.statLabel}>دورات مسجلة</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.highlightDark }]}>
                {role === 'PARENT' && selectedChild ? `${selectedChild.averageScore}%` : '96%'}
              </Text>
              <Text style={styles.statLabel}>معدل الأداء</Text>
            </Card>
          </View>
        </View>

        {/* Active Course Progress */}
        {enrollments[0] ? (
          <Card>
            <View style={styles.courseRow}>
              <View style={styles.courseInfo}>
                <Badge label="دورة جارية" tone="sky" />
                <Text style={styles.courseTitle}>{enrollments[0].courseTitle}</Text>
                <Text style={styles.courseMeta}>
                  نسبة الإنجاز: {enrollments[0].progressPercent}%
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${enrollments[0].progressPercent}%` },
                ]}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>

      {/* Join Classroom Modal */}
      <Modal
        visible={classroomModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setClassroomModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="videocam" size={32} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.modalTitle}>الفصل الافتراضي جاهز</Text>
            <Text style={styles.modalDesc}>
              {nextSession?.subject} مع {nextSession?.tutorName} عبر {nextSession?.platform}.
            </Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {nextSession?.classroomUrl}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Button
                title="فتح رابط الفصل الآن"
                onPress={() => {
                  setClassroomModalOpen(false);
                  void handleOpenClassroomLink();
                }}
                icon="open-outline"
                fullWidth
              />
              <Button
                title="إغلاق"
                onPress={() => setClassroomModalOpen(false)}
                variant="outline"
                fullWidth
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  walletPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
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
  roleBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  childSection: {
    gap: spacing.sm,
  },
  childSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  childPillsRow: {
    gap: spacing.sm,
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  childPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  childAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  childName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  childGrade: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.elevated,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  heroSubject: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  heroTopic: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '500',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  heroStudentTag: {
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 2,
  },
  joinButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickCard: {
    width: '47.8%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: 6,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  courseRow: {
    marginBottom: spacing.md,
  },
  courseInfo: {
    gap: 6,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  courseMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  modalDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkBox: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkText: {
    fontSize: 12,
    color: colors.accentDark,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
