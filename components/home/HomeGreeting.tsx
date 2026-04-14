import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '@/store/useStore';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeGreeting() {
  const username = useUserStore((s) => s.username);

  return (
    <View style={styles.greetingSection}>
      <Text style={styles.greetingTitle}>
        {getGreeting()}, {username ?? 'Champ'}! 👋
      </Text>
      <Text style={styles.greetingSubtitle}>
        Your daily exercise routine awaits.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingSection: {
    marginBottom: 28,
  },
  greetingTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
  },
  greetingSubtitle: {
    color: "#768490",
    fontSize: 16,
  },
});
