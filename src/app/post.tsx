import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import { useRouter } from 'expo-router';

import { useState } from 'react';

import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PostScreen() {
  const router = useRouter();

  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const [camera, setCamera] =
    useState<CameraView | null>(
      null
    );

  // ========================================
  // CAMERA PERMISSION LOADING
  // ========================================

  if (!permission) {
    return <View />;
  }

  // ========================================
  // CAMERA PERMISSION
  // ========================================

  if (!permission.granted) {
    return (
      <View
        style={
          styles.permissionContainer
        }
      >
        <Text
          style={
            styles.permissionText
          }
        >
          Civik needs camera access to report civic issues.
        </Text>

        <Button
          title="Allow Camera"
          onPress={
            requestPermission
          }
        />
      </View>
    );
  }

  // ========================================
  // TAKE PHOTO
  // ========================================

  const takePicture =
    async () => {
      if (!camera) {
        console.log(
          'Camera is not ready'
        );

        return;
      }

      try {
        const photo =
          await camera.takePictureAsync();

        if (!photo?.uri) {
          console.log(
            'No photo URI received'
          );

          return;
        }

        console.log(
          'PHOTO URI:',
          photo.uri
        );

        /*
         * Encode twice because Expo Router
         * decodes the route parameter once
         * automatically.
         */

        const encodedUri =
          encodeURIComponent(
            encodeURIComponent(
              photo.uri
            )
          );

        const capturedAt =
          new Date().toISOString();

        router.push({
          pathname:
            '/photo-preview',

          params: {
            photoUri:
              encodedUri,

            capturedAt,
          },
        });
      } catch (error) {
        console.error(
          'Error taking photo:',
          error
        );
      }
    };

  // ========================================
  // UI
  // ========================================

  return (
    <View
      style={styles.container}
    >
      <CameraView
        style={styles.camera}
        facing="back"
        ref={(ref) =>
          setCamera(ref)
        }
      />

      <View
        style={
          styles.bottomContainer
        }
      >
        <TouchableOpacity
          style={
            styles.captureButton
          }
          onPress={
            takePicture
          }
          activeOpacity={0.8}
        >
          <View
            style={
              styles.captureButtonInner
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    camera: {
      flex: 1,
    },

    bottomContainer: {
      position: 'absolute',
      bottom: 40,
      width: '100%',
      alignItems: 'center',
    },

    captureButton: {
      width: 75,
      height: 75,
      borderRadius: 40,
      backgroundColor:
        'white',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor:
        'red',
    },

    permissionContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      padding: 30,
    },

    permissionText: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
  });