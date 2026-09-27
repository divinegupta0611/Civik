import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  console.log('PREVIEW PHOTO URI:', decodedPhotoUri);

  const handleRetake = () => {
    router.replace('/post');
  };

  const handleUpload = () => {
    if (!decodedPhotoUri) {
      return;
    }

    const encodedUri = encodeURIComponent(
      encodeURIComponent(decodedPhotoUri)
    );

    router.push({
      pathname: '/report-form',
      params: {
        photoUri: encodedUri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview</Text>

      {decodedPhotoUri ? (
        <Image
          source={{ uri: decodedPhotoUri }}
          style={styles.image}
          onLoad={() => {
            console.log('IMAGE LOADED SUCCESSFULLY');
          }}
          onError={(error) => {
            console.log(
              'IMAGE ERROR:',
              error.nativeEvent.error
            );
          }}
        />
      ) : (
        <View style={styles.noPhotoContainer}>
          <Text style={styles.noPhotoText}>
            No photo available
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retakeButton]}
          onPress={handleRetake}
        >
          <Text style={styles.buttonText}>
            Retake
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handleUpload}
        >
          <Text style={styles.buttonText}>
            Upload
          </Text>
        </TouchableOpacity>
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
    height: 500,
    borderRadius: 15,
    resizeMode: 'contain',
    backgroundColor: '#eee',
  },

  noPhotoContainer: {
    width: '100%',
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 15,
  },

  noPhotoText: {
    fontSize: 18,
    color: '#666',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
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

  uploadButton: {
    backgroundColor: '#007AFF',
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});