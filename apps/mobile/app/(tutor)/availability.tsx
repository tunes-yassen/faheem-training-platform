import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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

const DAYS = [
  { index: 0, label: 'الأحد' },
  { index: 1, label: 'الإثنين' },
  { index: 2, label: 'الثلاثاء' },
  { index: 3, label: 'الأربعاء' },
  { index: 4, label: 'الخميس' },
  { index: 5, label: 'الجمعة' },
  { index: 6, label: 'السبت' },
];

const QUICK_PRESETS = [
  { label: 'صباحي (09:00 - 11:00)', start: '09:00', end: '11:00' },
  { label: 'عصري (16:00 - 18:00)', start: '16:00', end: '18:00' },
  { label: 'مسائي (19:30 - 21:30)', start: '19:30', end: '21:30' },
];

export default function TutorAvailabilityScreen() {
  const { tutorSlots, toggleTutorSlot, addTutorSlot, saveTutorAvailability } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [saving, setSaving] = useState(false);

  const daySlots = useMemo(
    () => tutorSlots.filter((s) => s.dayIndex === selectedDay),
    [tutorSlots, selectedDay]
  );

  const activeCount = useMemo(
    () => tutorSlots.filter((s) => s.enabled).length,
    [tutorSlots]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTutorAvailability();
      Alert.alert('تم حفظ الجدول', 'تم تحديث أوقات التفرغ الخاصة بك لنظام المطابقة الذكية.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>إدارة جدول التفرغ</Text>
          <Text style={styles.headerSub}>
            حدد أوقاتك المتاحة لمنع تعارض الحجوزات وتفعيل المطابقة التلقائية
          </Text>
        </View>

        <Card tone="teal" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>إجمالي الفترات المفعّلة أسبوعياً</Text>
              <Text style={styles.summaryValue}>{activeCount} فترة متاحة</Text>
            </View>
            <Badge label="منع التعارض مفعل ✓" tone="success" />
          </View>
        </Card>

        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {DAYS.map((day) => {
            const active = selectedDay === day.index;
            const count = tutorSlots.filter(
              (s) => s.dayIndex === day.index && s.enabled
            ).length;
            return (
              <Pressable
                key={day.index}
                onPress={() => setSelectedDay(day.index)}
                style={[styles.dayChip, active && styles.dayChipActive]}
              >
                <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                  {day.label}
                </Text>
                <Text style={[styles.dayCount, active && { color: colors.primaryLight }]}>
                  {count} فترة
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Day Slots */}
        <View>
          <SectionHeader
            title={`فترات يوم ${DAYS[selectedDay].label}`}
            subtitle="فعّل أو عطّل الفترة بضغطة واحدة"
          />
          {daySlots.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد فترات مضافة لهذا اليوم بعد.</Text>
            </Card>
          ) : (
            <View style={styles.stack}>
              {daySlots.map((slot) => (
                <Card key={slot.id} style={styles.slotCard}>
                  <View style={styles.slotRow}>
                    <View style={styles.slotInfo}>
                      <View style={styles.slotTimeRow}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={styles.slotTime}>
                          {slot.startTime} — {slot.endTime}
                        </Text>
                      </View>
                      <Text style={styles.slotStatus}>
                        {slot.enabled ? 'متاح للحجز الفوري' : 'مغلق مؤقتاً'}
                      </Text>
                    </View>
                    <Switch
                      value={slot.enabled}
                      onValueChange={() => toggleTutorSlot(slot.id)}
                      trackColor={{ false: colors.border, true: colors.primaryLight }}
                      thumbColor={slot.enabled ? colors.primary : colors.textMuted}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Quick Add Presets */}
        <View>
          <SectionHeader title={`إضافة فترة سريعة ليوم ${DAYS[selectedDay].label}`} />
          <View style={styles.presetStack}>
            {QUICK_PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() =>
                  addTutorSlot(
                    DAYS[selectedDay].index,
                    DAYS[selectedDay].label,
                    preset.start,
                    preset.end
                  )
                }
                style={styles.presetBtn}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.presetText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          title="حفظ جدول التفرغ"
          onPress={handleSave}
          loading={saving}
          icon="save-outline"
          size="lg"
          fullWidth
        />
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
  summaryCard: { padding: spacing.lg },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryLabel: { fontSize: 12, color: colors.textSecondary },
  summaryValue: { fontSize: 20, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },
  daysRow: { gap: spacing.sm },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 74,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  dayLabelActive: { color: colors.textOnPrimary },
  dayCount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  stack: { gap: spacing.sm },
  slotCard: { padding: spacing.md },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotInfo: { gap: 4 },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  slotStatus: { fontSize: 12, color: colors.textSecondary },
  presetStack: { gap: spacing.sm },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  presetText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
