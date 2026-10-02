import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useEffect, useState } from 'react';

import * as Location from 'expo-location';

import { supabase } from '../../supabase';

export default function ReportFormScreen() {
  const router = useRouter();

  // ========================================
  // Parameters
  // ========================================

  const {
    photoUri,
    capturedAt,

    issueType: initialIssueType,

    confidence,

    severity: initialSeverity,

    reason: initialReason,
  } =
    useLocalSearchParams<{
      photoUri?: string;

      capturedAt?: string;

      issueType?: string;

      confidence?: string;

      severity?: string;

      reason?: string;
    }>();

  // ========================================
  // Decode photo URI
  // ========================================

  const decodedPhotoUri =
    photoUri
      ? decodeURIComponent(
          photoUri
        )
      : null;

  // ========================================
  // Issue options
  // ========================================

  const issueOptions = [
    'Garbage / Waste',
    'Illegal Dumping',
    'Pothole',
    'Damaged Road',
    'Waterlogging / Flooding',
    'Open Manhole',
    'Damaged Footpath',
    'Broken Streetlight',
    'Fallen Tree',
    'Damaged Traffic Sign',
    'Overflowing Drain',
    'Sewage / Drainage Issue',
    'Damaged Public Infrastructure',
    'Construction Debris',
    'Other',
  ];

  // ========================================
  // State
  // ========================================

  const [issueType, setIssueType] =
    useState(
      initialIssueType ||
        'Other'
    );

  const [details, setDetails] =
    useState(
      initialReason || ''
    );

  const [selectedSeverity, setSelectedSeverity] =
    useState(
      initialSeverity ||
        'unknown'
    );

  const [showIssueOptions, setShowIssueOptions] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  // ========================================
  // LOCATION STATE
  // ========================================

  const [latitude, setLatitude] =
    useState('');

  const [longitude, setLongitude] =
    useState('');

  const [placeName, setPlaceName] =
    useState(
      'Detecting location...'
    );

  const [city, setCity] =
    useState('');

  const [locationLoading, setLocationLoading] =
    useState(true);

  // ========================================
  // Date & Time
  // ========================================

  const reportDate =
    capturedAt
      ? new Date(capturedAt)
      : new Date();

  const date =
    reportDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );

  const day =
    reportDate.toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
      }
    );

  const time =
    reportDate.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

  // ========================================
  // GET CURRENT LOCATION
  // ========================================

  const getCurrentLocation =
    async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error(
          'Location permission is required to submit a civic issue.'
        );
      }

      const currentLocation =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      const currentLatitude =
        currentLocation.coords
          .latitude;

      const currentLongitude =
        currentLocation.coords
          .longitude;

      console.log(
        'Current latitude:',
        currentLatitude
      );

      console.log(
        'Current longitude:',
        currentLongitude
      );

      // ------------------------------------
      // Reverse geocode
      // ------------------------------------

      let detectedCity = '';
      let detectedPlace = '';

      try {
        const addresses =
          await Location.reverseGeocodeAsync(
            {
              latitude:
                currentLatitude,
              longitude:
                currentLongitude,
            }
          );

        const address =
          addresses[0];

        detectedCity =
          address?.city?.trim() ||
          address?.district?.trim() ||
          address?.subregion?.trim() ||
          address?.region?.trim() ||
          '';

        const region =
          address?.region?.trim() ||
          '';

        if (
          detectedCity &&
          region &&
          detectedCity
            .toLowerCase() !==
            region.toLowerCase()
        ) {
          detectedPlace =
            `${detectedCity}, ${region}`;
        } else {
          detectedPlace =
            detectedCity ||
            'Unknown location';
        }
      } catch (geocodeError) {
        console.warn(
          'Reverse geocoding failed:',
          geocodeError
        );

        detectedCity =
          'Unknown city';

        detectedPlace =
          'Location detected';
      }

      const locationData = {
        latitude:
          currentLatitude.toString(),

        longitude:
          currentLongitude.toString(),

        placeName:
          detectedPlace,

        city:
          detectedCity,
      };

      // ------------------------------------
      // Update UI
      // ------------------------------------

      setLatitude(
        locationData.latitude
      );

      setLongitude(
        locationData.longitude
      );

      setPlaceName(
        locationData.placeName
      );

      setCity(
        locationData.city
      );

      return locationData;
    };

  // ========================================
  // GET LOCATION WHEN SCREEN OPENS
  // ========================================

  useEffect(() => {
    const loadLocation =
      async () => {
        try {
          setLocationLoading(
            true
          );

          await getCurrentLocation();
        } catch (error) {
          console.error(
            'Location error:',
            error
          );

          setPlaceName(
            'Unable to detect location'
          );
        } finally {
          setLocationLoading(
            false
          );
        }
      };

    loadLocation();
  }, []);

  // ========================================
  // Format confidence
  // ========================================

  const confidenceNumber =
    confidence
      ? Number(confidence)
      : 0;

  const confidencePercentage =
    Math.round(
      confidenceNumber * 100
    );

  // ========================================
  // Submit report
  // ========================================

  const submitReport =
    async () => {
      if (!decodedPhotoUri) {
        Alert.alert(
          'Error',
          'No photo is available.'
        );

        return;
      }

      if (!issueType.trim()) {
        Alert.alert(
          'Missing Issue Type',
          'Please select an issue type.'
        );

        return;
      }

      if (!details.trim()) {
        Alert.alert(
          'Missing Description',
          'Please provide a description.'
        );

        return;
      }

      try {
        setSubmitting(true);

        console.log(
          'Starting report submission...'
        );

        // --------------------------------
        // Get fresh location
        // --------------------------------
        //
        // This makes sure we don't submit
        // the old hardcoded Hyderabad values.
        // --------------------------------

        let reportLatitude =
          latitude;

        let reportLongitude =
          longitude;

        let reportPlaceName =
          placeName;

        let reportCity =
          city;

        if (
          !reportLatitude ||
          !reportLongitude ||
          !reportCity
        ) {
          const currentLocation =
            await getCurrentLocation();

          reportLatitude =
            currentLocation.latitude;

          reportLongitude =
            currentLocation.longitude;

          reportPlaceName =
            currentLocation.placeName;

          reportCity =
            currentLocation.city;
        }

        if (
          !reportLatitude ||
          !reportLongitude
        ) {
          throw new Error(
            'Unable to determine your current location.'
          );
        }

        console.log(
          'Report latitude:',
          reportLatitude
        );

        console.log(
          'Report longitude:',
          reportLongitude
        );

        console.log(
          'Report place:',
          reportPlaceName
        );

        console.log(
          'Report city:',
          reportCity
        );

        // --------------------------------
        // Get current Supabase session
        // --------------------------------

        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          Alert.alert(
            'Login Required',
            'Your session has expired. Please log in again.'
          );

          return;
        }

        const accessToken =
          sessionData.session
            .access_token;

        console.log(
          'Supabase session found.'
        );

        // --------------------------------
        // Create Expo File
        // --------------------------------

        const file =
          new File(
            decodedPhotoUri
          );

        console.log(
          'Image URI:',
          file.uri
        );

        console.log(
          'Image exists:',
          file.exists
        );

        console.log(
          'Image size:',
          file.size,
          'bytes'
        );

        if (!file.exists) {
          throw new Error(
            'The photo file could not be found.'
          );
        }

        // --------------------------------
        // Create FormData
        // --------------------------------

        const formData =
          new FormData();

        // Image

        formData.append(
          'image',
          file as any
        );

        // User-edited final values

        formData.append(
          'issueType',
          issueType
        );

        formData.append(
          'description',
          details
        );

        // --------------------------------
        // Actual GPS location
        // --------------------------------

        formData.append(
          'latitude',
          reportLatitude
        );

        formData.append(
          'longitude',
          reportLongitude
        );

        formData.append(
          'placeName',
          reportPlaceName
        );

        // --------------------------------
        // NEW CITY FIELD
        // --------------------------------

        formData.append(
          'city',
          reportCity
        );

        // Final severity

        formData.append(
          'severity',
          selectedSeverity
        );

        // --------------------------------
        // Original Gemini result
        // --------------------------------

        formData.append(
          'aiIssueType',
          initialIssueType ||
            ''
        );

        formData.append(
          'aiConfidence',
          confidence ||
            '0'
        );

        formData.append(
          'aiSeverity',
          initialSeverity ||
            ''
        );

        formData.append(
          'aiReason',
          initialReason ||
            ''
        );

        // --------------------------------
        // Photo capture time
        // --------------------------------

        formData.append(
          'capturedAt',
          capturedAt ||
            new Date().toISOString()
        );

        console.log(
          'Sending report to backend...'
        );

        // --------------------------------
        // Send to Express
        // --------------------------------

        const response =
          await fetch(
            'http://192.168.1.30:5000/api/reports',
            {
              method: 'POST',

              headers: {
                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body: formData,
            }
          );

        console.log(
          'Backend status:',
          response.status
        );

        const data =
          await response.json();

        console.log(
          'Backend response:',
          data
        );

        // --------------------------------
        // Backend error
        // --------------------------------

        if (!response.ok) {
          Alert.alert(
            'Submission Failed',
            data.message ||
              'Unable to submit the report.'
          );

          return;
        }

        // --------------------------------
        // Success
        // --------------------------------

        Alert.alert(
          'Report Submitted',
          'Your civic issue has been reported successfully.',
          [
            {
              text: 'OK',

              onPress: () => {
                router.replace(
                  '/'
                );
              },
            },
          ]
        );
      } catch (error) {
        console.error(
          'Report submission error:',
          error
        );

        Alert.alert(
          'Submission Error',
          error instanceof Error
            ? error.message
            : 'Something went wrong while submitting the report.'
        );
      } finally {
        setSubmitting(false);
      }
    };

  // ========================================
  // UI
  // ========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={styles.title}
      >
        Report an Issue
      </Text>

      {/* ================================== */}
      {/* PHOTO */}
      {/* ================================== */}

      {decodedPhotoUri && (
        <Image
          source={{
            uri: decodedPhotoUri,
          }}
          style={styles.image}
        />
      )}

      {/* ================================== */}
      {/* AI ASSESSMENT */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        AI Assessment
      </Text>

      <View
        style={styles.aiBox}
      >
        <Text
          style={styles.aiTitle}
        >
          Gemini Validation
        </Text>

        <Text
          style={styles.aiText}
        >
          Confidence: {confidencePercentage}%
        </Text>

        <Text
          style={styles.aiText}
        >
          Suggested severity:{' '}
          {initialSeverity ||
            'Unknown'}
        </Text>

        <Text
          style={styles.aiHint}
        >
          You can review and edit the
          report before submitting.
        </Text>
      </View>

      {/* ================================== */}
      {/* ISSUE TYPE */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        Issue Type
      </Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() =>
          setShowIssueOptions(
            !showIssueOptions
          )
        }
      >
        <Text
          style={styles.dropdownText}
        >
          {issueType}
        </Text>

        <Text
          style={styles.dropdownArrow}
        >
          {showIssueOptions
            ? '▲'
            : '▼'}
        </Text>
      </TouchableOpacity>

      {showIssueOptions && (
        <View
          style={styles.optionsBox}
        >
          {issueOptions.map(
            (option) => (
              <TouchableOpacity
                key={option}
                style={
                  styles.option
                }
                onPress={() => {
                  setIssueType(
                    option
                  );

                  setShowIssueOptions(
                    false
                  );
                }}
              >
                <Text
                  style={[
                    styles.optionText,

                    option ===
                      issueType &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* ================================== */}
      {/* SEVERITY */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        Severity
      </Text>

      <View
        style={styles.severityRow}
      >
        {[
          'low',
          'medium',
          'high',
        ].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.severityButton,

              selectedSeverity
                .toLowerCase() ===
                level &&
                styles.selectedSeverity,
            ]}
            onPress={() =>
              setSelectedSeverity(
                level
              )
            }
          >
            <Text
              style={[
                styles.severityText,

                selectedSeverity
                  .toLowerCase() ===
                  level &&
                  styles.selectedSeverityText,
              ]}
            >
              {level
                .charAt(0)
                .toUpperCase() +
                level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ================================== */}
      {/* DESCRIPTION */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        Description
      </Text>

      <TextInput
        style={styles.detailsInput}
        placeholder="Edit the description if needed..."
        placeholderTextColor="#888"
        value={details}
        onChangeText={
          setDetails
        }
        multiline
      />

      {/* ================================== */}
      {/* LOCATION */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        Location
      </Text>

      <View
        style={styles.readOnlyBox}
      >
        <Text
          style={styles.label}
        >
          Place
        </Text>

        <Text
          style={styles.value}
        >
          📍 {locationLoading
            ? 'Detecting location...'
            : placeName}
        </Text>

        <View
          style={styles.divider}
        />

        <Text
          style={styles.label}
        >
          City
        </Text>

        <Text
          style={styles.value}
        >
          {locationLoading
            ? 'Detecting city...'
            : city ||
              'Unknown city'}
        </Text>

        <View
          style={styles.divider}
        />

        <Text
          style={styles.label}
        >
          Latitude
        </Text>

        <Text
          style={styles.value}
        >
          {locationLoading
            ? 'Detecting...'
            : latitude ||
              'Not available'}
        </Text>

        <View
          style={styles.divider}
        />

        <Text
          style={styles.label}
        >
          Longitude
        </Text>

        <Text
          style={styles.value}
        >
          {locationLoading
            ? 'Detecting...'
            : longitude ||
              'Not available'}
        </Text>
      </View>

      {/* ================================== */}
      {/* DATE & TIME */}
      {/* ================================== */}

      <Text
        style={styles.sectionTitle}
      >
        Date & Time
      </Text>

      <View
        style={styles.readOnlyBox}
      >
        <Text
          style={styles.label}
        >
          Date
        </Text>

        <Text
          style={styles.value}
        >
          📅 {date}
        </Text>

        <View
          style={styles.divider}
        />

        <Text
          style={styles.label}
        >
          Day
        </Text>

        <Text
          style={styles.value}
        >
          {day}
        </Text>

        <View
          style={styles.divider}
        />

        <Text
          style={styles.label}
        >
          Time
        </Text>

        <Text
          style={styles.value}
        >
          🕐 {time}
        </Text>
      </View>

      {/* ================================== */}
      {/* SUBMIT */}
      {/* ================================== */}

      <TouchableOpacity
        style={[
          styles.submitButton,

          submitting &&
            styles.submitButtonDisabled,
        ]}
        onPress={
          submitReport
        }
        disabled={submitting}
      >
        {submitting ? (
          <>
            <ActivityIndicator
              color="#fff"
            />

            <Text
              style={
                styles.submitText
              }
            >
              Submitting...
            </Text>
          </>
        ) : (
          <Text
            style={
              styles.submitText
            }
          >
            Submit Report
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },

    content: {
      padding: 20,
      paddingBottom: 50,
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

    aiBox: {
      borderWidth: 1,
      borderColor: '#d8e8ff',
      borderRadius: 12,
      padding: 15,
      backgroundColor: '#f4f8ff',
      marginBottom: 20,
    },

    aiTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
    },

    aiText: {
      fontSize: 15,
      color: '#333',
      marginBottom: 5,
    },

    aiHint: {
      fontSize: 13,
      color: '#777',
      marginTop: 8,
    },

    dropdown: {
      minHeight: 55,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 12,
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
    },

    dropdownText: {
      fontSize: 16,
      color: '#222',
      flex: 1,
    },

    dropdownArrow: {
      fontSize: 14,
      color: '#666',
      marginLeft: 10,
    },

    optionsBox: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      marginTop: 5,
      backgroundColor: '#fff',
      overflow: 'hidden',
    },

    option: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },

    optionText: {
      fontSize: 16,
      color: '#333',
    },

    selectedOptionText: {
      fontWeight: 'bold',
      color: '#007AFF',
    },

    severityRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },

    severityButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
      alignItems: 'center',
    },

    selectedSeverity: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },

    severityText: {
      fontSize: 14,
      color: '#444',
    },

    selectedSeverityText: {
      color: '#fff',
      fontWeight: 'bold',
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

    submitButton: {
      backgroundColor: '#007AFF',
      minHeight: 55,
      padding: 17,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      marginTop: 5,
    },

    submitButtonDisabled: {
      opacity: 0.6,
    },

    submitText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: 'bold',
    },
  });