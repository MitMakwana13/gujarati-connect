import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ContentType = 'post' | 'comment' | 'profile';

const REASONS = [
  { key: 'spam',           label: '🗑️  Spam or scam' },
  { key: 'hate',           label: '🚫  Hate speech' },
  { key: 'nudity',         label: '🔞  Nudity / sexual content' },
  { key: 'violence',       label: '⚠️  Violence or threats' },
  { key: 'misinformation', label: '❌  Misinformation' },
  { key: 'other',          label: '•••  Other' },
];

interface Props {
  visible: boolean;
  contentType: ContentType;
  contentId: string;
  onClose: () => void;
}

export default function ReportSheet({ visible, contentType, contentId, onClose }: Props) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!selectedReason || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason: selectedReason,
      });
      if (error) {
        // Unique constraint = already reported
        if (error.code === '23505') {
          Alert.alert('Already reported', 'You have already reported this content.');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Report submitted', 'Thank you. Our team will review this shortly.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
      setSelectedReason(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Report {contentType}</Text>
          <Text style={styles.subtitle}>Why are you reporting this?</Text>

          {REASONS.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.reasonRow, selectedReason === r.key && styles.reasonRowActive]}
              onPress={() => setSelectedReason(r.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.reasonText, selectedReason === r.key && styles.reasonTextActive]}>
                {r.label}
              </Text>
              {selectedReason === r.key && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={!selectedReason || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitText}>Submit Report</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: Typography.display, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: Typography.body, color: Colors.textSecondary, marginBottom: 16 },

  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
    backgroundColor: Colors.background,
  },
  reasonRowActive: { borderColor: Colors.saffron, backgroundColor: 'rgba(232,137,42,0.08)' },
  reasonText: { fontSize: 14, fontFamily: Typography.body, color: Colors.text },
  reasonTextActive: { color: Colors.saffronLight, fontFamily: Typography.bodyBold },
  check: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 14 },

  submitBtn: {
    backgroundColor: Colors.saffron, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontFamily: Typography.bodyBold, fontSize: 15, color: '#fff' },

  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary },
});
