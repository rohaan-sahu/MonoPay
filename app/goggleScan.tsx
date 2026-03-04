import React, { useState } from 'react';
import { Alert,View, Text, Button, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';


export default function GoogleScanScreen() {
  const [isScanned, setIsScanneded] = useState(false);
  //const hasScanned = useRef<boolean>(false);
  //const [uri, setUri] = useState<string | null>(null);

  const handleScan = async () => {
    const subscription = CameraView.onModernBarcodeScanned(async ({ data }) => {
        subscription.remove();
        CameraView.dismissScanner();
        console.log(data);

        if (data.startsWith('solana')){
            // const canOpen = await Linking.canOpenURL(data);
            // if (canOpen) {
            //     console.log('Wallet present: ',canOpen);
            // } else {
            //     console.log('No wallet');
            //     Alert.alert('No Wallet', 'Please install Phantom or Solflare');
            // }

            await Linking.openURL(data);
        };
    });
    const result = await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    CameraView.dismissScanner();
    console.log(result);
    setIsScanneded(true)
  };

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