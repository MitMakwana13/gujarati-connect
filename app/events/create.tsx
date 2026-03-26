import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Calendar, Clock, MapPin } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = ['cultural', 'business', 'social', 'religious', 'sports', 'other'];
const TICKET_OPTS = ['Free', '$10', '$25', '$50', 'Custom'];

export default function CreateEventScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('Free');
  const [category, setCategory] = useState('social');
  const [maxAttendees, setMaxAttendees] = useState('');

  const [date, setDate] = useState(new Date(Date.now() + 86400000)); // tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.from('events').insert({
        creator_id: user.id,
        title: title.trim(),
        description: description.trim(),
        event_date: date.toISOString(),
        location_name: locationName.trim(),
        city: profile?.current_city || null, // fallback
        ticket_price: ticketPrice,
        category,
        max_attendees: parseInt(maxAttendees) || null,
        banner_emoji: '🎉', // default for now
        banner_color: '#2d1200' // default warm dark
      }).select('id').single();

      if (error) throw error;
      router.back();
    } catch (e: any) {
      alert('Error creating event: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
     setShowDatePicker(false);
     if (selectedDate) {
        const newD = new Date(date);
        newD.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setDate(newD);
     }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
     setShowTimePicker(false);
     if (selectedTime) {
        const newD = new Date(date);
        newD.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        setDate(newD);
     }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Event</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading || !title.trim()} style={[styles.saveBtn, !title.trim() && { opacity: 0.5 }]}>
               {loading ? <ActivityIndicator color={Colors.saffron} /> : <Text style={styles.saveText}>Publish</Text>}
            </TouchableOpacity>
         </View>

         <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Event Title *</Text>
               <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Diwali Gala 2026" placeholderTextColor={Colors.textSecondary} />
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>Description</Text>
               <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Tell people what this event is about..." placeholderTextColor={Colors.textSecondary} multiline />
            </View>

            <View style={styles.rowGroup}>
               <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={styles.pickerBox} onPress={() => setShowDatePicker(true)}>
                     <Calendar size={18} color={Colors.saffron} style={{ marginRight: 8 }} />
                     <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
               </View>
               <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Time</Text>
                  <TouchableOpacity style={styles.pickerBox} onPress={() => setShowTimePicker(true)}>
                     <Clock size={18} color={Colors.tealLight} style={{ marginRight: 8 }} />
                     <Text style={styles.pickerText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
               </View>
            </View>

            {showDatePicker && (
               <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
            )}
            {showTimePicker && (
               <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} />
            )}

            <View style={styles.inputGroup}>
               <Text style={styles.label}>Location Name</Text>
               <View style={styles.iconInputWrap}>
                  <MapPin size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={locationName} onChangeText={setLocationName} placeholder="Alexandra Palace, London" placeholderTextColor={Colors.textSecondary} />
               </View>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>Category</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {CATEGORIES.map(cat => (
                     <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
                        <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>

            <View style={styles.rowGroup}>
               <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Ticket Price</Text>
                  <TextInput style={styles.input} value={ticketPrice} onChangeText={setTicketPrice} placeholder="Free, $25, etc" placeholderTextColor={Colors.textSecondary} />
               </View>
               <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Max Capacity (opt)</Text>
                  <TextInput style={styles.input} value={maxAttendees} onChangeText={setMaxAttendees} placeholder="e.g. 50" placeholderTextColor={Colors.textSecondary} keyboardType="numeric" />
               </View>
            </View>

            <View style={{ height: 40 }} />
         </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(232, 137, 42, 0.15)', borderRadius: 20 },
  saveText: { color: Colors.saffron, fontFamily: Typography.bodyBold, fontSize: 14 },
  headerTitle: { fontSize: 18, fontFamily: Typography.display, color: Colors.text },
  
  content: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  rowGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontFamily: Typography.bodyBold, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: Colors.text, fontFamily: Typography.body, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },

  pickerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pickerText: { color: Colors.text, fontFamily: Typography.body, fontSize: 15 },

  iconInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingLeft: 16 },
  inputIcon: { marginRight: 4 },

  chipScroll: { flexDirection: 'row', marginTop: 4 },
  chip: { backgroundColor: Colors.surface2, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: 'rgba(19, 138, 128, 0.15)', borderColor: Colors.teal },
  chipText: { color: Colors.textSecondary, fontFamily: Typography.bodyBold, fontSize: 14 },
  chipTextActive: { color: Colors.tealLight },
});
