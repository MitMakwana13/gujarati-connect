import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react-native';

export default function OnboardingStep3() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode.length > 0) {
        const detectedCity = geocode[0].city || geocode[0].region || geocode[0].subregion;
        if (detectedCity) setCity(detectedCity);
      }
    } catch (e) {
      alert('Failed to detect location');
    } finally {
      setLocLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!city) {
      alert('Please enter or detect your current city');
      return;
    }
    
    setLoading(true);
    try {
      let updateData: any = { current_city: city };
      
      // PostGIS WKT format
      if (coords) {
        updateData.location = `POINT(${coords.lng} ${coords.lat})`;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      // The session route protection in _layout will trigger and send them to /(tabs)
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.textSecondary} size={24} />
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 3 of 3</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Where are you now?</Text>
        <Text style={styles.subtitle}>Help us connect you with nearby Gujaratis and local events.</Text>

        <View style={styles.form}>
          <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={locLoading}>
            {locLoading ? (
               <ActivityIndicator color={Colors.text} size="small" />
            ) : (
               <>
                 <MapPin color={Colors.text} size={20} />
                 <Text style={styles.detectBtnText}>Detect My Location</Text>
               </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter City Name Manually"
              placeholderTextColor={Colors.textSecondary}
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, !city && styles.submitBtnDisabled]} 
          onPress={handleFinish}
          disabled={loading || !city}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>FINISH & ENTER APP</Text>
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
  subtitle: { fontSize: 16, fontFamily: Typography.body, color: Colors.textSecondary, marginBottom: 40, lineHeight: 24 },
  
  form: { gap: 16 },
  detectBtn: { backgroundColor: Colors.surface, height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border },
  detectBtnText: { color: Colors.text, fontFamily: Typography.bodyBold, fontSize: 15 },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textSecondary, paddingHorizontal: 16, fontFamily: Typography.bodyBold, fontSize: 12 },
  
  inputGroup: { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border, height: 60, justifyContent: 'center' },
  input: { color: Colors.text, fontFamily: Typography.body, fontSize: 16, height: '100%' },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  submitBtn: { backgroundColor: Colors.saffron, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontFamily: Typography.bodyBold, color: '#fff', letterSpacing: 1 }
});
