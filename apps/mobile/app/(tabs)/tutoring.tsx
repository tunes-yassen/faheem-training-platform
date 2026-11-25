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
import { Badge, BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, spacing, typography } from '@/theme';
import { LessonRequestPath, LessonRequestStatus, TutorProfile } from '@/types';

type TutoringSubTab = 'BROWSE' | 'BOOK' | 'REQUESTS';

const SUBJECTS = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة الإنجليزية', 'القدرات الكمية'];
const GRADES = ['الابتدائي', 'المتوسط', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];

const PATH_OPTIONS: {
  key: LessonRequestPath;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'DIRECT',
    title: 'حجز مباشر',
    desc: 'اختر معلماً معتمداً محدداً',
    icon: 'person-circle-outline',
  },
  {
    key: 'OPEN_AUTO_MATCH',
    title: 'مطابقة تلقائية',
    desc: 'أول معلم معتمد يقبل الطلب',
    icon: 'flash-outline',
  },
  {
    key: 'COORDINATOR',
    title: 'عبر المنسق',
    desc: 'ترشيح مخصص حسب الاحتياج',
    icon: 'headset-outline',
  },
];

const STATUS_META: Record<LessonRequestStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: 'بانتظار المطابقة', tone: 'amber' },
  MATCHED: { label: 'تم الترشيح', tone: 'sky' },
  CONFIRMED: { label: 'مؤكد وجاهز', tone: 'success' },
  COMPLETED: { label: 'مكتمل', tone: 'teal' },
  CANCELLED: { label: 'ملغي', tone: 'danger' },
};

export default function TutoringScreen() {
  const {
    tutors,
    packages,
    lessonRequests,
    wallet,
    createLessonRequest,
    topUpWallet,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TutoringSubTab>('BROWSE');
  const [selectedPath, setSelectedPath] = useState<LessonRequestPath>('OPEN_AUTO_MATCH');
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile>(tutors[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[4]);
  const [preferredDate, setPreferredDate] = useState('غداً');
  const [preferredTime, setPreferredTime] = useState('6:30 مساءً');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBookWithTutor = (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setSelectedPath('DIRECT');
    setSubject(tutor.subjects[0] ?? SUBJECTS[0]);
    setActiveTab('BOOK');
  };

  const handleSubmitBooking = async () => {
    const price = selectedPath === 'DIRECT' ? selectedTutor.hourlyRate : 120;
    if (wallet.availableSar < price) {
      Alert.alert(
        'الرصيد غير كافٍ',
        `تحتاج إلى ${price} ر.س لحجز الحصة. يمكنك شحن المحفظة أولاً.`
      );
      return;
    }
    setSubmitting(true);
    try {
      await createLessonRequest({
        subject,
        grade,
        path: selectedPath,
        tutorId: selectedPath === 'DIRECT' ? selectedTutor.id : undefined,
        tutorName: selectedPath === 'DIRECT' ? selectedTutor.fullName : undefined,
        preferredDate: preferredDate.trim() || 'غداً',
        preferredTime: preferredTime.trim() || '6:00 مساءً',
        durationMinutes: 60,
        priceSar: price,
        notes: notes.trim() || undefined,
      });
      setNotes('');
      setActiveTab('REQUESTS');
      Alert.alert(
        'تم إرسال طلب الحجز',
        'تم حجز المبلغ في المحفظة وإرسال طلبك بنجاح. يمكنك متابعة حالته الآن.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyPackage = async (pkgName: string, priceSar: number) => {
    await topUpWallet(priceSar, `شراء ${pkgName}`);
    Alert.alert('تم تفعيل الباقة', `تمت إضافة رصيد ${pkgName} إلى محفظتك بنجاح.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>دروس التقوية</Text>
          <Text style={styles.headerSub}>
            معلمون معتمدون • مطابقة ذكية فورية • باقات موفرة
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segment}>
          {[
            { key: 'BROWSE' as const, label: 'المعلمون والباقات' },
            { key: 'BOOK' as const, label: 'حجز درس جديد' },
            { key: 'REQUESTS' as const, label: `طلباتي (${lessonRequests.length})` },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TAB 1: BROWSE TUTORS & PACKAGES */}
        {activeTab === 'BROWSE' ? (
          <View style={styles.sectionStack}>
            <SectionHeader
              title="المعلمون المعتمدون"
              subtitle="تم التحقق من المؤهلات والتقييمات"
            />
            {tutors.map((tutor) => (
              <Card key={tutor.id} style={styles.tutorCard}>
                <View style={styles.tutorTop}>
                  <View style={styles.tutorAvatar}>
                    <Text style={styles.tutorAvatarText}>{tutor.avatarInitials}</Text>
                  </View>
                  <View style={styles.tutorInfo}>
                    <View style={styles.tutorNameRow}>
                      <Text style={styles.tutorName}>{tutor.fullName}</Text>
                      {tutor.verified ? (
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      ) : null}
                    </View>
                    <Text style={styles.tutorTitle}>{tutor.title}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color={colors.highlight} />
                      <Text style={styles.ratingText}>
                        {tutor.rating} ({tutor.reviewsCount} تقييم) • خبرة {tutor.experienceYears}{' '}
                        سنوات
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.tutorBio}>{tutor.bio}</Text>

                <View style={styles.chipWrap}>
                  {tutor.subjects.map((sub) => (
                    <Badge key={sub} label={sub} tone="teal" />
                  ))}
                </View>

                <View style={styles.tutorFooter}>
                  <View>
                    <Text style={styles.priceText}>{tutor.hourlyRate} ر.س / ساعة</Text>
                    <Text style={styles.availText}>أقرب موعد: {tutor.nextAvailable}</Text>
                  </View>
                  <Button
                    title="احجز مباشرة"
                    onPress={() => handleBookWithTutor(tutor)}
                    size="sm"
                    icon="calendar-outline"
                  />
                </View>
              </Card>
            ))}

            <SectionHeader
              title="باقات دروس التقوية"
              subtitle="وفر حتى 23% مع الباقات المرنة"
            />
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                tone={pkg.popular ? 'teal' : 'default'}
                style={styles.pkgCard}
              >
                <View style={styles.pkgHeader}>
                  <Text style={typography.h3}>{pkg.name}</Text>
                  {pkg.popular ? <Badge label="الأكثر طلباً" tone="amber" /> : null}
                </View>
                <View style={styles.pkgPriceRow}>
                  <Text style={styles.pkgPrice}>{pkg.priceSar} ر.س</Text>
                  <Text style={styles.pkgOriginal}>{pkg.originalPriceSar} ر.س</Text>
                  <Text style={styles.pkgValidity}>• صالحة {pkg.validityDays} يوماً</Text>
                </View>
                <View style={styles.pkgFeatures}>
                  {pkg.features.map((f) => (
                    <View key={f} style={styles.pkgFeatureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text style={styles.pkgFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  title="شراء وتفعيل الباقة"
                  onPress={() => void handleBuyPackage(pkg.name, pkg.priceSar)}
                  variant={pkg.popular ? 'primary' : 'outline'}
                  size="md"
                  fullWidth
                />
              </Card>
            ))}
          </View>
        ) : null}

        {/* TAB 2: INTERACTIVE BOOKING FLOW */}
        {activeTab === 'BOOK' ? (
          <View style={styles.sectionStack}>
            <Card>
              <Text style={styles.formTitle}>1. اختر مسار الحجز</Text>
              <View style={styles.pathGrid}>
                {PATH_OPTIONS.map((opt) => {
                  const active = selectedPath === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setSelectedPath(opt.key)}
                      style={[styles.pathCard, active && styles.pathCardActive]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={22}
                        color={active ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.pathTitle, active && { color: colors.primaryDark }]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.pathDesc}>{opt.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedPath === 'DIRECT' ? (
                <View style={styles.directTutorBox}>
                  <Text style={styles.fieldLabel}>المعلم المختار:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {tutors.map((t) => {
                      const active = selectedTutor.id === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setSelectedTutor(t)}
                          style={[styles.selectChip, active && styles.selectChipActive]}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              active && styles.selectChipTextActive,
                            ]}
                          >
                            {t.fullName} ({t.hourlyRate} ر.س)
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={styles.formTitle}>2. المادة والمرحلة الدراسية</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {SUBJECTS.map((sub) => (
                  <Pressable
                    key={sub}
                    onPress={() => setSubject(sub)}
                    style={[styles.selectChip, subject === sub && styles.selectChipActive]}
                  >
                    <Text
                      style={[
                        styles.selectChipText,
                        subject === sub && styles.selectChipTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipRow, { marginTop: spacing.sm }]}
              >
                {GRADES.map((gr) => (
                  <Pressable
                    key={gr}
                    onPress={() => setGrade(gr)}
                    style={[styles.selectChip, grade === gr && styles.selectChipActive]}
                  >
                    <Text
                      style={[
                        styles.selectChipText,
                        grade === gr && styles.selectChipTextActive,
                      ]}
                    >
                      {gr}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.formTitle}>3. الموعد والملاحظات</Text>
              <View style={styles.twoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>اليوم المقترح</Text>
                  <TextInput
                    value={preferredDate}
                    onChangeText={setPreferredDate}
                    style={styles.input}
                    textAlign="right"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>الوقت</Text>
                  <TextInput
                    value={preferredTime}
                    onChangeText={setPreferredTime}
                    style={styles.input}
                    textAlign="right"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>موضوع الدرس أو ملاحظات إضافية</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="مثال: مراجعة الفصل الثالث وحل نماذج الاختبار..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                textAlign="right"
              />

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>تكلفة الحصة (حجز مؤقت في المحفظة)</Text>
                  <Text style={styles.summaryValue}>
                    {selectedPath === 'DIRECT' ? selectedTutor.hourlyRate : 120} ر.س
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>رصيدك المتاح</Text>
                  <Text style={styles.summaryAvail}>{wallet.availableSar} ر.س</Text>
                </View>
              </View>

              <Button
                title="تأكيد وإرسال طلب الحجز"
                onPress={handleSubmitBooking}
                loading={submitting}
                icon="checkmark-circle-outline"
                size="lg"
                fullWidth
              />
            </Card>
          </View>
        ) : null}

        {/* TAB 3: ACTIVE REQUESTS TRACKER */}
        {activeTab === 'REQUESTS' ? (
          <View style={styles.sectionStack}>
            <SectionHeader
              title="متابعة طلبات دروس التقوية"
              subtitle="تحديث لحظي لحالة المطابقة والتأكيد"
            />
            {lessonRequests.map((req) => {
              const statusInfo = STATUS_META[req.status];
              const pathLabel =
                req.path === 'DIRECT'
                  ? 'حجز مباشر'
                  : req.path === 'OPEN_AUTO_MATCH'
                  ? 'مطابقة تلقائية'
                  : 'عبر المنسق';

              return (
                <Card key={req.id} style={styles.reqCard}>
                  <View style={styles.reqTop}>
                    <View style={styles.reqTitleWrap}>
                      <Text style={typography.h3}>{req.subject}</Text>
                      <Text style={styles.reqMeta}>
                        {req.grade} • {req.preferredDate} ({req.preferredTime})
                      </Text>
                    </View>
                    <Badge label={statusInfo.label} tone={statusInfo.tone} />
                  </View>

                  <View style={styles.reqBadges}>
                    <Badge label={pathLabel} tone="slate" />
                    <Badge label={`${req.priceSar} ر.س`} tone="teal" />
                    {req.tutorName ? <Badge label={req.tutorName} tone="sky" /> : null}
                  </View>

                  {req.notes ? <Text style={styles.reqNotes}>{req.notes}</Text> : null}

                  {/* Progress Tracker */}
                  <View style={styles.trackerRow}>
                    {['إرسال الطلب', 'مطابقة المعلم', 'تأكيد الفصل'].map((stepLabel, idx) => {
                      const done =
                        idx === 0 ||
                        (idx === 1 && req.status !== 'OPEN') ||
                        (idx === 2 && (req.status === 'CONFIRMED' || req.status === 'COMPLETED'));
                      return (
                        <View key={stepLabel} style={styles.trackerStep}>
                          <View
                            style={[
                              styles.trackerDot,
                              done && { backgroundColor: colors.primary },
                            ]}
                          />
                          <Text
                            style={[
                              styles.trackerLabel,
                              done && { color: colors.primaryDark, fontWeight: '700' },
                            ]}
                          >
                            {stepLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
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
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primaryDark,
  },
  sectionStack: { gap: spacing.md },
  tutorCard: { gap: spacing.md },
  tutorTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  tutorAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  tutorInfo: { flex: 1, gap: 2 },
  tutorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tutorName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  tutorTitle: { fontSize: 13, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  tutorBio: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tutorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  priceText: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  availText: { fontSize: 12, color: colors.textSecondary },
  pkgCard: { gap: spacing.sm },
  pkgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  pkgPrice: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  pkgOriginal: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  pkgValidity: { fontSize: 12, color: colors.textSecondary },
  pkgFeatures: { gap: 6, marginVertical: spacing.xs },
  pkgFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pkgFeatureText: { fontSize: 13, color: colors.textPrimary },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pathGrid: { flexDirection: 'row', gap: spacing.sm },
  pathCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    gap: 4,
  },
  pathCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoftTeal,
  },
  pathTitle: { fontSize: 12, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  pathDesc: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  directTutorBox: { marginTop: spacing.md, gap: spacing.xs },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chipRow: { gap: spacing.sm },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  selectChipTextActive: { color: colors.textOnPrimary },
  twoCols: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  col: { flex: 1 },
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
  textArea: {
    height: 84,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  summaryBox: {
    backgroundColor: colors.surfaceSoftTeal,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  summaryAvail: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reqCard: { gap: spacing.sm },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqTitleWrap: { flex: 1, gap: 2 },
  reqMeta: { fontSize: 12, color: colors.textSecondary },
  reqBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reqNotes: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  trackerStep: { alignItems: 'center', gap: 4, flex: 1 },
  trackerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  trackerLabel: { fontSize: 11, color: colors.textMuted },
});
