import QRCode from 'react-native-qrcode-svg';
import { url } from '@/helpers/qrCodeUrlHelper';
import { View,Text,TouchableOpacity,Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from './ProfileButtons';
import { qrScreenStyles as s } from '@/styles/screenQr';
const item = require ("../../assets/images/react-logo.png");
const item2 = require ("../../assets/images/MonoPay-logo-green.png");


export function QRCodeGen() {
    return (
        <QRCode value={url.toString()} size={253}/>
    )
}
// style={s.idCardBox}
export default function QRCodeView() {

    return (
    <View style={s.QrPageCardBox}>
        <View>{/* Header */}
            <Text>My QR</Text>
        </View>
        <View style={{justifyContent: "center", alignItems:"center"}}>{/* QR Display */}
            <QRCodeGen/>{/* QR code */}
        </View>
        <View>{/* Address */}
            <TouchableOpacity><Text>copy</Text></TouchableOpacity>{/* copy */}
        </View>
        <View>{/* Token Selector */}
            <TouchableOpacity><Text>SOL</Text></TouchableOpacity>{/* SOL */}
            <TouchableOpacity><Text>USDC</Text></TouchableOpacity>{/* USDC */}
        </View>
        <View>{/* Actions */}
            <TouchableOpacity><Text>Share</Text></TouchableOpacity>{/* Share */}
            <TouchableOpacity><Text>Save</Text></TouchableOpacity>{/* Save */}
        </View>
    </View>
)
}