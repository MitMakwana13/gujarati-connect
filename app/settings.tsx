import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, LogOut, Bell, Shield, CircleHelp, Languages } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale, isGujarati } = useI18n();

  const handleLogout = () => {
    Alert.alert(t('settings_logout'), t('settings_logout_confirm'), [
      { text: t('settings_cancel'), style: 'cancel' },
      { text: t('settings_logout'), style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/welcome');
      }},
    ]);
  };

  const toggleLanguage = async () => {
    await setLocale(isGujarati ? 'en' : 'gu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text} size={24} />
         </TouchableOpacity>
         <Text style={styles.title}>{t('settings_title')}</Text>
         <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
         {/* Language */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings_language')}</Text>

            <View style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <Languages size={20} color={Colors.textSecondary} />
                 <View>
                   <Text style={styles.itemText}>{isGujarati ? 'ગુજરાતી' : 'English'}</Text>
                   <Text style={styles.itemSub}>{isGujarati ? 'Switch to English' : 'ગુજરાતીમાં બદલો'}</Text>
                 </View>
               </View>
               <Switch
                 value={isGujarati}
                 onValueChange={toggleLanguage}
                 trackColor={{ true: Colors.saffron, false: Colors.surface2 }}
                 thumbColor={isGujarati ? '#fff' : Colors.textSecondary}
               />
            </View>
         </View>

         {/* Preferences */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings_notifications')}</Text>

            <View style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <Bell size={20} color={Colors.textSecondary} />
                 <Text style={styles.itemText}>{t('settings_new_connections')}</Text>
               </View>
               <Switch value={true} onValueChange={() => {}} trackColor={{ true: Colors.saffron, false: Colors.surface2 }} />
            </View>

            <View style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <Bell size={20} color={Colors.textSecondary} />
                 <Text style={styles.itemText}>{t('settings_messages')}</Text>
               </View>
               <Switch value={true} onValueChange={() => {}} trackColor={{ true: Colors.saffron, false: Colors.surface2 }} />
            </View>

            <View style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <Bell size={20} color={Colors.textSecondary} />
                 <Text style={styles.itemText}>{t('settings_events')}</Text>
               </View>
               <Switch value={false} onValueChange={() => {}} trackColor={{ true: Colors.saffron, false: Colors.surface2 }} />
            </View>
         </View>

         {/* Account */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <Shield size={20} color={Colors.textSecondary} />
                 <Text style={styles.itemText}>Privacy & Security</Text>
               </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.itemRow}>
               <View style={styles.itemLeft}>
                 <CircleHelp size={20} color={Colors.textSecondary} />
                 <Text style={styles.itemText}>Help & Support</Text>
               </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.itemRow, styles.logoutBtn]} onPress={handleLogout}>
               <View style={styles.itemLeft}>
                 <LogOut size={20} color={Colors.saffron} />
                 <Text style={[styles.itemText, { color: Colors.saffron }]}>{t('settings_logout')}</Text>
               </View>
            </TouchableOpacity>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: Typography.display, color: Colors.text },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemText: { fontSize: 15, fontFamily: Typography.bodyBold, color: Colors.text },
  itemSub: { fontSize: 12, fontFamily: Typography.body, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: { borderColor: 'rgba(232, 137, 42, 0.2)', backgroundColor: 'rgba(232, 137, 42, 0.05)' },
});
