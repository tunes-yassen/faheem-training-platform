import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { getHomeRouteForRole, useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import { UserRole } from '@/types';

const ROLE_OPTIONS: {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  demoEmail: string;
}[] = [
  {
    role: 'STUDENT',
    title: 'طالب',
    subtitle: 'دروس تقوية ودورات',
    icon: 'school-outline',
    demoEmail: 'student@faheem.sa',
  },
  {
    role: 'PARENT',
    title: 'ولي أمر',
    subtitle: 'متابعة الأبناء',
    icon: 'people-outline',
    demoEmail: 'parent@faheem.sa',
  },
  {
    role: 'TRAINEE',
    title: 'متدرب',
    subtitle: 'الدورات المهنية',
    icon: 'ribbon-outline',
    demoEmail: 'trainee@faheem.sa',
  },
  {
    role: 'TUTOR',
    title: 'معلم',
    subtitle: 'الطلبات والأرباح',
    icon: 'briefcase-outline',
    demoEmail: 'tutor@faheem.sa',
  },
  {
    role: 'TRAINER',
    title: 'مدرب مهني',
    subtitle: 'الدفعات والتقييم',
    icon: 'easel-outline',
    demoEmail: 'trainer@faheem.sa',
  },
  {
    role: 'COORDINATOR',
    title: 'منسق',
    subtitle: 'الإسناد والتذاكر',
    icon: 'headset-outline',
    demoEmail: 'coordinator@faheem.sa',
  },
  {
    role: 'SUPER_ADMIN',
    title: 'السوبر أدمن',
    subtitle: 'الحوكمة والموافقات',
    icon: 'shield-checkmark-outline',
    demoEmail: 'admin@faheem.sa',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { requestOtp, verifyOtp, quickDemoLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [identifier, setIdentifier] = useState('student@faheem.sa');
  const [step, setStep] = useState<'IDENTIFIER' | 'OTP'>('IDENTIFIER');
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMeta = ROLE_OPTIONS.find((r) => r.role === selectedRole) ?? ROLE_OPTIONS[0];

  const handleSelectRole = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setIdentifier(demoEmail);
    setError(null);
  };

  const handleSendOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('يرجى إدخال رقم الجوال أو البريد الإلكتروني بشكل صحيح.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(trimmed);
      setDevOtpHint(res.devOtp ?? '1234');
      setOtpCode(res.devOtp ?? '1234');
      setStep('OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length < 4) {
      setError('يرجى إدخال رمز التحقق المكون من 4 أرقام على الأقل.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(identifier.trim(), otpCode.trim(), selectedRole);
      router.replace(getHomeRouteForRole(selectedRole));
    } catch {
      setError('تعذر التحقق من الرمز، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = async () => {
    setLoading(true);
    try {
      await quickDemoLogin(selectedRole);
      router.replace(getHomeRouteForRole(selectedRole));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-forward" size={22} color={colors.textPrimary} />
            </Pressable>
            <Badge label="بوابة الدخول الموحدة • OTP" tone="teal" />
          </View>

          <View style={styles.titleBlock}>
            <Text style={typography.h1}>أهلاً بك في منصة فهيم</Text>
            <Text style={styles.subtitle}>
              اختر دورك للدخول إلى لوحة التحكم المخصصة لك في التطبيق.
            </Text>
          </View>

          {/* Multi-Role Selector */}
          <View style={styles.roleSection}>
            <Text style={styles.fieldLabel}>اختر نوع الحساب (7 أدوار مدعومة)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleRow}
            >
              {ROLE_OPTIONS.map((opt) => {
                const active = selectedRole === opt.role;
                return (
                  <Pressable
                    key={opt.role}
                    onPress={() => handleSelectRole(opt.role, opt.demoEmail)}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                  >
                    <View
                      style={[
                        styles.roleIconWrap,
                        active && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={active ? colors.textOnPrimary : colors.primary}
                      />
                    </View>
                    <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.roleSub} numberOfLines={1}>
                      {opt.subtitle}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            {step === 'IDENTIFIER' ? (
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>رقم الجوال أو البريد الإلكتروني</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="مثال: 05XXXXXXXX أو student@faheem.sa"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    textAlign="right"
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Button
                  title="إرسال رمز التحقق (OTP)"
                  onPress={handleSendOtp}
                  loading={loading}
                  icon="shield-checkmark-outline"
                  size="lg"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.fieldLabel}>أدخل رمز التحقق المرسل</Text>
                  <Pressable onPress={() => setStep('IDENTIFIER')}>
                    <Text style={styles.changeLink}>تغيير الرقم/البريد</Text>
                  </Pressable>
                </View>
                <Text style={styles.otpMeta}>تم الإرسال إلى: {identifier}</Text>

                {devOtpHint ? (
                  <View style={styles.hintBanner}>
                    <Ionicons name="information-circle" size={18} color={colors.accentDark} />
                    <Text style={styles.hintText}>
                      رمز التجربة (Dev OTP): {devOtpHint}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="أدخل الرمز (مثال: 1234)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                  textAlign="center"
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Button
                  title="تحقق ودخول إلى اللوحة"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  icon="checkmark-circle-outline"
                  size="lg"
                  fullWidth
                />
              </View>
            )}
          </Card>

          {/* Instant Demo Access */}
          <Card tone="amber" style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="flash" size={18} color={colors.highlightDark} />
              <Text style={styles.demoTitle}>دخول تجريبي سريع</Text>
            </View>
            <Text style={styles.demoDesc}>
              الدخول المباشر بحساب {selectedMeta.title} مع إمكانية التبديل الفوري بين جميع الأدوار
              (الطالب، ولي الأمر، المتدرب، المعلم، المدرب، المنسق، السوبر أدمن).
            </Text>
            <Button
              title={`دخول فوري كـ ${selectedMeta.title}`}
              onPress={handleInstantDemo}
              variant="amber"
              size="md"
              fullWidth
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  roleSection: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  roleCard: {
    width: 108,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoftTeal,
  },
  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  roleTitleActive: {
    color: colors.primaryDark,
  },
  roleSub: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing.xl,
  },
  formGroup: {
    gap: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  otpMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentDark,
  },
  otpInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    height: 56,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 10,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
  },
  demoCard: {
    gap: spacing.sm,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.highlightDark,
  },
  demoDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
