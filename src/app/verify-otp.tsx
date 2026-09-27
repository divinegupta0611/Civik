import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { supabase } from '../../supabase';

export default function VerifyOtpScreen() {
  const router = useRouter();

  const {
    phone,
    name,
  } = useLocalSearchParams<{
    phone?: string;
    name?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (!phone) {
      Alert.alert(
        'Error',
        'Phone number is missing.'
      );

      return;
    }

    if (!name) {
      Alert.alert(
        'Error',
        'Name is missing.'
      );

      return;
    }

    if (!otp || otp.length !== 6) {
      Alert.alert(
        'Error',
        'Please enter the 6-digit OTP.'
      );

      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.verifyOtp({
          phone: phone,
          token: otp,
          type: 'sms',
        });

      if (error) {
        console.error(
          'OTP verification error:',
          error
        );

        Alert.alert(
          'Verification failed',
          error.message
        );

        return;
      }

      console.log(
        'OTP verification successful'
      );

      if (!data.user) {
        Alert.alert(
          'Verification failed',
          'No user was returned.'
        );

        return;
      }

      if (!data.session) {
        Alert.alert(
          'Verification failed',
          'No authenticated session was created.'
        );

        return;
      }

      console.log(
        'Authenticated user:',
        data.user.id
      );

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name,
        });

      if (profileError) {
        console.error(
          'Profile creation error:',
          profileError
        );

        Alert.alert(
          'Profile Error',
          profileError.message
        );

        return;
      }

      console.log(
        'Profile created successfully'
      );

      Alert.alert(
        'Success',
        'Your account has been created successfully!'
      );

      router.replace('/');

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Something went wrong while verifying the OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone) {
      Alert.alert(
        'Error',
        'Phone number is missing.'
      );

      return;
    }

    try {
      setResending(true);

      const { error } =
        await supabase.auth.resend({
          type: 'sms',
          phone: phone,
        });

      if (error) {
        console.error(
          'Resend OTP error:',
          error
        );

        Alert.alert(
          'Could not resend OTP',
          error.message
        );

        return;
      }

      Alert.alert(
        'OTP Sent',
        'A new OTP has been sent to your phone.'
      );

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Something went wrong while resending the OTP.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Civik
      </Text>

      <Text style={styles.title}>
        Verify Your Phone
      </Text>

      <Text style={styles.subtitle}>
        We sent a 6-digit OTP to
      </Text>

      <Text style={styles.phone}>
        {phone}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            Verify OTP
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendOtp}
        disabled={resending}
      >
        {resending ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.resendText}>
            Resend OTP
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: 'white',
  },

  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },

  phone: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
  },

  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 24,
    letterSpacing: 8,
    marginBottom: 20,
  },

  button: {
    height: 55,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },

  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },

  resendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});