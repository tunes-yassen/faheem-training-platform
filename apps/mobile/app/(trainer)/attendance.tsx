import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
import { colors, radius, spacing, typography } from '@/theme';
import { TrainerTraineeRecord } from '@/types';

export default function TrainerAttendanceScreen() {
  const {
    trainerCohorts,
    trainerRecords,
    markTraineeAttendance,
    gradeTraineeAssignment,
  } = useAuth();

  const [selectedCohortId, setSelectedCohortId] = useState(trainerCohorts[0]?.id ?? 'coh-1');
  const [gradingRecord, setGradingRecord] = useState<TrainerTraineeRecord | null>(null);
  const [scoreInput, setScoreInput] = useState('90');
  const [feedbackInput, setFeedbackInput] = useState('');

  const filteredRecords = useMemo(
    () => trainerRecords.filter((r) => r.cohortId === selectedCohortId),
    [trainerRecords, selectedCohortId]
  );

  const openGrading = (rec: TrainerTraineeRecord) => {
    setGradingRecord(rec);
    setScoreInput(String(rec.gradeScore));
    setFeedbackInput(rec.feedback);
  };

  const handleSaveGrade = async () => {
    if (!gradingRecord) return;
    const numeric = Number(scoreInput);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
      Alert.alert('قيمة غير صالحة', 'يرجى إدخال درجة بين 0 و 100.');
      return;
    }
    await gradeTraineeAssignment(gradingRecord.id, numeric, feedbackInput);
    setGradingRecord(null);
    Alert.alert('تم حفظ التقييم', 'تم تحديث درجة الواجب وإشعار المتدرب.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>الحضور وتقييم الواجبات</Text>
          <Text style={styles.headerSub}>
            رصد الحضور الفوري وتقييم تسليمات المتدربين لكل دفعة
          </Text>
        </View>

        {/* Cohort Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cohortRow}
        >
          {trainerCohorts.map((c) => {
            const active = c.id === selectedCohortId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCohortId(c.id)}
                style={[styles.cohortChip, active && styles.cohortChipActive]}
              >
                <Text style={[styles.cohortChipText, active && styles.cohortChipTextActive]}>
                  {c.cohortName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Trainees List */}
        <View>
          <SectionHeader
            title={`المتدربون (${filteredRecords.length})`}
            subtitle="اضغط على حالة الحضور للتحديث الفوري"
          />
          <View style={styles.stack}>
            {filteredRecords.map((rec) => (
              <Card key={rec.id} style={styles.recordCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={typography.h3}>{rec.traineeName}</Text>
                    <Text style={styles.metaText}>{rec.assignmentTitle}</Text>
                  </View>
                  <Badge label={`الدرجة: ${rec.gradeScore}/100`} tone="teal" />
                </View>

                {/* Attendance Toggle Buttons */}
                <View style={styles.attRow}>
                  {[
                    { key: 'PRESENT' as const, label: 'حاضر' },
                    { key: 'LATE' as const, label: 'متأخر' },
                    { key: 'ABSENT' as const, label: 'غائب' },
                  ].map((opt) => {
                    const active = rec.attendance === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => void markTraineeAttendance(rec.id, opt.key)}
                        style={[
                          styles.attBtn,
                          active &&
                            (opt.key === 'ABSENT'
                              ? styles.attBtnDanger
                              : opt.key === 'LATE'
                              ? styles.attBtnAmber
                              : styles.attBtnActive),
                        ]}
                      >
                        <Text style={[styles.attText, active && { color: colors.textOnPrimary }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.feedbackText}>ملاحظة المدرب: {rec.feedback}</Text>

                <Button
                  title="تعديل الدرجة والملاحظة"
                  onPress={() => openGrading(rec)}
                  variant="outline"
                  icon="create-outline"
                  size="sm"
                  fullWidth
                />
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Grade Modal */}
      <Modal
        visible={Boolean(gradingRecord)}
        transparent
        animationType="slide"
        onRequestClose={() => setGradingRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={typography.h3}>تقييم {gradingRecord?.traineeName}</Text>
              <Pressable onPress={() => setGradingRecord(null)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.metaText}>{gradingRecord?.assignmentTitle}</Text>

            <Text style={styles.fieldLabel}>الدرجة (من 100)</Text>
            <TextInput
              value={scoreInput}
              onChangeText={setScoreInput}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.input}
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>ملاحظات المدرب للمتدرب</Text>
            <TextInput
              value={feedbackInput}
              onChangeText={setFeedbackInput}
              multiline
              style={[styles.input, { height: 86, textAlignVertical: 'top' }]}
              textAlign="right"
            />

            <Button title="حفظ التقييم" onPress={handleSaveGrade} fullWidth />
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
  header: { gap: 4 },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  cohortRow: { gap: spacing.sm },
  cohortChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cohortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cohortChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  cohortChipTextActive: { color: colors.textOnPrimary },
  stack: { gap: spacing.md },
  recordCard: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  attRow: { flexDirection: 'row', gap: spacing.sm },
  attBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  attBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  attBtnAmber: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  attBtnDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  attText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  feedbackText: {
    fontSize: 12,
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
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
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
});
