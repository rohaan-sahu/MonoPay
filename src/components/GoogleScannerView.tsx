import { CameraView } from 'expo-camera';

const result = await CameraView.launchScanner({ barcodeTypes: ['qr'] });
// result.data = "solana:ADDRESS?..."