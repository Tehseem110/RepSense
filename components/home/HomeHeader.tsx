import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Logo from "@/assets/images/icon.png";

export default function HomeHeader() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image source={Logo as any} style={styles.logo} />
        <Text style={styles.logoText}>RepSense</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/profile')}>
          <Image
            source={require("@/assets/images/dummyProfile.png")}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoText: {
    color: "#39C5B7",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2b3640",
  },
});
