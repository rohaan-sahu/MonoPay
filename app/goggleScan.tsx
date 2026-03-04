import React, { useState } from 'react';
import { Alert,View, Text, Button, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView,Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';


export default function GoogleScanScreen() {
  const [isScanned, setIsScanneded] = useState(false);
  //const hasScanned = useRef<boolean>(false);
  //const [uri, setUri] = useState<string | null>(null);

  const handleScan = async () => {
    const subscription = CameraView.onModernBarcodeScanned(async ({ data }) => {
        subscription.remove();
        CameraView.dismissScanner();
        console.log(data);

        if (data.startsWith('solana:')){
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

  };

  const scanFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    
    if (!result.canceled) {
        const scanned = await Camera.scanFromURLAsync(result.assets[0].uri,['qr']);
        const data = scanned[0].data;
        console.log(scanned[0].data); // your Solana Pay URL

        if (data.startsWith('solana:')) {
            await Linking.openURL(data);
        }
    }
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
      <View>
        <Ionicons name = 'camera-outline' />
        <Text>Click here to scan</Text>
        <Button title="Scan" onPress={handleScan} />
      </View>
      <View>
        <Ionicons name = 'images-sharp' />
        <Text>Click here to scan from Photo Gallary</Text>
        <Button title="Screenshot" onPress={scanFromGallery} />
      </View>
    </View>
  );
}