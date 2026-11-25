import React, { useState } from 'react';
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

type ApprovalTab = 'TUTORS' | 'REFUNDS';

interface DecisionModalState {
  kind: 'TUTOR' | 'REFUND';
  id: string;
  title: string;
  decision: 'APPROVED' | 'REJECTED';
}

export default function AdminApprovalsScreen() {
  const {
    pendingTutorApps,
    pendingRefunds,
    reviewTutorApplication,
    reviewRefundRequest,
  } = useAuth();

  const [tab, setTab] = useState<ApprovalTab>('TUTORS');
  const [decisionModal, setDecisionModal] = useState<DecisionModalState | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openModal = (state: DecisionModalState) => {
    setReasonText('');
    setDecisionModal(state);
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal) return;
    if (!reasonText.trim()) {
      Alert.alert('سبب إلزامي', 'يجب إدخال سبب القرار لتوثيقه في سجل التدقيق (Audit Log).');
      return;
    }
    setSubmitting(true);
    try {
      const res =
        decisionModal.kind === 'TUTOR'
          ? await reviewTutorApplication(decisionModal.id, decisionModal.decision, reasonText)
          : await reviewRefundRequest(decisionModal.id, decisionModal.decision, reasonText);

      if (res.ok) {
        setDecisionModal(null);
      }
      Alert.alert(res.ok ? 'تم التنفيذ' : 'تنبيه', res.message);
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
          <Text style={typography.h1}>مركز الموافقات</Text>
          <Text style={styles.headerSub}>
            اعتماد المعلمين + موافقات الاسترداد المالي وفق ضوابط Maker-Checker
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segment}>
          <Pressable
            onPress={() => setTab('TUTORS')}
            style={[styles.segBtn, tab === 'TUTORS' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'TUTORS' && styles.segTextActive]}>
              اعتماد المعلمين ({pendingTutorApps.filter((a) => a.status === 'PENDING').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('REFUNDS')}
            style={[styles.segBtn, tab === 'REFUNDS' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'REFUNDS' && styles.segTextActive]}>
              الاسترداد المالي ({pendingRefunds.filter((r) => r.status === 'PENDING').length})
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: PENDING TUTOR APPROVALS */}
        {tab === 'TUTORS' ? (
          <View style={styles.stack}>
            <SectionHeader
              title="طلبات اعتماد المعلمين"
              subtitle="كل قرار (قبول أو رفض) يتطلب سبباً موثقاً في سجل التدقيق"
            />
            {pendingTutorApps.map((app) => (
              <Card key={app.id} style={styles.itemCard}>
                <View style={styles.topRow}>
                  <View style={styles.infoCol}>
                    <Text style={typography.h3}>{app.fullName}</Text>
                    <Text style={styles.metaText}>{app.email}</Text>
                  </View>
                  <Badge
                    label={
                      app.status === 'PENDING'
                        ? 'بانتظار المراجعة'
                        : app.status === 'APPROVED'
                        ? 'معتمد ✓'
                        : 'مرفوض'
                    }
                    tone={
                      app.status === 'PENDING'
                        ? 'amber'
                        : app.status === 'APPROVED'
                        ? 'success'
                        : 'danger'
                    }
                  />
                </View>

                <Text style={styles.detailText}>{app.qualification}</Text>
                <Text style={styles.metaText}>
                  خبرة {app.experienceYears} سنوات • التقديم: {app.submittedAt}
                </Text>

                <View style={styles.chipsRow}>
                  {app.specialties.map((sp) => (
                    <Badge key={sp} label={sp} tone="teal" />
                  ))}
                </View>

                {app.decisionReason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonText}>سبب القرار: {app.decisionReason}</Text>
                  </View>
                ) : null}

                {app.status === 'PENDING' ? (
                  <View style={styles.actionsRow}>
                    <Button
                      title="اعتماد المعلم"
                      onPress={() =>
                        openModal({
                          kind: 'TUTOR',
                          id: app.id,
                          title: `اعتماد ${app.fullName}`,
                          decision: 'APPROVED',
                        })
                      }
                      icon="checkmark-circle-outline"
                      size="sm"
                      style={styles.flexBtn}
                    />
                    <Button
                      title="رفض الطلب"
                      onPress={() =>
                        openModal({
                          kind: 'TUTOR',
                          id: app.id,
                          title: `رفض ${app.fullName}`,
                          decision: 'REJECTED',
                        })
                      }
                      variant="danger"
                      icon="close-circle-outline"
                      size="sm"
                      style={styles.flexBtn}
                    />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}

        {/* TAB 2: MAKER-CHECKER REFUNDS */}
        {tab === 'REFUNDS' ? (
          <View style={styles.stack}>
            <SectionHeader
              title="موافقات الاسترداد (Maker-Checker)"
              subtitle="يُمنع اعتماد المنشئ لطلبه، ويُتحقق من سقف المبلغ المحصّل"
            />
            {pendingRefunds.map((ref) => (
              <Card key={ref.id} style={styles.itemCard}>
                <View style={styles.topRow}>
                  <View style={styles.infoCol}>
                    <Text style={typography.h3}>
                      {ref.reference} • {ref.studentName}
                    </Text>
                    <Text style={styles.metaText}>المنشئ: {ref.makerName}</Text>
                  </View>
                  <Badge
                    label={
                      ref.status === 'PENDING'
                        ? 'بانتظار Checker'
                        : ref.status === 'APPROVED'
                        ? 'تم الاعتماد ✓'
                        : 'مرفوض'
                    }
                    tone={
                      ref.status === 'PENDING'
                        ? 'amber'
                        : ref.status === 'APPROVED'
                        ? 'success'
                        : 'danger'
                    }
                  />
                </View>

                <View style={styles.amountStrip}>
                  <View>
                    <Text style={styles.amountLabel}>مبلغ الاسترداد</Text>
                    <Text style={styles.amountVal}>{ref.amountSar} ر.س</Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>صافي المحصّل (السقف)</Text>
                    <Text style={styles.capVal}>{ref.netCapturedSar} ر.س</Text>
                  </View>
                </View>

                <Text style={styles.detailText}>{ref.reason}</Text>

                {ref.checkerNote ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonText}>ملاحظة المعتمد: {ref.checkerNote}</Text>
                  </View>
                ) : null}

                {ref.status === 'PENDING' ? (
                  <View style={styles.actionsRow}>
                    <Button
                      title="اعتماد الاسترداد"
                      onPress={() =>
                        openModal({
                          kind: 'REFUND',
                          id: ref.id,
                          title: `اعتماد استرداد ${ref.reference} (${ref.amountSar} ر.س)`,
                          decision: 'APPROVED',
                        })
                      }
                      icon="shield-checkmark-outline"
                      size="sm"
                      style={styles.flexBtn}
                    />
                    <Button
                      title="رفض"
                      onPress={() =>
                        openModal({
                          kind: 'REFUND',
                          id: ref.id,
                          title: `رفض استرداد ${ref.reference}`,
                          decision: 'REJECTED',
                        })
                      }
                      variant="danger"
                      size="sm"
                      style={styles.flexBtn}
                    />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Required Reason Decision Modal */}
      <Modal
        visible={Boolean(decisionModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setDecisionModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>{decisionModal?.title}</Text>
              <Pressable onPress={() => setDecisionModal(null)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalLabel}>سبب القرار / ملاحظة التدقيق (إلزامي):</Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="اكتب مبرر الاعتماد أو الرفض للتوثيق في Audit Log..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.reasonInput}
              textAlign="right"
            />
            <Button
              title={
                decisionModal?.decision === 'APPROVED' ? 'تأكيد الاعتماد' : 'تأكيد الرفض'
              }
              onPress={handleConfirmDecision}
              variant={decisionModal?.decision === 'APPROVED' ? 'primary' : 'danger'}
              loading={submitting}
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
  header: { gap: 4 },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: colors.surface },
  segText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  segTextActive: { color: colors.primaryDark },
  stack: { gap: spacing.md },
  itemCard: { gap: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  infoCol: { flex: 1, gap: 2 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  detailText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoftTeal,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  amountLabel: { fontSize: 11, color: colors.textSecondary },
  amountVal: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  capVal: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  reasonBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  reasonText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flexBtn: { flex: 1 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reasonInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    height: 96,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
});
