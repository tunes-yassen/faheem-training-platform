import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function TutorReportsEarningsScreen() {
  const {
    tutorEarnings,
    tutorConfirmedSessions,
    tutorReports,
    submitSessionReport,
  } = useAuth();

  const [selectedSessionId, setSelectedSessionId] = useState(
    tutorConfirmedSessions[0]?.id ?? 'sess-101'
  );
  const [attendance, setAttendance] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [rating, setRating] = useState(5);
  const [topicsCovered, setTopicsCovered] = useState('');
  const [homework, setHomework] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedSession =
    tutorConfirmedSessions.find((s) => s.id === selectedSessionId) ??
    tutorConfirmedSessions[0];

  const handleSubmitReport = async () => {
    if (!topicsCovered.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة المواضيع التي تم شرحها في الحصة.');
      return;
    }
    setSubmitting(true);
    try {
      await submitSessionReport({
        sessionId: selectedSession?.id ?? 'sess-101',
        studentName: selectedSession?.studentName ?? 'عبدالله العتيبي',
        subject: selectedSession?.subject ?? 'الرياضيات',
        attendance,
        rating,
        topicsCovered: topicsCovered.trim(),
        homework: homework.trim() || 'لا يوجد واجب إضافي',
      });
      setTopicsCovered('');
      setHomework('');
      Alert.alert(
        'تم اعتماد التقرير',
        'تم إرسال تقرير الحصة للطالب وولي الأمر وإضافة مستحقات الحصة إلى رصيد التسوية.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>التقارير والأرباح</Text>
          <Text style={styles.headerSub}>
            ملخص المستحقات المالية ورفع تقارير الجلسات بعد الانتهاء
          </Text>
        </View>

        {/* Earnings Hero Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsTop}>
            <Text style={styles.earningsLabel}>الرصيد المستحق للتسوية</Text>
            <Badge label="تسوية نصف شهرية" tone="amber" />
          </View>
          <Text style={styles.earningsValue}>
            {tutorEarnings.pendingSettlementSar.toLocaleString()} ر.س
          </Text>
          <View style={styles.earningsStats}>
            <View style={styles.eStatBox}>
              <Text style={styles.eStatLabel}>أرباح هذا الشهر</Text>
              <Text style={styles.eStatVal}>
                {tutorEarnings.monthlyEarnedSar.toLocaleString()} ر.س
              </Text>
            </View>
            <View style={styles.eDivider} />
            <View style={styles.eStatBox}>
              <Text style={styles.eStatLabel}>الجلسات المكتملة</Text>
              <Text style={styles.eStatVal}>{tutorEarnings.completedSessionsCount} حصة</Text>
            </View>
          </View>
        </View>

        {/* Submit Session Report Form */}
        <Card style={styles.formCard}>
          <SectionHeader
            title="رفع تقرير حصة مكتملة"
            subtitle="يصل التقرير فوراً لولي الأمر والطالب ويُفعّل مستحقات المعلم"
          />

          <Text style={styles.fieldLabel}>اختر الجلسة</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {tutorConfirmedSessions.map((sess) => {
              const active = sess.id === selectedSession?.id;
              return (
                <Pressable
                  key={sess.id}
                  onPress={() => setSelectedSessionId(sess.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {sess.subject} — {sess.studentName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>حالة الحضور</Text>
          <View style={styles.attRow}>
            {[
              { key: 'PRESENT' as const, label: 'حاضر' },
              { key: 'LATE' as const, label: 'متأخر' },
              { key: 'ABSENT' as const, label: 'غائب' },
            ].map((item) => {
              const active = attendance === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setAttendance(item.key)}
                  style={[styles.attBtn, active && styles.attBtnActive]}
                >
                  <Text style={[styles.attText, active && styles.attTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>تقييم تفاعل الطالب ({rating} / 5)</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={28}
                  color={colors.highlight}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>المواضيع التي تم تغطيتها</Text>
          <TextInput
            value={topicsCovered}
            onChangeText={setTopicsCovered}
            placeholder="مثال: شرح التكامل بالتعويض وحل 6 مسائل تدريبية..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, styles.textArea]}
            textAlign="right"
          />

          <Text style={styles.fieldLabel}>الواجب أو التوصيات (اختياري)</Text>
          <TextInput
            value={homework}
            onChangeText={setHomework}
            placeholder="مثال: مراجعة ورقة العمل وحل التمارين 1-5"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            textAlign="right"
          />

          <Button
            title="إرسال التقرير وتوثيق الحصة"
            onPress={handleSubmitReport}
            loading={submitting}
            icon="document-text-outline"
            size="lg"
            fullWidth
          />
        </Card>

        {/* Recent Settlements */}
        <View>
          <SectionHeader title="سجل التسويات المالية" />
          <View style={styles.stack}>
            {tutorEarnings.recentSettlements.map((s) => (
              <Card key={s.id} style={styles.settlementCard}>
                <View style={styles.setRow}>
                  <View style={styles.setInfo}>
                    <Text style={styles.setPeriod}>{s.period}</Text>
                    <Text style={styles.setMeta}>{s.sessionsCount} حصة مكتملة</Text>
                  </View>
                  <View style={styles.setRight}>
                    <Text style={styles.setAmount}>{s.amountSar.toLocaleString()} ر.س</Text>
                    <Badge
                      label={s.status === 'PAID' ? 'تم التحويل' : 'قيد التسوية'}
                      tone={s.status === 'PAID' ? 'success' : 'amber'}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Submitted Reports */}
        <View>
          <SectionHeader title="التقارير المرسلة مؤخراً" />
          <View style={styles.stack}>
            {tutorReports.map((rep) => (
              <Card key={rep.id} style={styles.reportCard}>
                <View style={styles.setRow}>
                  <Text style={typography.h3}>
                    {rep.subject} • {rep.studentName}
                  </Text>
                  <Badge label={`${rep.rating} ★`} tone="amber" />
                </View>
                <Text style={styles.reportText}>{rep.topicsCovered}</Text>
                <Text style={styles.reportMeta}>
                  الواجب: {rep.homework} • {rep.submittedAt}
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
  header: { gap: 4 },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  earningsCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.elevated,
  },
  earningsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel: { fontSize: 14, color: colors.primaryLight, fontWeight: '600' },
  earningsValue: { fontSize: 32, fontWeight: '800', color: colors.textOnPrimary },
  earningsStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  eStatBox: { flex: 1, gap: 2 },
  eDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: spacing.md },
  eStatLabel: { fontSize: 11, color: colors.primaryLight },
  eStatVal: { fontSize: 15, fontWeight: '800', color: colors.textOnPrimary },
  formCard: { gap: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  chipRow: { gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  chipTextActive: { color: colors.textOnPrimary },
  attRow: { flexDirection: 'row', gap: spacing.sm },
  attBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  attBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  attText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  attTextActive: { color: colors.textOnPrimary },
  starsRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: { height: 84, textAlignVertical: 'top' },
  stack: { gap: spacing.sm },
  settlementCard: { padding: spacing.md },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  setInfo: { flex: 1, gap: 2 },
  setPeriod: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  setMeta: { fontSize: 12, color: colors.textSecondary },
  setRight: { alignItems: 'flex-end', gap: 4 },
  setAmount: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  reportCard: { gap: 6, padding: spacing.md },
  reportText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  reportMeta: { fontSize: 11, color: colors.textMuted },
});
