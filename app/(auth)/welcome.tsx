import React from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1587326884674-13101eb6bf0a?auto=format&fit=crop&q=80&w=800' }}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(10, 10, 12, 0.8)', 'rgba(10, 10, 12, 1)']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.content}>
            <View style={styles.topEmpty} />

            <View style={styles.textSection}>
              <Text style={styles.title}>GujaratiConnect</Text>
              <Text style={styles.subtitle}>
                Connect with your roots, discover opportunities, and build your global network.
              </Text>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryBtn}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text style={styles.secondaryBtnText}>I ALREADY HAVE AN ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  gradient: { flex: 1, justifyContent: 'flex-end' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 40 },
  topEmpty: { flex: 1 },
  textSection: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 42, fontFamily: Typography.display, color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  actionSection: { gap: 16 },
  primaryBtn: { backgroundColor: Colors.saffron, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { fontSize: 14, fontFamily: Typography.bodyBold, color: '#fff', letterSpacing: 1 },
  secondaryBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  secondaryBtnText: { fontSize: 13, fontFamily: Typography.bodyBold, color: '#fff', letterSpacing: 1 }
});
