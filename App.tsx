import React from 'react';
import { Platform, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import VideoPlayer from './src/components/VideoPlayer.web';

/**
 * Main application component.
 * Renders the VideoPlayer and related UI elements.
 */
export default function App() {
  // Video and subtitle source URLs.
  const videoSrc = '/sample.mp4'; 
  const assSrc = '/subtitles/subtitles.ass';
  // Array of font URLs for subtitle rendering.
  const fonts = ['/fonts/NotoSansDevanagari-Regular.ttf']; 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text
          style={[
            styles.title, 
            // Add top margin on web to account for the absence of a native status bar.
            Platform.OS === 'web' && styles.titleWeb
          ]}
        >
          React Native + Expo (Web & Native) — ASS Subtitles Demo
        </Text>

        <VideoPlayer
          videoSrc={videoSrc}
          assSrc={assSrc}
          fonts={fonts}
        />
        <Text style={styles.instructions}>
          Try pause/play, drag the seek bar both directions, and toggle subtitles.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
  },
  content: {
    padding: 16,
    gap: 16, 
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  titleWeb: {
    marginTop: 16,
  },
  instructions: {
    color: '#9aa0a6',
    fontSize: 14,
  },
});
