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

export default function LoginScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    if (!name || !phone || !password) {
      Alert.alert(
        'Error',
        'Please fill all fields.'
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

      console.log(
        'Attempting login with phone:',
        formattedPhone
      );

      const { data, error } =
        await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password: password,
        });

      if (error) {
        console.error(
          'Login error:',
          error
        );

        Alert.alert(
          'Login failed',
          error.message
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Login failed',
          'No session was created.'
        );
        return;
      }

      console.log(
        'Login successful'
      );

      console.log(
        'User ID:',
        data.user?.id
      );

      router.replace('/');

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
      <Text style={styles.logo}>Civik</Text>

      <Text style={styles.title}>
        Welcome Back
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

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <Text>
          Don't have an account?
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.link}>
            {' '}Sign Up
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

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },

  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});