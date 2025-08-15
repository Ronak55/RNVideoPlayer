import React, { useEffect, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview'; // Always import for native
import { Video } from 'expo-av';

type Props = {
  videoSrc: string; // can be remote or from public folder
  assSrc: string;   // remote or public folder
  fonts?: string[];
};

// Paths for the libass-wasm worker files
const OCTOPUS_JS = 'ass/subtitles-octopus.js';
const WORKER_URL = 'ass/subtitles-octopus-worker.js';
const LEGACY_WORKER_URL = 'ass/subtitles-octopus-worker.wasm';

export default function VideoPlayer({ videoSrc, assSrc, fonts = [] }: Props) {
  // Native (iOS/Android) path: Use WebView with injected HTML
  if (Platform.OS !== 'web') {
    const htmlContent = `
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
        <style>
          html, body, #wrap { margin:0; height:100%; background:#000; }
          #wrap { position:relative; }
          video { width:100%; height:100%; object-fit:contain; display:block; background:#000; }
          #toggle { position:absolute; right:12px; bottom:12px; z-index:10; padding:6px 10px; background:rgba(0,0,0,.6); color:#fff; border-radius:6px; font-family:system-ui,-apple-system,Segoe UI,Roboto; }
        </style>
      </head>
      <body>
        <div id="wrap">
          <video id="vid" controls crossorigin="anonymous" playsinline>
            <source src="${videoSrc}" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <button id="toggle">Subtitles: ON</button>
        </div>
        <script src="${OCTOPUS_JS}"></script>
        <script>
          const WORKER_URL = "${WORKER_URL}";
          const LEGACY_URL = "${LEGACY_WORKER_URL}";
          const ASS_URL = "${assSrc}";
          const FONTS = ${JSON.stringify(fonts)};
          const vid = document.getElementById('vid');
          let instance = null;

          function attachSubtitles() {
            if (!window.SubtitlesOctopus) { console.error('SubtitlesOctopus not loaded'); return; }
            instance = new window.SubtitlesOctopus({
              video: vid,
              subUrl: ASS_URL,
              fonts: FONTS,
              workerUrl: WORKER_URL,
              legacyWorkerUrl: LEGACY_URL
            });
            window.addEventListener('resize', () => instance && instance.resize());
          }
          
          vid.addEventListener('loadedmetadata', attachSubtitles); // Attach when video metadata is loaded

          // Bonus: Ensure subtitle sync on play/pause
          vid.addEventListener('play', () => instance && instance.setIsPaused(false));
          vid.addEventListener('pause', () => instance && instance.setIsPaused(true));

          const btn = document.getElementById('toggle');
          let on = true;
          btn.onclick = () => {
            on = !on;
            if (!instance) return;
            if (on) instance.setTrackByUrl(ASS_URL);
            else instance.freeTrack();
            btn.textContent = 'Subtitles: ' + (on ? 'ON' : 'OFF');
          };
        </script>
      </body>
      </html>
    `;

    return (
      <View style={styles.nativePlayerContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess={true} // Crucial for loading local files (like the worker and fonts)
          allowUniversalAccessFromFileURLs={true} // For local file access in the WebView
          mixedContentMode="always" // Allows mixed HTTP/HTTPS content
        />
      </View>
    );
  }

  // Web path: Use <video> directly with libass-wasm
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/libass-wasm@4.1.0/dist/js/subtitles-octopus.js'; // Using CDN for simplicity
    script.async = true;
    script.onload = () => {
      const SubtitlesOctopus = (window as any).SubtitlesOctopus;
      if (!SubtitlesOctopus || !videoRef.current) {
        console.error('SubtitlesOctopus failed to load or videoRef missing');
        return;
      }
      const instance = new SubtitlesOctopus({
        video: videoRef.current,
        subUrl: assSrc,
        fonts: fonts,
        workerUrl: WORKER_URL,
        legacyWorkerUrl: LEGACY_WORKER_URL
      });

      // Bonus: Ensure subtitle sync on play/pause
      videoRef.current.addEventListener('play', () => instance.setIsPaused(false));
      videoRef.current.addEventListener('pause', () => instance.setIsPaused(true));
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
      document.body.removeChild(script);
    };
  }, [assSrc, fonts]);

  return (
    <div style={styles.webPlayerContainer}>
      <video ref={videoRef} controls crossOrigin="anonymous" style={styles.videoElement}>
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

const styles = StyleSheet.create({
  nativePlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webPlayerContainer: {
    width: '100%',
    height: '60%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});
