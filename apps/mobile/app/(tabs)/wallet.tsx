import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import { Badge, BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { WalletLedgerType } from '@/types';

const LEDGER_META: Record<
  WalletLedgerType,
  { label: string; tone: BadgeTone; sign: '+' | '-'; icon: keyof typeof Ionicons.glyphMap }
> = {
  CREDIT: { label: 'إيداع', tone: 'success', sign: '+', icon: 'arrow-down-circle' },
  HOLD: { label: 'حجز مبلغ', tone: 'amber', sign: '-', icon: 'lock-closed' },
  DEBIT: { label: 'خصم', tone: 'danger', sign: '-', icon: 'arrow-up-circle' },
  RELEASE: { label: 'فك حجز', tone: 'sky', sign: '+', icon: 'lock-open' },
  REFUND: { label: 'استرداد', tone: 'teal', sign: '+', icon: 'refresh-circle' },
  SETTLEMENT: { label: 'تسوية', tone: 'indigo', sign: '+', icon: 'checkmark-done-circle' },
};

const TOP_UP_AMOUNTS = [100, 250, 500, 1000];

export default function WalletScreen() {
  const { wallet, ledger, packages, topUpWallet } = useAuth();
  const [filter, setFilter] = useState<'ALL' | WalletLedgerType>('ALL');
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  const filteredLedger = useMemo(() => {
    if (filter === 'ALL') return ledger;
    return ledger.filter((entry) => entry.type === filter);
  }, [ledger, filter]);

  const handleConfirmTopUp = async () => {
    setLoading(true);
    try {
      await topUpWallet(selectedAmount, 'شحن رصيد المحفظة عبر مدى / Apple Pay');
      setTopUpModalOpen(false);
      Alert.alert('تم الشحن بنجاح', `تمت إضافة ${selectedAmount} ر.س إلى رصيدك المتاح.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={typography.h1}>المحفظة المالية</Text>
          <Text style={styles.headerSub}>
            سجل عمليات موثق (Append-Only Ledger) لحماية رصيدك
          </Text>
        </View>

        {/* Balance Hero Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>الرصيد المتاح للاستخدام</Text>
            <Badge label="SAR • ريال سعودي" tone="amber" />
          </View>
          <Text style={styles.balanceValue}>{wallet.availableSar.toLocaleString()} ر.س</Text>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStatBox}>
              <Text style={styles.statSmallLabel}>مبالغ محجوزة (Hold)</Text>
              <Text style={styles.statSmallValue}>{wallet.heldSar} ر.س</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStatBox}>
              <Text style={styles.statSmallLabel}>إجمالي المدفوعات</Text>
              <Text style={styles.statSmallValue}>{wallet.totalSpentSar} ر.س</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setTopUpModalOpen(true)}
            style={({ pressed }) => [styles.topUpBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="add-circle" size={20} color={colors.primaryDark} />
            <Text style={styles.topUpBtnText}>شحن المحفظة أو شراء باقة</Text>
          </Pressable>
        </View>

        {/* Quick Packages Strip */}
        <View>
          <SectionHeader title="شحن سريع عبر الباقات" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pkgRow}
          >
            {packages.map((pkg) => (
              <Card key={pkg.id} style={styles.miniPkg}>
                <Text style={styles.miniPkgName}>{pkg.name}</Text>
                <Text style={styles.miniPkgPrice}>{pkg.priceSar} ر.س</Text>
                <Button
                  title="شراء"
                  size="sm"
                  variant="outline"
                  onPress={async () => {
                    await topUpWallet(pkg.priceSar, `شراء ${pkg.name}`);
                    Alert.alert('تم الشراء', `تمت إضافة ${pkg.name} بنجاح.`);
                  }}
                />
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Ledger Filter Chips */}
        <View>
          <SectionHeader title="سجل العمليات (Ledger)" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { key: 'ALL' as const, label: 'الكل' },
              { key: 'CREDIT' as const, label: 'إيداع' },
              { key: 'HOLD' as const, label: 'حجز' },
              { key: 'DEBIT' as const, label: 'خصم' },
              { key: 'REFUND' as const, label: 'استرداد' },
            ].map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Ledger Items */}
        <View style={styles.ledgerList}>
          {filteredLedger.map((entry) => {
            const meta = LEDGER_META[entry.type];
            const isPositive = meta.sign === '+';
            return (
              <Card key={entry.id} style={styles.ledgerCard}>
                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerIcon}>
                    <Ionicons
                      name={meta.icon}
                      size={22}
                      color={isPositive ? colors.success : colors.highlightDark}
                    />
                  </View>
                  <View style={styles.ledgerInfo}>
                    <Text style={styles.ledgerDesc}>{entry.description}</Text>
                    <Text style={styles.ledgerMeta}>
                      {entry.reference} • {entry.createdAt}
                    </Text>
                  </View>
                  <View style={styles.ledgerAmountCol}>
                    <Text
                      style={[
                        styles.ledgerAmount,
                        { color: isPositive ? colors.success : colors.textPrimary },
                      ]}
                    >
                      {meta.sign}
                      {entry.amountSar} ر.س
                    </Text>
                    <Badge label={meta.label} tone={meta.tone} />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Top Up Modal */}
      <Modal
        visible={topUpModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTopUpModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={typography.h2}>شحن رصيد المحفظة</Text>
              <Pressable onPress={() => setTopUpModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>اختر المبلغ المطلوب إضافته إلى محفظة فهيم:</Text>
            <View style={styles.amountGrid}>
              {TOP_UP_AMOUNTS.map((amt) => {
                const active = selectedAmount === amt;
                return (
                  <Pressable
                    key={amt}
                    onPress={() => setSelectedAmount(amt)}
                    style={[styles.amountChip, active && styles.amountChipActive]}
                  >
                    <Text style={[styles.amountText, active && styles.amountTextActive]}>
                      {amt} ر.س
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              title={`تأكيد شحن ${selectedAmount} ر.س`}
              onPress={handleConfirmTopUp}
              loading={loading}
              icon="shield-checkmark-outline"
              size="lg"
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
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.elevated,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: colors.primaryLight, fontWeight: '600' },
  balanceValue: { fontSize: 34, fontWeight: '800', color: colors.textOnPrimary },
  balanceStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  balanceStatBox: { flex: 1, gap: 2 },
  balanceDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: spacing.md },
  statSmallLabel: { fontSize: 11, color: colors.primaryLight },
  statSmallValue: { fontSize: 15, fontWeight: '800', color: colors.textOnPrimary },
  topUpBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  topUpBtnText: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  pkgRow: { gap: spacing.md },
  miniPkg: { width: 180, gap: spacing.sm },
  miniPkgName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  miniPkgPrice: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  filterRow: { gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary },
  ledgerList: { gap: spacing.sm },
  ledgerCard: { padding: spacing.md },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ledgerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerInfo: { flex: 1, gap: 3 },
  ledgerDesc: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  ledgerMeta: { fontSize: 11, color: colors.textMuted },
  ledgerAmountCol: { alignItems: 'flex-end', gap: 4 },
  ledgerAmount: { fontSize: 14, fontWeight: '800' },
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
    gap: spacing.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalSub: { fontSize: 14, color: colors.textSecondary },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amountChip: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  amountChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoftTeal,
  },
  amountText: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  amountTextActive: { color: colors.primaryDark },
});
