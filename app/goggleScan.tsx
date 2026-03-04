import React, { useState, useEffect,useRef } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { authenticateUser } from '@/services/localAuthServices';
import { Ionicons } from '@expo/vector-icons';
 import { CameraView } from 'expo-camera';

export default function GoogleScanScreen() {
  const [isScanned, setIsScanneded] = useState(false);
  //const hasScanned = useRef<boolean>(false);
  //const [uri, setUri] = useState<string | null>(null);

  const handleScan = async () => {
    const subscription = CameraView.onModernBarcodeScanned(({ data }) => {
        subscription.remove();
        CameraView.dismissScanner();
        console.log(data); // "solana:ADDRESS?..."
    });
    const result = await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    CameraView.dismissScanner();
    console.log(result);
    setIsScanneded(true)
  };

//   // Optional: Auto-prompt on mount
//   useEffect(() => { handleScan(); }, []);

//   if (isScanned) {

//     return (
//       <View >
//         <Text>Scan completed. Result console logged. Redered from 'app/googleScan.tsx'</Text>
//       </View>
//     );
//   }

  return (
    <View style={{justifyContent:"center", alignItems:"center"}}>
      <Ionicons name = 'camera-outline' />
      <Text>Click here to scan</Text>
      <Button title="Scan" onPress={handleScan} />
    </View>
  );
}