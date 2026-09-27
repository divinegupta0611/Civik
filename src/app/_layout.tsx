import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="info"
        options={{
          title: 'Info',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="information-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="notifications"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />


      {/* Hide these routes from the bottom tab bar */}
      <Tabs.Screen
        name="photo-preview"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="report-form"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}