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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { RoleSwitcherPill } from '@/components/RoleSwitcherPill';
import { QrCodeMatrix } from '@/components/QrCodeMatrix';
import { colors, radius, spacing, typography } from '@/theme';
import { Certificate } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    role,
    certificates,
    childrenList,
    notifications,
    tickets,
    addChild,
    markNotificationRead,
    createSupportTicket,
    logout,
  } = useAuth();

  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('الثاني المتوسط');
  const [childSchool, setChildSchool] = useState('');

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('دروس التقوية');

  const handleAddChild = async () => {
    if (!childName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الابن / الابنة.');
      return;
    }
    await addChild({ fullName: childName, grade: childGrade, school: childSchool });
    setChildName('');
    setChildSchool('');
    setChildModalOpen(false);
    Alert.alert('تم الربط بنجاح', 'تمت إضافة ملف الابن وتفعيل موافقة ولي الأمر.');
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة موضوع تذكرة الدعم.');
      return;
    }
    await createSupportTicket(ticketSubject, ticketCategory);
    setTicketSubject('');
    setTicketModalOpen(false);
    Alert.alert('تم فتح التذكرة', 'سيتواصل معك فريق الدعم ضمن وقت الاستجابة المحدد.');
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
        {/* Profile Header Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.avatarInitials ?? 'ف'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={typography.h2}>{user?.fullName}</Text>
              <Text style={styles.profileMeta}>{user?.email}</Text>
              <Text style={styles.profileMeta}>{user?.phone}</Text>
            </View>
          </View>
          <View style={styles.roleSwitchWrap}>
            <Text style={styles.roleSwitchLabel}>تبديل الدور:</Text>
            <View style={{ flex: 1 }}>
              <RoleSwitcherPill />
            </View>
          </View>
        </Card>

        {/* My Certificates with QR / Serial */}
        <View>
          <SectionHeader
            title="شهاداتي المعتمدة"
            subtitle="اضغط على الشهادة لعرض رمز QR والرقم التسلسلي"
          />
          <View style={styles.stack}>
            {certificates.map((cert) => (
              <Pressable key={cert.id} onPress={() => setSelectedCert(cert)}>
                <Card tone="teal" style={styles.certCard}>
                  <View style={styles.certTop}>
                    <Ionicons name="ribbon" size={24} color={colors.primaryDark} />
                    <View style={styles.certInfo}>
                      <Text style={styles.certTitle}>{cert.courseTitle}</Text>
                      <Text style={styles.certSerial}>الرقم التسلسلي: {cert.serialCode}</Text>
                    </View>
                    <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.certBadges}>
                    <Badge label={cert.gradeLabel} tone="success" />
                    <Badge label={`${cert.hours} ساعة`} tone="sky" />
                    {cert.ncelReady ? <Badge label="NCEL Ready" tone="indigo" /> : null}
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Children Management (for Parents) */}
        {role === 'PARENT' ? (
          <View>
            <SectionHeader
              title="إدارة الأبناء"
              subtitle="ملفات مرتبطة بموافقة ولي الأمر"
              actionLabel="+ إضافة ابن"
              onActionPress={() => setChildModalOpen(true)}
            />
            <View style={styles.stack}>
              {childrenList.map((child) => (
                <Card key={child.id} style={styles.childCard}>
                  <View style={styles.childRow}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarText}>{child.avatarInitials}</Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.fullName}</Text>
                      <Text style={styles.childMeta}>
                        {child.grade} • {child.school}
                      </Text>
                    </View>
                    <Badge
                      label={child.consentVerified ? 'موثق ✓' : 'قيد التوثيق'}
                      tone={child.consentVerified ? 'success' : 'amber'}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        {/* Notifications */}
        <View>
          <SectionHeader title="الإشعارات" />
          <View style={styles.stack}>
            {notifications.map((item) => (
              <Pressable key={item.id} onPress={() => markNotificationRead(item.id)}>
                <Card
                  style={[
                    styles.notifCard,
                    !item.read && { borderColor: colors.accent, backgroundColor: colors.surfaceSoftSky },
                  ]}
                >
                  <View style={styles.notifTop}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.read ? <Badge label="جديد" tone="sky" /> : null}
                  </View>
                  <Text style={styles.notifBody}>{item.body}</Text>
                  <Text style={styles.notifTime}>{item.createdAt}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Support Tickets */}
        <View>
          <SectionHeader
            title="تذاكر الدعم الفني"
            actionLabel="+ تذكرة جديدة"
            onActionPress={() => setTicketModalOpen(true)}
          />
          <View style={styles.stack}>
            {tickets.map((t) => (
              <Card key={t.id} style={styles.ticketCard}>
                <View style={styles.ticketTop}>
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
                <Text style={styles.ticketSubject}>{t.subject}</Text>
                <Text style={styles.ticketMeta}>
                  {t.category} • {t.slaLabel}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Logout */}
        <Button
          title="تسجيل الخروج"
          onPress={handleLogout}
          variant="danger"
          icon="log-out-outline"
          size="lg"
          fullWidth
        />
      </ScrollView>

      {/* Certificate QR Modal */}
      <Modal
        visible={Boolean(selectedCert)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCert(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedCert ? (
            <Card style={styles.certModalCard}>
              <Badge label="شهادة إتمام معتمدة • منصة فهيم" tone="teal" />
              <Text style={[typography.h2, { textAlign: 'center' }]}>
                {selectedCert.courseTitle}
              </Text>
              <Text style={styles.certModalHolder}>تُمنح لـ: {selectedCert.holderName}</Text>
              <QrCodeMatrix value={selectedCert.serialCode} size={160} />
              <View style={styles.serialBox}>
                <Text style={styles.serialLabel}>الرقم التسلسلي للتحقق</Text>
                <Text style={styles.serialCode}>{selectedCert.serialCode}</Text>
                <Text style={styles.verifyUrl}>{selectedCert.verificationUrl}</Text>
              </View>
              <Button
                title="إغلاق"
                onPress={() => setSelectedCert(null)}
                variant="outline"
                fullWidth
              />
            </Card>
          ) : null}
        </View>
      </Modal>

      {/* Add Child Modal */}
      <Modal
        visible={childModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChildModalOpen(false)}
      >
        <View style={styles.modalBottomOverlay}>
          <View style={styles.modalSheet}>
            <Text style={typography.h2}>ربط ملف ابن / ابنة جديد</Text>
            <TextInput
              value={childName}
              onChangeText={setChildName}
              placeholder="الاسم الكامل للطالب"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />
            <TextInput
              value={childGrade}
              onChangeText={setChildGrade}
              placeholder="المرحلة الدراسية"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />
            <TextInput
              value={childSchool}
              onChangeText={setChildSchool}
              placeholder="اسم المدرسة (اختياري)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              textAlign="right"
            />
            <Button title="حفظ وربط الملف" onPress={handleAddChild} fullWidth />
            <Button
              title="إلغاء"
              onPress={() => setChildModalOpen(false)}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* New Support Ticket Modal */}
      <Modal
        visible={ticketModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketModalOpen(false)}
      >
        <View style={styles.modalBottomOverlay}>
          <View style={styles.modalSheet}>
            <Text style={typography.h2}>فتح تذكرة دعم فني</Text>
            <View style={styles.catRow}>
              {['دروس التقوية', 'المحفظة والدفع', 'الشهادات', 'تقني'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setTicketCategory(cat)}
                  style={[
                    styles.catChip,
                    ticketCategory === cat && styles.catChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      ticketCategory === cat && { color: colors.textOnPrimary },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="اشرح استفسارك أو المشكلة باختصار..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { height: 88, textAlignVertical: 'top' }]}
              textAlign="right"
            />
            <Button title="إرسال التذكرة" onPress={handleCreateTicket} fullWidth />
            <Button
              title="إلغاء"
              onPress={() => setTicketModalOpen(false)}
              variant="ghost"
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
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  profileCard: { gap: spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.textOnPrimary },
  profileInfo: { flex: 1, gap: 2 },
  profileMeta: { fontSize: 13, color: colors.textSecondary },
  roleSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  roleSwitchLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  stack: { gap: spacing.sm },
  certCard: { gap: spacing.sm },
  certTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  certInfo: { flex: 1, gap: 2 },
  certTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  certSerial: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  certBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  childCard: { padding: spacing.md },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  childAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: { fontSize: 15, fontWeight: '800', color: colors.accentDark },
  childInfo: { flex: 1, gap: 2 },
  childName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  childMeta: { fontSize: 12, color: colors.textSecondary },
  notifCard: { gap: 4, padding: spacing.md },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  notifBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  notifTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  ticketCard: { gap: 4, padding: spacing.md },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketNum: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  ticketMeta: { fontSize: 12, color: colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  certModalCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  certModalHolder: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  serialBox: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  serialLabel: { fontSize: 11, color: colors.textMuted },
  serialCode: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  verifyUrl: { fontSize: 11, color: colors.accentDark },
  modalBottomOverlay: {
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
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
});
