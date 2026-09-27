import { StyleSheet, Text, View } from 'react-native';

export default function InfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Civik</Text>

      <Text style={styles.description}>
        Civik helps people report civic issues in their area.
      </Text>
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

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    textAlign: 'center',
  },
});