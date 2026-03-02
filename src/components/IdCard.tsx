import { Text,View,Image, TouchableOpacity } from "react-native";
import { idCardStyles as s} from "@/styles/miscIdCard";
import { Ionicons } from "@expo/vector-icons";

export default function IdCard() {

    const verified = "verified";
    const nickname = "@nickname";
    const addressText = "adressText";

    const displayPic = require("../../assets/images/MonoPay-logo-green.png");

    return (
        <View style={s.idCardBox}>
            <View style={s.idCardIconBox}>
                <View style={{alignItems: "center"}}>
                    <Image
                        source={displayPic}
                        style={s.idCardImage}
                    />
                    <Ionicons name="checkmark-done" size={18} color="#000000a3" />
                    <Text>{verified}</Text>
                </View>
                <TouchableOpacity style={s.idCardQR}>
                    <Ionicons name="qr-code-sharp" size={18} color="#000000a3" />
                </TouchableOpacity>
            </View>
            <View style={s.idCardName}>
                
                <Text>{nickname}</Text>
            </View>     
            <View style={s.idCardAddressBox}>
                <Ionicons name="wallet" size={20} color="#0a0a1a" />
                <Text >
                    {addressText}
                </Text>
                <TouchableOpacity style={s.idCardAddressCopy}>
                    <Ionicons name="copy" size={20} color="#0a0a1a" />
                </TouchableOpacity>
            </View>
        </View>
    )
}