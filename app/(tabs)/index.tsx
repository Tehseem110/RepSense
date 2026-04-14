import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="running" size={24} color="#16b4cc" />
            <Text style={styles.logoText}>RepSense</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Good Morning, User!</Text>
          <Text style={styles.greetingSubtitle}>Your app exercise routine.</Text>
        </View>

        {/* Top Tiles */}
        <View style={styles.topTilesContainer}>
          {/* Calories Tile */}
          <View style={[styles.tile, styles.caloriesTile]}>
            <Text style={styles.tileTitle}>Calories Burned</Text>
            <View style={styles.circleContainer}>
              <View style={styles.progressRing}>
                <View style={styles.progressInner}>
                  <Text style={styles.calorieValue}>345</Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Tiles */}
          <View style={styles.rightTiles}>
            <View style={[styles.tile, styles.smallTile, { marginBottom: 16 }]}>
              <Ionicons name="timer-outline" size={36} color="#6ae094" />
              <Text style={styles.smallTileText}>Active Time</Text>
            </View>
            <View style={[styles.tile, styles.smallTile, styles.durationTile]}>
              <Text style={styles.durationText}>01:12:45</Text>
              <View style={styles.durationIconWrapper}>
                <Ionicons name="barbell" size={16} color="#1b242a" />
              </View>
            </View>
          </View>
        </View>

        {/* Activity Meter */}
        <View style={styles.activityMeterCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>RepSense Activity Meter</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </View>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        {/* History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Daily workout history</Text>
            <Text style={styles.historyMini}>Mini</Text>
          </View>
          <View style={styles.historyDaysRow}>
            {[
               { day: 'Sun', date: '3', sub: 'kon', id: '1' },
               { day: 'Mon', date: '12', sub: 'Ties', id: '2' },
               { day: 'Wed', date: '13', sub: '', id: '3' },
               { day: 'Wed', date: '23', sub: 'Sat', id: '4' },
               { day: 'Thu', date: '23', sub: 'Son', id: '5' },
            ].map((item, index) => (
              <View key={item.id} style={styles.historyDayTile}>
                 <Text style={styles.historyDayText}>{item.day}</Text>
                 <Text style={styles.historyDateText}>{item.date}</Text>
                 {item.sub ? <Text style={styles.historySubText}>{item.sub}</Text> : null}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1316',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#28bbce',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    position: 'relative',
    marginRight: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f85858',
    borderWidth: 1,
    borderColor: '#0c1316',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2b3640',
  },
  greetingSection: {
    marginBottom: 28,
  },
  greetingTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  greetingSubtitle: {
    color: '#768490',
    fontSize: 16,
  },
  topTilesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tile: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 16,
  },
  caloriesTile: {
    flex: 1.1,
    marginRight: 16,
    alignItems: 'center',
  },
  tileTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
  },
  circleContainer: {
    marginVertical: 4,
    marginBottom: 10,
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: '#73e5a5',
    borderLeftColor: '#16b4cc',
    borderBottomColor: '#16b4cc',
    borderRightColor: '#16b4cc',
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInner: {
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
  },
  calorieValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  calorieUnit: {
    color: '#768490',
    fontSize: 14,
    marginTop: -4,
  },
  rightTiles: {
    flex: 0.9,
  },
  smallTile: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallTileText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  durationTile: {
    paddingVertical: 20,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  durationIconWrapper: {
    backgroundColor: '#73e5a5',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityMeterCard: {
    backgroundColor: '#18242a',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 24,
    backgroundColor: '#1b3237',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#bfe85c',
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#73e5a5',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: {
    color: '#0c1316',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyMini: {
    color: '#28bbce',
    fontSize: 13,
    fontWeight: '600',
  },
  historyDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDayTile: {
    backgroundColor: '#18242a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  historyDayText: {
    color: '#768490',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  historyDateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historySubText: {
    color: '#556673',
    fontSize: 11,
    fontWeight: '500',
  },
});
