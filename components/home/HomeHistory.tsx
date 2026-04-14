import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeHistory() {
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Daily workout history</Text>
        <Text style={styles.historyMini}>Mini</Text>
      </View>
      <View style={styles.historyDaysRow}>
        {[
          { day: "Sun", date: "3", sub: "kon", id: "1" },
          { day: "Mon", date: "12", sub: "Ties", id: "2" },
          { day: "Wed", date: "13", sub: "", id: "3" },
          { day: "Wed", date: "23", sub: "Sat", id: "4" },
          { day: "Thu", date: "23", sub: "Son", id: "5" },
        ].map((item) => (
          <View key={item.id} style={styles.historyDayTile}>
            <Text style={styles.historyDayText}>{item.day}</Text>
            <Text style={styles.historyDateText}>{item.date}</Text>
            {item.sub ? (
              <Text style={styles.historySubText}>{item.sub}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  historyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  historyMini: {
    color: "#28bbce",
    fontSize: 13,
    fontWeight: "600",
  },
  historyDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyDayTile: {
    backgroundColor: "#18242a",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  historyDayText: {
    color: "#768490",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  historyDateText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  historySubText: {
    color: "#556673",
    fontSize: 11,
    fontWeight: "500",
  },
});
