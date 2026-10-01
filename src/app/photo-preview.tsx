import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

export default function PhotoPreviewScreen() {
  const router = useRouter();

  const { photoUri } = useLocalSearchParams<{
    photoUri?: string;
  }>();

  // Expo Router automatically decodes the URL parameter once.
  // We decode it one more time to restore the original file URI.
  const decodedPhotoUri = photoUri
    ? decodeURIComponent(photoUri)
    : null;

  const [validating, setValidating] =
    useState(false);

  const [validationResult, setValidationResult] =
    useState<any>(null);

  console.log(
    'PREVIEW PHOTO URI:',
    decodedPhotoUri
  );

  // --------------------------------
  // Retake
  // --------------------------------

  const handleRetake = () => {
    if (validating) {
      return;
    }

    router.replace('/post');
  };

  // --------------------------------
  // Validate Image
  // --------------------------------

  const handleValidate = async () => {
  if (!decodedPhotoUri) {
    Alert.alert(
      'Error',
      'No photo available.'
    );

    return;
  }

  try {
    setValidating(true);
    setValidationResult(null);

    console.log(
      'Starting image validation...'
    );

    // --------------------------------
    // Create Expo File object
    // --------------------------------

    const file = new File(decodedPhotoUri);

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

    // --------------------------------
    // Check whether file exists
    // --------------------------------

    if (!file.exists) {
      throw new Error(
        'The photo file could not be found.'
      );
    }

    if (!file.size || file.size <= 0) {
      throw new Error(
        'The photo file is empty.'
      );
    }

    // --------------------------------
    // Create FormData
    // --------------------------------

    console.log(
      'Creating FormData...'
    );

    const formData =
      new FormData();

    /*
     * IMPORTANT:
     *
     * Do NOT convert the image to Base64.
     * Do NOT create a Blob manually.
     *
     * Expo's File object can be placed
     * directly into FormData.
     */

    formData.append(
      'image',
      file as any
    );

    console.log(
      'Image added to FormData.'
    );

    // --------------------------------
    // Send image to backend
    // --------------------------------

    console.log(
      'Sending image to Civik backend...'
    );

    const response = await fetch(
      'http://192.168.1.30:5000/api/image/validate',
      {
        method: 'POST',

        body: formData,

        headers: {
          Accept:
            'application/json',
        },
      }
    );

    console.log(
      'Backend status:',
      response.status
    );

    // --------------------------------
    // Read backend response
    // --------------------------------

    const data =
      await response.json();

    console.log(
      'Validation result:',
      data
    );

    // --------------------------------
    // Backend error
    // --------------------------------

    if (!response.ok) {
      Alert.alert(
        'Validation Error',
        data.message ||
          'Unable to validate the image.'
      );

      return;
    }

    // --------------------------------
    // Save validation result
    // --------------------------------

    setValidationResult(data);

    // --------------------------------
    // Validation failed
    // --------------------------------

    if (!data.valid) {
      Alert.alert(
        'Civic Issue Not Detected',
        data.reason ||
          'This image does not appear to show a reportable civic issue.'
      );

      return;
    }

    // --------------------------------
    // Validation passed
    // --------------------------------

    console.log(
      'Civic issue detected successfully.'
    );

    console.log(
      'Issue type:',
      data.issueType
    );

    console.log(
      'Confidence:',
      data.confidence
    );

    console.log(
      'Severity:',
      data.severity
    );

    Alert.alert(
      'Civic Issue Detected',
      data.reason ||
        'This image appears to show a reportable civic issue.'
    );

  } catch (error) {
    console.error(
      'Image validation error:',
      error
    );

    Alert.alert(
      'Validation Error',
      error instanceof Error
        ? error.message
        : 'Something went wrong while validating the image.'
    );

  } finally {
    setValidating(false);
  }
};

  // --------------------------------
  // Continue to Report Form
  // --------------------------------

  const handleUpload = () => {
    if (!decodedPhotoUri) {
      Alert.alert(
        'Error',
        'No photo available.'
      );

      return;
    }

    // Upload cannot continue unless
    // Gemini validation passed.
    if (!validationResult?.valid) {
      return;
    }

    const encodedUri =
      encodeURIComponent(
        encodeURIComponent(
          decodedPhotoUri
        )
      );

    router.push({
      pathname: '/report-form',

      params: {
        photoUri: encodedUri,

        issueType:
          validationResult.issueType,

        confidence:
          String(
            validationResult.confidence
          ),

        severity:
          validationResult.severity,
      },
    });
  };

  // --------------------------------
  // Upload state
  // --------------------------------

  const uploadEnabled =
    validationResult?.valid === true &&
    !validating;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Preview
      </Text>

      {decodedPhotoUri ? (
        <Image
          source={{
            uri: decodedPhotoUri,
          }}
          style={styles.image}
          onLoad={() => {
            console.log(
              'IMAGE LOADED SUCCESSFULLY'
            );
          }}
          onError={(error) => {
            console.log(
              'IMAGE ERROR:',
              error.nativeEvent.error
            );
          }}
        />
      ) : (
        <View
          style={
            styles.noPhotoContainer
          }
        >
          <Text
            style={
              styles.noPhotoText
            }
          >
            No photo available
          </Text>
        </View>
      )}

      {/* -------------------------------- */}
      {/* Validation Loading */}
      {/* -------------------------------- */}

      {validating && (
        <View
          style={
            styles.validationContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.validationText
            }
          >
            Analyzing image...
          </Text>

          <Text
            style={
              styles.validationSubtext
            }
          >
            Checking whether this photo
            shows a genuine civic issue.
          </Text>
        </View>
      )}

      {/* -------------------------------- */}
      {/* Validation Passed */}
      {/* -------------------------------- */}

      {!validating &&
        validationResult?.valid === true && (
          <View
            style={
              styles.successContainer
            }
          >
            <Text
              style={
                styles.successTitle
              }
            >
              ✓ Civic issue detected
            </Text>

            <Text
              style={styles.resultText}
            >
              Type:{' '}
              {validationResult.issueType}
            </Text>

            <Text
              style={styles.resultText}
            >
              Confidence:{' '}
              {Math.round(
                validationResult.confidence *
                  100
              )}
              %
            </Text>

            <Text
              style={styles.resultText}
            >
              Severity:{' '}
              {validationResult.severity}
            </Text>

            <Text
              style={styles.reasonText}
            >
              {validationResult.reason}
            </Text>
          </View>
        )}

      {/* -------------------------------- */}
      {/* Validation Failed */}
      {/* -------------------------------- */}

      {!validating &&
        validationResult &&
        validationResult.valid === false && (
          <View
            style={
              styles.failureContainer
            }
          >
            <Text
              style={
                styles.failureTitle
              }
            >
              ✕ Civic issue not detected
            </Text>

            <Text
              style={styles.reasonText}
            >
              {validationResult.reason ||
                'The image does not appear to show a reportable civic issue.'}
            </Text>
          </View>
        )}

      {/* -------------------------------- */}
      {/* Buttons */}
      {/* -------------------------------- */}

      <View
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={[
            styles.button,
            styles.retakeButton,
            validating &&
              styles.disabledButton,
          ]}
          onPress={handleRetake}
          disabled={validating}
        >
          <Text
            style={styles.buttonText}
          >
            Retake
          </Text>
        </TouchableOpacity>

        {/* Validate */}

        {!validationResult?.valid && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.validateButton,
              validating &&
                styles.disabledButton,
            ]}
            onPress={handleValidate}
            disabled={validating}
          >
            {validating ? (
              <ActivityIndicator
                color="white"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Validate
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Upload */}

        {validationResult?.valid && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.uploadButton,
              !uploadEnabled &&
                styles.disabledButton,
            ]}
            onPress={handleUpload}
            disabled={!uploadEnabled}
          >
            <Text
              style={styles.buttonText}
            >
              Upload
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },

  image: {
    width: '100%',
    height: 450,
    borderRadius: 15,
    resizeMode: 'contain',
    backgroundColor: '#eee',
  },

  noPhotoContainer: {
    width: '100%',
    height: 450,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 15,
  },

  noPhotoText: {
    fontSize: 18,
    color: '#666',
  },

  validationContainer: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },

  validationText: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },

  validationSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },

  successContainer: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },

  successTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  resultText: {
    fontSize: 15,
    marginTop: 3,
  },

  reasonText: {
    fontSize: 14,
    marginTop: 8,
    color: '#555',
  },

  failureContainer: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#ffebee',
  },

  failureTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },

  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  retakeButton: {
    backgroundColor: '#777',
  },

  validateButton: {
    backgroundColor: '#007AFF',
  },

  uploadButton: {
    backgroundColor: '#28a745',
  },

  disabledButton: {
    opacity: 0.45,
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});