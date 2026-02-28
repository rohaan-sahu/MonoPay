import { Image,View,FlatList } from "react-native";
import { useWindowDimensions } from "react-native";


const data = [
    require ('../../assets/slides/computer-security-lock-and-payment.jpg'),
    require ('../../assets/slides/office-computer-screen.jpg'),
    require ('../../assets/slides/qr-code-on-tea.jpg'),
    require ('../../assets/slides/orange-juice-qr-re-order.jpg')
];
export default function SlideCards(){

    const { width } = useWindowDimensions();

    return(
            <FlatList
                data = {data}
                horizontal
                pagingEnabled
                keyExtractor={(_,i) => i.toString()}
                renderItem={({item}) => (
                    <Image source = {item} style={{width: width, height: 200, resizeMode: "cover",}} />
                )}
            />
    )
}