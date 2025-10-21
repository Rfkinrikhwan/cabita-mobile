import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { BackHandler, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const webViewRef: any = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handler untuk menerima pesan dari WebView
  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'DOWNLOAD_PDF') {
        await downloadPDF(message.data, message.filename);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Fungsi untuk download PDF
  const downloadPDF = async (base64Data: string, filename: string) => {
    try {
      // Remove base64 prefix jika ada
      const base64String = base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data;

      // Path tempat file akan disimpan
      const fileUri = FileSystem.documentDirectory + filename;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Gunakan sharing dialog untuk save file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download PDF. Please try again.');
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <WebView
      ref={webViewRef}
      style={styles.container}
      source={{ uri: 'https://admin.cabita.id' }}
      onNavigationStateChange={(navState) => {
        setCanGoBack(navState.canGoBack);
      }}
      onMessage={handleWebViewMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});