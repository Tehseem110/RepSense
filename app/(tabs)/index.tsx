import React from "react";
import { StyleSheet, TouchableOpacity, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "@/components/home/HomeHeader";
import HomeGreeting from "@/components/home/HomeGreeting";
import HomeTopTiles from "@/components/home/HomeTopTiles";
import HomeActivityMeter from "@/components/home/HomeActivityMeter";
import HomeHistory from "@/components/home/HomeHistory";
import HomeWeightCard from "@/components/home/HomeWeightCard";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HomeHeader />
        <HomeGreeting />
        <HomeTopTiles />
        <HomeActivityMeter />

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        <HomeWeightCard />

        <HomeHistory />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1316",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: "#73e5a5",
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  startButtonText: {
    color: "#0c1316",
    fontSize: 18,
    fontWeight: "bold",
  },
});
