import React, { useMemo, useState } from 'react';
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
import { Badge, BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, spacing, typography } from '@/theme';
import { ConversationType } from '@/types';

type OversightTab = 'STAFF' | 'CONVERSATIONS' | 'GUARDIANS';

const CONV_META: Record<ConversationType, { label: string; tone: BadgeTone }> = {
  CHAT: { label: 'محادثة', tone: 'sky' },
  CALL_LOG: { label: 'سجل مكالمة', tone: 'teal' },
  COORDINATOR_NOTE: { label: 'ملاحظة منسق', tone: 'amber' },
};

export default function AdminOversightScreen() {
  const {
    staffDailyReport,
    conversations,
    guardianLinks,
    updateGuardianLinkStatus,
  } = useAuth();

  const [tab, setTab] = useState<OversightTab>('STAFF');
  const [search, setSearch] = useState('');
  const [convType, setConvType] = useState<'ALL' | ConversationType>('ALL');

  const filteredConvs = useMemo(() => {
    return conversations.filter((c) => {
      const typeOk = convType === 'ALL' || c.type === convType;
      const q = search.trim();
      const textOk = !q || c.title.includes(q) || c.participantsLabel.includes(q);
      return typeOk && textOk;
    });
  }, [conversations, convType, search]);

  const handleGuardianAction = async (
    id: string,
    status: 'VERIFIED' | 'REVOKED',
    guardianName: string
  ) => {
    await updateGuardianLinkStatus(
      id,
      status,
      status === 'REVOKED' ? 'إلغاء إداري لحوكمة الربط' : undefined
    );
    Alert.alert(
      'تم التحديث',
      status === 'VERIFIED'
        ? `تم توثيق ربط ولي الأمر (${guardianName}) بنجاح.`
        : `تم إلغاء ربط ولي الأمر (${guardianName}) وتوثيقه في سجل التدقيق.`
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>الرقابة والتقارير</Text>
          <Text style={styles.headerSub}>
            أداء الموظفين اليومي • المحادثات والمكالمات • حوكمة أولياء الأمور
          </Text>
        </View>

        {/* Sub-tabs */}
        <View style={styles.segment}>
          {[
            { key: 'STAFF' as const, label: 'تقرير الموظفين' },
            { key: 'CONVERSATIONS' as const, label: 'المحادثات' },
            { key: 'GUARDIANS' as const, label: 'أولياء الأمور' },
          ].map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.segBtn, active && styles.segBtnActive]}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TAB 1: STAFF DAILY REPORT */}
        {tab === 'STAFF' ? (
          <View style={styles.stack}>
            <SectionHeader
              title="التقرير اليومي لأداء الموظفين"
              subtitle="ملخص المكالمات، التذاكر المغلقة، الالتزام بـ SLA، وإجراءات التدقيق"
            />
            {staffDailyReport.map((row) => (
              <Card key={row.staffId} style={styles.cardGap}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={typography.h3}>{row.fullName}</Text>
                    <Text style={styles.metaText}>
                      {row.department} • {row.roleCode}
                    </Text>
                  </View>
                  <Badge
                    label={`SLA ${row.slaCompliancePct}%`}
                    tone={row.slaCompliancePct >= 95 ? 'success' : 'amber'}
                  />
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{row.callsHandled}</Text>
                    <Text style={styles.metricLabel}>مكالمة</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{row.ticketsClosed}</Text>
                    <Text style={styles.metricLabel}>تذكرة مغلقة</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{row.requestsAssigned}</Text>
                    <Text style={styles.metricLabel}>إسناد</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{row.dailyAuditActions}</Text>
                    <Text style={styles.metricLabel}>تدقيق</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* TAB 2: CONVERSATIONS & CALL LOGS */}
        {tab === 'CONVERSATIONS' ? (
          <View style={styles.stack}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="بحث في المحادثات والمكالمات..."
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                textAlign="right"
              />
            </View>

            <View style={styles.filterRow}>
              {[
                { key: 'ALL' as const, label: 'الكل' },
                { key: 'CALL_LOG' as const, label: 'مكالمات' },
                { key: 'CHAT' as const, label: 'محادثات' },
                { key: 'COORDINATOR_NOTE' as const, label: 'ملاحظات' },
              ].map((f) => {
                const active = convType === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setConvType(f.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredConvs.map((conv) => {
              const meta = CONV_META[conv.type];
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <Card key={conv.id} style={styles.cardGap}>
                  <View style={styles.rowBetween}>
                    <Badge label={meta.label} tone={meta.tone} />
                    <Text style={styles.metaText}>{conv.updatedAt}</Text>
                  </View>
                  <Text style={typography.h3}>{conv.title}</Text>
                  <Text style={styles.metaText}>{conv.participantsLabel}</Text>
                  {lastMsg ? (
                    <View style={styles.msgPreview}>
                      <Text style={styles.msgSender}>{lastMsg.senderName}:</Text>
                      <Text style={styles.msgBody}>{lastMsg.content}</Text>
                      {lastMsg.durationSeconds ? (
                        <Text style={styles.msgDuration}>
                          مدة المكالمة: {Math.floor(lastMsg.durationSeconds / 60)} د{' '}
                          {lastMsg.durationSeconds % 60} ث
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : null}

        {/* TAB 3: GUARDIAN LINK VERIFICATION */}
        {tab === 'GUARDIANS' ? (
          <View style={styles.stack}>
            <SectionHeader
              title="توثيق روابط أولياء الأمور"
              subtitle="التحقق من الموافقة والحد الشهري للأبناء"
            />
            {guardianLinks.map((gl) => (
              <Card key={gl.id} style={styles.cardGap}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex1}>
                    <Text style={typography.h3}>{gl.guardianName}</Text>
                    <Text style={styles.metaText}>{gl.guardianPhone}</Text>
                  </View>
                  <Badge
                    label={
                      gl.status === 'VERIFIED'
                        ? 'موثق ✓'
                        : gl.status === 'PENDING'
                        ? 'بانتظار التوثيق'
                        : 'ملغي'
                    }
                    tone={
                      gl.status === 'VERIFIED'
                        ? 'success'
                        : gl.status === 'PENDING'
                        ? 'amber'
                        : 'danger'
                    }
                  />
                </View>

                <Text style={styles.detailText}>
                  الطالب المرتبط: {gl.studentName} ({gl.grade})
                </Text>
                <Text style={styles.metaText}>
                  سقف الميزانية الشهرية: {gl.monthlyBudgetLimitSar} ر.س • آخر تحديث: {gl.updatedAt}
                </Text>

                <View style={styles.actionsRow}>
                  {gl.status !== 'VERIFIED' ? (
                    <Button
                      title="توثيق الربط"
                      onPress={() => void handleGuardianAction(gl.id, 'VERIFIED', gl.guardianName)}
                      icon="checkmark-circle-outline"
                      size="sm"
                      style={styles.flex1}
                    />
                  ) : null}
                  {gl.status !== 'REVOKED' ? (
                    <Button
                      title="إلغاء الربط"
                      onPress={() => void handleGuardianAction(gl.id, 'REVOKED', gl.guardianName)}
                      variant="outline"
                      size="sm"
                      style={styles.flex1}
                    />
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}
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
  cardGap: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  detailText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  metricsGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  metricVal: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  metricLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary },
  msgPreview: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  msgSender: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  msgBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  msgDuration: { fontSize: 11, fontWeight: '700', color: colors.accentDark, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
