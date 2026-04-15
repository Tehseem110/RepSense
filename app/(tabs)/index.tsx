import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "@/components/home/HomeHeader";
import HomeGreeting from "@/components/home/HomeGreeting";
import HomeTopTiles from "@/components/home/HomeTopTiles";
import HomeActivityMeter from "@/components/home/HomeActivityMeter";
import HomeHistory from "@/components/home/HomeHistory";
import HomeWeightCard from "@/components/home/HomeWeightCard";
import WorkoutTrackerModal from "@/components/home/WorkoutTrackerModal";

export default function HomeScreen() {
  const [workoutOpen, setWorkoutOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HomeHeader />
        <HomeGreeting />
        <HomeTopTiles />
        <HomeActivityMeter />

        {/* Start Workout Button */}
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => setWorkoutOpen(true)}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        {/* Workout Tracker Modal */}
        <WorkoutTrackerModal
          visible={workoutOpen}
          onClose={() => setWorkoutOpen(false)}
        />

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
