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
import { Badge, BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, spacing, typography } from '@/theme';
import { ConversationThread, ConversationType } from '@/types';

type SubTab = 'TICKETS' | 'CONVERSATIONS';

const CONV_META: Record<ConversationType, { label: string; tone: BadgeTone }> = {
  CHAT: { label: 'محادثة', tone: 'sky' },
  CALL_LOG: { label: 'مكالمة', tone: 'teal' },
  COORDINATOR_NOTE: { label: 'ملاحظة منسق', tone: 'amber' },
};

export default function CoordinatorTicketsScreen() {
  const {
    tickets,
    conversations,
    updateTicketStatus,
    addConversationMessage,
  } = useAuth();

  const [tab, setTab] = useState<SubTab>('TICKETS');
  const [activeConv, setActiveConv] = useState<ConversationThread | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async () => {
    if (!activeConv || !replyText.trim()) return;
    await addConversationMessage(activeConv.id, replyText, activeConv.type);
    setReplyText('');
    setActiveConv(null);
    Alert.alert('تم الحفظ', 'تم توثيق الرسالة / ملاحظة المكالمة في سجل المحادثة.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>التذاكر والمحادثات</Text>
          <Text style={styles.headerSub}>
            مراقبة التزام SLA لتذاكر الدعم + سجل المحادثات والمكالمات الموحد
          </Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setTab('TICKETS')}
            style={[styles.segBtn, tab === 'TICKETS' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'TICKETS' && styles.segTextActive]}>
              تذاكر الدعم ({tickets.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('CONVERSATIONS')}
            style={[styles.segBtn, tab === 'CONVERSATIONS' && styles.segBtnActive]}
          >
            <Text style={[styles.segText, tab === 'CONVERSATIONS' && styles.segTextActive]}>
              المحادثات والمكالمات ({conversations.length})
            </Text>
          </Pressable>
        </View>

        {tab === 'TICKETS' ? (
          <View style={styles.stack}>
            <SectionHeader
              title="مراقب التذاكر و SLA"
              subtitle="تحديث حالة التذكرة فور المعالجة"
            />
            {tickets.map((t) => (
              <Card key={t.id} style={styles.itemCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.ticketNum}>{t.ticketNumber}</Text>
                  <Badge
                    label={
                      t.status === 'RESOLVED'
                        ? 'تم الحل'
                        : t.status === 'IN_PROGRESS'
                        ? 'قيد المعالجة'
                        : 'مفتوحة'
                    }
                    tone={
                      t.status === 'RESOLVED'
                        ? 'success'
                        : t.status === 'IN_PROGRESS'
                        ? 'sky'
                        : 'amber'
                    }
                  />
                </View>

                <Text style={typography.h3}>{t.subject}</Text>
                <Text style={styles.metaText}>
                  {t.requesterName ? `${t.requesterName} • ` : ''}
                  {t.category} • {t.slaLabel}
                </Text>

                {t.status !== 'RESOLVED' ? (
                  <View style={styles.actionsRow}>
                    {t.status === 'OPEN' ? (
                      <Button
                        title="بدء المعالجة"
                        onPress={() => void updateTicketStatus(t.id, 'IN_PROGRESS')}
                        variant="accent"
                        size="sm"
                        style={styles.flex1}
                      />
                    ) : null}
                    <Button
                      title="إغلاق كمحلولة"
                      onPress={() => void updateTicketStatus(t.id, 'RESOLVED')}
                      icon="checkmark-circle-outline"
                      size="sm"
                      style={styles.flex1}
                    />
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.stack}>
            <SectionHeader
              title="سجل المحادثات والمكالمات"
              subtitle="اضغط على أي سجل لإضافة رد أو ملاحظة متابعة"
            />
            {conversations.map((conv) => {
              const meta = CONV_META[conv.type];
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <Card key={conv.id} style={styles.itemCard}>
                  <View style={styles.rowBetween}>
                    <Badge label={meta.label} tone={meta.tone} />
                    <Text style={styles.metaText}>{conv.updatedAt}</Text>
                  </View>
                  <Text style={typography.h3}>{conv.title}</Text>
                  <Text style={styles.metaText}>{conv.participantsLabel}</Text>
                  {lastMsg ? (
                    <View style={styles.msgBox}>
                      <Text style={styles.msgSender}>{lastMsg.senderName}:</Text>
                      <Text style={styles.msgBody}>{lastMsg.content}</Text>
                    </View>
                  ) : null}
                  <Button
                    title="إضافة رد / توثيق مكالمة"
                    onPress={() => {
                      setReplyText('');
                      setActiveConv(conv);
                    }}
                    variant="outline"
                    icon="chatbox-ellipses-outline"
                    size="sm"
                    fullWidth
                  />
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Reply / Call Note Modal */}
      <Modal
        visible={Boolean(activeConv)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveConv(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={typography.h3}>{activeConv?.title}</Text>
              <Pressable onPress={() => setActiveConv(null)}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="اكتب الرد أو ملخص المكالمة لتوثيقه في السجل..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={styles.replyInput}
              textAlign="right"
            />
            <Button title="حفظ في السجل" onPress={handleSendReply} fullWidth />
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
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.surface },
  segText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  segTextActive: { color: colors.primaryDark },
  stack: { gap: spacing.md },
  itemCard: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ticketNum: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  metaText: { fontSize: 12, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flex1: { flex: 1 },
  msgBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  msgSender: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  msgBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
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
  replyInput: {
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
