import {
  BarcodeScanningResult,
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { View,Text, Button } from "react-native";
import { scanScreenStyles as s } from "@/styles/scanScreen";
import { useEffect, useRef, useState } from "react";

export default function ScannerCamera() {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const hasScanned = useRef<boolean>(false);
    const [uri, setUri] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>("back");

    const mode:CameraMode = "picture";

    // Scan QR code
    const takeUri = async (res:BarcodeScanningResult) => {
    if (!hasScanned.current){
        setUri(res.data);
        console.log("data: ",res.data);
        hasScanned.current = true;
    }
    };

    useEffect(() => {
        console.log("URI: ",uri);
        setTimeout(() => {
            console.log("Uri cleared after 5 seconds");
            hasScanned.current = false;
            setUri("");
        },5000);
    },[uri]);

    const toggleFacing = () => {
        setFacing((prev) => (prev === "back" ? "front" : "back"));
    };

    // Get camera permissions
    if (!permission) {
    return null;
    }

    if (!permission.granted) {
    return (
        <View style={s.container}>
        <Text style={{ textAlign: "center" }}>
            We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
        </View>
    );
    }

    return(
        <View style={s.cameraContainer}>
                <CameraView
                  style={s.camera}
                  ref={ref}
                  mode={mode}
                  facing={facing}
                  mute={true}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"]}}
                  onBarcodeScanned={(res)=>{
                    takeUri(res);
                  }}
                  responsiveOrientationWhenOrientationLocked
                />
        </View>
    )
}