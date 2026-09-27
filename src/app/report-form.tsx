import { useLocalSearchParams } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';

export default function ReportFormScreen() {
  const { photoUri } = useLocalSearchParams<{
    photoUri?: string;
  }>();

  const decodedPhotoUri = photoUri
    ? decodeURIComponent(photoUri)
    : null;

  const [details, setDetails] = useState('');

  // Get current date and time
  const now = new Date();

  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const day = now.toLocaleDateString('en-IN', {
    weekday: 'long',
  });

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Temporary values.
  // We'll replace these with actual GPS/reverse-geocoding data next.
  const latitude = '17.385044';
  const longitude = '78.486671';
  const placeName = 'Hyderabad, Telangana';

  const submitReport = () => {
    const report = {
      photoUri: decodedPhotoUri,
      latitude,
      longitude,
      placeName,
      date,
      day,
      time,
      details,
    };

    console.log('REPORT:', report);

    // Later:
    // Upload photo to Supabase Storage
    // Insert report into Supabase database
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Report an Issue</Text>

      {/* PHOTO PREVIEW */}
      {decodedPhotoUri && (
        <Image
          source={{ uri: decodedPhotoUri }}
          style={styles.image}
        />
      )}

      {/* LOCATION */}
      <Text style={styles.sectionTitle}>
        Location
      </Text>

      <View style={styles.readOnlyBox}>
        <Text style={styles.label}>Place</Text>

        <Text style={styles.value}>
          📍 {placeName}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Latitude</Text>

        <Text style={styles.value}>
          {latitude}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Longitude</Text>

        <Text style={styles.value}>
          {longitude}
        </Text>
      </View>

      {/* DATE & TIME */}
      <Text style={styles.sectionTitle}>
        Date & Time
      </Text>

      <View style={styles.readOnlyBox}>
        <Text style={styles.label}>Date</Text>

        <Text style={styles.value}>
          📅 {date}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Day</Text>

        <Text style={styles.value}>
          {day}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Time</Text>

        <Text style={styles.value}>
          🕐 {time}
        </Text>
      </View>

      {/* DETAILS */}
      <Text style={styles.sectionTitle}>
        Details
      </Text>

      <TextInput
        style={styles.detailsInput}
        placeholder="Describe the issue..."
        placeholderTextColor="#888"
        value={details}
        onChangeText={setDetails}
        multiline
      />

      {/* SUBMIT */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitReport}
      >
        <Text style={styles.submitText}>
          Submit Report
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 35,
    marginBottom: 20,
  },

  image: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    resizeMode: 'cover',
    backgroundColor: '#eee',
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },

  readOnlyBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    color: '#222',
  },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },

  detailsInput: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 25,
  },

  submitButton: {
    backgroundColor: '#007AFF',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});