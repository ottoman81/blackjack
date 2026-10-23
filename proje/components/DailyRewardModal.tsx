// components/DailyRewardModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { DailyRewardService } from '@/services/dailyRewardService';
import { DAILY_REWARDS } from '@/types/dailyReward';
import { useAuth } from '@/context/AuthContext';

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onClaimed?: (reward: number) => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ 
  visible, 
  onClose, 
  onClaimed 
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<{
    currentStreak: number;
    lastClaimedAt: Date | null;
    claimedDays: number[];
    loading: boolean;
    claiming: boolean;
    error: string | null;
    success: { reward: number; bonus?: number } | null;
  }>({
    currentStreak: 0,
    lastClaimedAt: null,
    claimedDays: [],
    loading: true,
    claiming: false,
    error: null,
    success: null,
  });

  const loadState = async () => {
    if (!user) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const rewardState = await DailyRewardService.getDailyRewardState(user.deviceId);
      setState(prev => ({
        ...prev,
        currentStreak: rewardState.currentStreak,
        lastClaimedAt: rewardState.lastClaimedAt,
        claimedDays: rewardState.claimedDays,
        loading: false,
      }));
    } catch (e) {
      setState(prev => ({ ...prev, loading: false, error: 'Durum yüklenemedi' }));
    }
  };

  useEffect(() => {
    if (visible) {
      loadState();
    }
  }, [visible, user]);

  const handleClaim = async () => {
    if (!user || state.claiming) return;
    setState(prev => ({ ...prev, claiming: true, error: null }));
    
    try {
      const result = await DailyRewardService.claimDailyReward(user.deviceId);
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          claiming: false, 
          currentStreak: result.newStreak,
          claimedDays: [...prev.claimedDays, result.newStreak],
          lastClaimedAt: new Date(),
          success: { reward: result.reward, bonus: result.bonus },
        }));
        onClaimed?.(result.reward);
        
        // 2 saniye sonra modalı kapat
        setTimeout(() => onClose(), 2000);
      } else {
        setState(prev => ({ ...prev, claiming: false, error: result.error }));
      }
    } catch (e) {
      setState(prev => ({ ...prev, claiming: false, error: 'Bir hata oluştu' }));
    }
  };

  const canClaim = state.lastClaimedAt ? DailyRewardService.canClaimToday({
    lastClaimedAt: state.lastClaimedAt,
    currentStreak: state.currentStreak,
    totalClaimed: 0,
    claimedDays: state.claimedDays,
  }) : true;

  const nextReward = DAILY_REWARDS[Math.min(state.currentStreak, 6)];
  const timeRemaining = state.lastClaimedAt 
    ? DailyRewardService.getTimeUntilNextClaim(state.lastClaimedAt) 
    : 0;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>🎁 Günlük Ödül</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {state.loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Streak göstergesi */}
              <View style={styles.streakContainer}>
                <Text style={styles.streakLabel}>🔥 Günlük Seri: {state.currentStreak} / 7</Text>
                <View style={styles.streakBar}>
                  {DAILY_REWARDS.map((r, i) => (
                    <View key={r.day} style={[
                      styles.streakSegment,
                      i < state.currentStreak && styles.streakSegmentFilled,
                      state.claimedDays.includes(r.day) && styles.streakSegmentClaimed,
                    ]}>
                      <Text style={[
                        styles.streakDayText,
                        i < state.currentStreak && styles.streakDayTextFilled,
                      ]}>
                        {r.day}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bugünkü ödül */}
              <View style={styles.todayReward}>
                <Text style={styles.todayLabel}>Bugünkü Ödül</Text>
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardIcon}>{nextReward?.icon}</Text>
                  <Text style={styles.rewardAmount}>
                    +{nextReward?.reward || 0} Çip
                    {nextReward?.bonus && <Text style={styles.bonusText}> +{nextReward.bonus} BONUS</Text>}
                  </Text>
                  <Text style={styles.rewardDay}>{nextReward?.label}</Text>
                </View>
              </View>

              {/* Haftalık ödüller listesi */}
              <View style={styles.weeklyList}>
                <Text style={styles.sectionTitle}>Haftalık Ödüller</Text>
                {DAILY_REWARDS.map((reward) => (
                  <View key={reward.day} style={[
                    styles.weeklyItem,
                    state.claimedDays.includes(reward.day) && styles.weeklyItemClaimed,
                    reward.day === state.currentStreak + 1 && !state.claimedDays.includes(reward.day) && styles.weeklyItemCurrent,
                  ]}>
                    <View style={styles.weeklyItemLeft}>
                      <Text style={styles.weeklyIcon}>{reward.icon}</Text>
                      <View>
                        <Text style={styles.weeklyDay}>{reward.label}</Text>
                        <Text style={styles.weeklyDesc}>{reward.reward} Çip{reward.bonus ? ` + ${reward.bonus} Bonus` : ''}</Text>
                      </View>
                    </View>
                    <View style={styles.weeklyItemRight}>
                      {state.claimedDays.includes(reward.day) ? (
                        <Text style={styles.claimedBadge}>✓ Alındı</Text>
                      ) : reward.day === state.currentStreak + 1 ? (
                        <TouchableOpacity 
                          style={[
                            styles.claimBtn, 
                            !canClaim && styles.claimBtnDisabled,
                            state.claiming && styles.claimBtnLoading,
                          ]}
                          onPress={handleClaim}
                          disabled={!canClaim || state.claiming}
                        >
                          {state.claiming ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.claimBtnText}>
                              {canClaim ? 'AL' : 'YARIN'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.lockedText}>🔒 Kilitli</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Countdown */}
              {!canClaim && state.lastClaimedAt && (
                <View style={styles.countdown}>
                  <Text style={styles.countdownText}>
                    Sonraki ödül: {DailyRewardService.formatTimeRemaining(timeRemaining)}
                  </Text>
                </View>
              )}

              {state.success && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>
                    🎉 Tebrikler! {state.success.reward} Çip kazandınız!
                    {state.success.bonus && <Text> +{state.success.bonus} Bonus!</Text>}
                  </Text>
                </View>
              )}

              {state.error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{state.error}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#fff',
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#aaa',
  },
  content: {
    padding: 20,
  },
  streakContainer: {
    marginBottom: 24,
  },
  streakLabel: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  streakBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  streakSegment: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakSegmentFilled: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
  },
  streakSegmentClaimed: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
  },
  streakDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
  },
  streakDayTextFilled: {
    color: '#1a1a2e',
  },
  todayReward: {
    marginBottom: 24,
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  rewardCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#2a2a4a',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  bonusText: {
    fontSize: 18,
    color: '#4CAF50',
  },
  rewardDay: {
    marginTop: 4,
    fontSize: 14,
    color: '#aaa',
  },
  weeklyList: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  weeklyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2a2a4a',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  weeklyItemClaimed: {
    backgroundColor: '#1b3a1b',
    borderColor: '#4CAF50',
  },
  weeklyItemCurrent: {
    borderColor: '#FFD700',
    backgroundColor: '#3a3a1a',
  },
  weeklyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyIcon: {
    fontSize: 28,
  },
  weeklyDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  weeklyDesc: {
    fontSize: 12,
    color: '#aaa',
  },
  weeklyItemRight: {
    alignItems: 'flex-end',
  },
  claimBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    minWidth: 80,
    alignItems: 'center',
  },
  claimBtnDisabled: {
    backgroundColor: '#666',
  },
  claimBtnLoading: {
    backgroundColor: '#aaa',
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  lockedText: {
    fontSize: 12,
    color: '#666',
  },
  claimedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  countdown: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3a2a1a',
    borderWidth: 1,
    borderColor: '#FF8C00',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  successBanner: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1b3a1b',
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  errorBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
  },
});

export default DailyRewardModal;