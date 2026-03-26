import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react-native';

const GUJARAT_CITIES = [
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 
  'Junagadh', 'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Mehsana', 
  'Bharuch', 'Porbandar', 'Godhra', 'Valsad', 'Palanpur', 'Dahod', 
  'Botad', 'Amreli', 'Other'
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selectedCity) {
      alert('Please select your hometown');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hometown: selectedCity })
        .eq('id', user?.id);

      if (error) throw error;
      
      router.push('/(onboarding)/step3');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCity = ({ item }: { item: string }) => {
    const isSelected = selectedCity === item;
    return (
      <TouchableOpacity 
        style={[styles.cityCard, isSelected && styles.cityCardSelected]} 
        onPress={() => setSelectedCity(item)}
      >
        <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>{item}</Text>
        {isSelected && <Check size={18} color={Colors.saffron} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.textSecondary} size={24} />
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '66%' }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Where are you from?</Text>
        <Text style={styles.subtitle}>Adding your hometown helps you connect with people from your native roots.</Text>

        <FlatList
          data={GUJARAT_CITIES}
          renderItem={renderCity}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, !selectedCity && styles.submitBtnDisabled]} 
          onPress={handleNext}
          disabled={loading || !selectedCity}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>CONTINUE</Text>
              <ArrowRight color="#fff" size={20} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { marginRight: 16 },
  stepText: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  progressBar: { height: 4, backgroundColor: Colors.surface2, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.saffron, borderRadius: 2 },
  
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  title: { fontSize: 36, fontFamily: Typography.display, color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, fontFamily: Typography.body, color: Colors.textSecondary, marginBottom: 24, lineHeight: 24 },
  
  listContainer: { paddingBottom: 40, gap: 12 },
  cityCard: { flex: 0.48, height: 56, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  cityCardSelected: { borderColor: Colors.saffron, backgroundColor: 'rgba(232, 137, 42, 0.05)' },
  cityText: { color: Colors.text, fontFamily: Typography.body, fontSize: 14 },
  cityTextSelected: { color: Colors.saffron, fontFamily: Typography.bodyBold },
  
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  submitBtn: { backgroundColor: Colors.saffron, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontFamily: Typography.bodyBold, color: '#fff', letterSpacing: 1 }
});
