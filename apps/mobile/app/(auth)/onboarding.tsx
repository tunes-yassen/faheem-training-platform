import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, shadows, spacing, typography } from '@/theme';

interface SlideItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  softBg: string;
  highlights: string[];
}

const SLIDES: SlideItem[] = [
  {
    id: 'tutoring',
    badge: 'دروس تقوية ذكية',
    title: 'تعلّم بثقة مع نخبة المعلمين المعتمدين',
    description:
      'احجز حصتك مباشرة مع معلمك المفضل، أو فعّل المطابقة التلقائية الفورية للحصول على أفضل معلم متاح خلال دقائق.',
    icon: 'school',
    accentColor: colors.primary,
    softBg: colors.surfaceSoftTeal,
    highlights: ['معلمون معتمدون ومراجعون', 'فصول افتراضية بضغطة زر', 'باقات مرنة ومحفظة آمنة'],
  },
  {
    id: 'courses',
    badge: 'دورات مهنية معتمدة',
    title: 'طوّر مهاراتك بشهادات موثقة برمز QR',
    description:
      'تصفح عشرات الدورات الحضورية والمباشرة والمسجلة في التقنية والإدارة واللغات مع جاهزية التحقق الفوري.',
    icon: 'ribbon',
    accentColor: colors.accent,
    softBg: colors.surfaceSoftSky,
    highlights: ['حضوري • أونلاين • مسجل', 'شهادات برقم تسلسلي ورمز QR', 'متابعة دقيقة لنسبة الإنجاز'],
  },
  {
    id: 'family',
    badge: 'بوابة متكاملة للجميع',
    title: 'متابعة ذكية لولي الأمر وأدوات احترافية للمعلم',
    description:
      'بدّل بسهولة بين أبنائك لمتابعة الحصص والتقارير، أو أدر طلباتك وجدولك وأرباحك كمعلم في منصة فهيم.',
    icon: 'people',
    accentColor: colors.highlight,
    softBg: colors.surfaceSoftAmber,
    highlights: ['تبديل فوري بين ملفات الأبناء', 'قبول فوري ذري لطلبات المعلمين', 'دعم فني وتذاكر بـ SLA واضح'],
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { quickDemoLogin } = useAuth();

  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push('/(auth)/login');
    } else {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handleQuickExplore = async () => {
    await quickDemoLogin('STUDENT');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top brand bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
            </View>
            <View>
              <Text style={styles.brandName}>منصة فهيم</Text>
              <Text style={styles.brandSub}>للتدريب والتعليم الذكي</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={10}>
            <Text style={styles.skipText}>تسجيل الدخول</Text>
          </Pressable>
        </View>

        {/* Hero visual card */}
        <View style={[styles.heroCard, { backgroundColor: slide.softBg }]}>
          <View style={[styles.orb, { backgroundColor: slide.accentColor, opacity: 0.12 }]} />
          <View style={[styles.iconCircle, { backgroundColor: slide.accentColor }]}>
            <Ionicons name={slide.icon} size={46} color={colors.textOnPrimary} />
          </View>
          <Badge
            label={slide.badge}
            tone={activeIndex === 0 ? 'teal' : activeIndex === 1 ? 'sky' : 'amber'}
            style={styles.heroBadge}
          />
          <Text style={styles.heroTitle}>{slide.title}</Text>
          <Text style={styles.heroDesc}>{slide.description}</Text>

          <View style={styles.highlightsBox}>
            {slide.highlights.map((item) => (
              <View key={item} style={styles.highlightRow}>
                <Ionicons name="checkmark-circle" size={18} color={slide.accentColor} />
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, idx) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveIndex(idx)}
              style={[
                styles.dot,
                idx === activeIndex && {
                  width: 28,
                  backgroundColor: slide.accentColor,
                },
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={isLast ? 'ابدأ الآن بتسجيل الدخول' : 'التالي'}
            onPress={handleNext}
            size="lg"
            icon={isLast ? 'log-in-outline' : 'arrow-back-outline'}
            fullWidth
          />
          <Button
            title="استعراض سريع كطالب تجريبي"
            onPress={handleQuickExplore}
            variant="outline"
            size="md"
            icon="flash-outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  brandSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  heroCard: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  orb: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.elevated,
  },
  heroBadge: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  highlightsBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  actions: {
    gap: spacing.md,
  },
});
