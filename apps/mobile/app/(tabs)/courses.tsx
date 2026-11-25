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
import { Badge, BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/theme';
import { Course, CourseMode } from '@/types';

const MODE_FILTERS: { key: CourseMode | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'الكل' },
  { key: 'IN_PERSON', label: 'حضوري' },
  { key: 'LIVE_ONLINE', label: 'أونلاين' },
  { key: 'RECORDED', label: 'مسجل' },
];

const MODE_META: Record<CourseMode, { label: string; tone: BadgeTone }> = {
  IN_PERSON: { label: 'حضوري', tone: 'amber' },
  LIVE_ONLINE: { label: 'أونلاين مباشر', tone: 'sky' },
  RECORDED: { label: 'مسجل', tone: 'teal' },
};

export default function CoursesScreen() {
  const { courses, enrollments, enrollInCourse } = useAuth();
  const [selectedMode, setSelectedMode] = useState<CourseMode | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const modeMatch = selectedMode === 'ALL' || c.mode === selectedMode;
      const textMatch =
        !query.trim() ||
        c.title.includes(query.trim()) ||
        c.category.includes(query.trim()) ||
        c.instructorName.includes(query.trim());
      return modeMatch && textMatch;
    });
  }, [courses, selectedMode, query]);

  const isEnrolled = (courseId: string) =>
    enrollments.some((e) => e.courseId === courseId);

  const handleEnroll = async (course: Course) => {
    setEnrolling(true);
    try {
      const res = await enrollInCourse(course);
      Alert.alert(res.ok ? 'تم التسجيل' : 'تنبيه', res.message);
      if (res.ok) setActiveCourse(null);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>الدورات المهنية</Text>
          <Text style={styles.headerSub}>
            برامج معتمدة حضورية ومباشرة ومسجلة بشهادات موثقة
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن دورة، مجال، أو مدرب..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            textAlign="right"
          />
        </View>

        {/* Mode Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {MODE_FILTERS.map((f) => {
            const active = selectedMode === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setSelectedMode(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Course Cards */}
        <View style={styles.list}>
          {filteredCourses.map((course) => {
            const modeMeta = MODE_META[course.mode];
            const enrolled = isEnrolled(course.id);

            return (
              <Pressable key={course.id} onPress={() => setActiveCourse(course)}>
                <Card style={styles.courseCard}>
                  <View style={styles.badgesRow}>
                    <Badge label={modeMeta.label} tone={modeMeta.tone} />
                    <Badge label={course.category} tone="slate" />
                    {course.ncelReady ? <Badge label="جاهز لـ NCEL" tone="indigo" /> : null}
                  </View>

                  <Text style={typography.h3}>{course.title}</Text>
                  <Text style={styles.courseSummary} numberOfLines={2}>
                    {course.summary}
                  </Text>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{course.instructorName}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{course.durationHours} ساعة</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={14} color={colors.highlight} />
                      <Text style={styles.metaText}>
                        {course.rating} ({course.enrolledCount})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.price}>{course.priceSar} ر.س</Text>
                      <Text style={styles.cohortText}>{course.nextCohortDate}</Text>
                    </View>
                    {enrolled ? (
                      <Badge label="مسجل بالفعل ✓" tone="success" />
                    ) : (
                      <Button
                        title="التفاصيل والتسجيل"
                        onPress={() => setActiveCourse(course)}
                        size="sm"
                      />
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Course Detail & Enrollment Modal */}
      <Modal
        visible={Boolean(activeCourse)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCourse(null)}
      >
        <View style={styles.modalOverlay}>
          {activeCourse ? (
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Badge
                    label={MODE_META[activeCourse.mode].label}
                    tone={MODE_META[activeCourse.mode].tone}
                  />
                  <Pressable onPress={() => setActiveCourse(null)} hitSlop={10}>
                    <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Text style={[typography.h2, { marginTop: spacing.sm }]}>
                  {activeCourse.title}
                </Text>
                <Text style={styles.modalInstructor}>
                  المدرب: {activeCourse.instructorName} • {activeCourse.locationOrPlatform}
                </Text>
                <Text style={styles.modalSummary}>{activeCourse.summary}</Text>

                <View style={styles.highlightsCard}>
                  <Text style={styles.highlightsTitle}>مميزات البرنامج التدريبي</Text>
                  {activeCourse.highlights.map((h) => (
                    <View key={h} style={styles.highlightRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalFooter}>
                  <View>
                    <Text style={styles.modalPriceLabel}>رسوم التسجيل</Text>
                    <Text style={styles.modalPrice}>{activeCourse.priceSar} ر.س</Text>
                  </View>
                  {activeCourse.seatsRemaining ? (
                    <Badge
                      label={`متبقي ${activeCourse.seatsRemaining} مقاعد`}
                      tone="amber"
                    />
                  ) : null}
                </View>

                {isEnrolled(activeCourse.id) ? (
                  <Button
                    title="أنت مسجل بالفعل في هذه الدورة"
                    onPress={() => setActiveCourse(null)}
                    variant="outline"
                    fullWidth
                  />
                ) : (
                  <Button
                    title="تأكيد التسجيل من المحفظة"
                    onPress={() => void handleEnroll(activeCourse)}
                    loading={enrolling}
                    icon="checkmark-done-outline"
                    size="lg"
                    fullWidth
                  />
                )}
              </ScrollView>
            </View>
          ) : null}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterRow: { gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary },
  list: { gap: spacing.md },
  courseCard: { gap: spacing.sm },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  courseSummary: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    marginTop: 4,
  },
  price: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  cohortText: { fontSize: 12, color: colors.textSecondary },
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInstructor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.md,
  },
  modalSummary: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  highlightsCard: {
    backgroundColor: colors.surfaceSoftTeal,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  highlightsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  highlightText: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalPriceLabel: { fontSize: 12, color: colors.textSecondary },
  modalPrice: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
});
