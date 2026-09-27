import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const OPENWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export default function HomeScreen() {
  const router = useRouter();

  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [weather, setWeather] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const getLocationAndWeather = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Ask user for location permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission was denied.');
        setLoading(false);
        return;
      }

      // 2. Get current GPS location
      const currentLocation =
        await Location.getCurrentPositionAsync({});

      setLocation(currentLocation);

      const latitude =
        currentLocation.coords.latitude;

      const longitude =
        currentLocation.coords.longitude;

      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);

      // 3. Call OpenWeather
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch weather data'
        );
      }

      const data = await response.json();

      console.log('Weather:', data);

      // 4. Save weather data
      setWeather(data);
    } catch (err) {
      console.error(err);
      setError(
        'Unable to fetch location or weather.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>

        <TouchableOpacity
          style={styles.userButton}
          onPress={() => router.push('/signup')}
        >
          <Ionicons
            name="person-circle-outline"
            size={42}
            color="black"
          />
        </TouchableOpacity>

        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Getting your location...
        </Text>

      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>

        <TouchableOpacity
          style={styles.userButton}
          onPress={() => router.push('/signup')}
        >
          <Ionicons
            name="person-circle-outline"
            size={42}
            color="black"
          />
        </TouchableOpacity>

        <Text style={styles.error}>
          {error}
        </Text>

      </View>
    );
  }

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.userButton}
        onPress={() => router.push('/signup')}
      >
        <Ionicons
          name="person-circle-outline"
          size={42}
          color="black"
        />
      </TouchableOpacity>

      <Text style={styles.title}>
        Welcome to Civik
      </Text>

      {location && (
        <View style={styles.card}>

          <Text style={styles.heading}>
            Your Location
          </Text>

          <Text>
            Latitude: {location.coords.latitude}
          </Text>

          <Text>
            Longitude: {location.coords.longitude}
          </Text>

        </View>
      )}

      {weather && (
        <View style={styles.card}>

          <Text style={styles.heading}>
            {weather.name}
          </Text>

          <Text style={styles.temperature}>
            {Math.round(weather.main.temp)}°C
          </Text>

          <Text>
            {weather.weather[0].description}
          </Text>

          <Text>
            Feels like{' '}
            {Math.round(
              weather.main.feels_like
            )}°C
          </Text>

          <Text>
            Humidity: {weather.main.humidity}%
          </Text>

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  userButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
  },

  card: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
  },

  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  temperature: {
    fontSize: 42,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },

  error: {
    fontSize: 16,
    textAlign: 'center',
  },
});