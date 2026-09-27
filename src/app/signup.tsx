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
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [loading, setLoading] = useState(false);

  const formatIndianPhoneNumber = (
    phoneNumber: string
  ) => {
    const cleanedPhone =
      phoneNumber.replace(/\D/g, '');

    if (cleanedPhone.length === 10) {
      return `+91${cleanedPhone}`;
    }

    if (
      cleanedPhone.length === 12 &&
      cleanedPhone.startsWith('91')
    ) {
      return `+${cleanedPhone}`;
    }

    if (
      phoneNumber.startsWith('+') &&
      cleanedPhone.length >= 10
    ) {
      return `+${cleanedPhone}`;
    }

    return phoneNumber.trim();
  };

  const handleSignup = async () => {
    if (
      !name ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Error',
        'Please fill all fields.'
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Error',
        'Passwords do not match.'
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Error',
        'Password must be at least 6 characters.'
      );

      return;
    }

    const formattedPhone =
      formatIndianPhoneNumber(phone);

    if (
      !formattedPhone.startsWith('+91') ||
      formattedPhone.length !== 13
    ) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 10-digit Indian phone number.'
      );

      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
          phone: formattedPhone,
          password: password,
        });

      if (error) {
        console.error(
          'Signup error:',
          error
        );

        Alert.alert(
          'Signup failed',
          error.message
        );

        return;
      }

      if (!data.user) {
        Alert.alert(
          'Signup failed',
          'Could not create your account.'
        );

        return;
      }

      console.log(
        'Auth user created:',
        data.user.id
      );

      router.push({
        pathname: '/verify-otp',
        params: {
          phone: formattedPhone,
          name: name.trim(),
        },
      });

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Civik
      </Text>

      <Text style={styles.title}>
        Create Account
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text>
          Already have an account?
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push('/login')
          }
        >
          <Text style={styles.link}>
            {' '}Login
          </Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 30,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },

  button: {
    height: 55,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },

  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});