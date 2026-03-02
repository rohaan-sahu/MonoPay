import {
  Text,
  View,
  TouchableOpacity,
  SectionList,
} from "react-native";

// Local imports
import { friendsScreenStyles as s } from "@/styles/screenFriends";

const DATA = [
  {
    title: 'Recent searches',
    data: ['Ishan','Ola','Venkat'],
  },
  {
    title: 'All friends',
    data: [
    'James', 'Maria', 'DeShawn', 'Emily', 'Carlos', 'Aisha',
    'Tyler', 'Fatima', 'Marcus', 'Sofia', 'Kevin', 'Brianna',
    'Ethan', 'Yolanda', 'Miguel', 'Hannah', 'Darius', 'Rachel',
    'Jordan', 'Priya', 'Andre', 'Megan', 'Isaiah', 'Vanessa',
    'Brandon', 'Keisha', 'Nathan', 'Diana', 'Malik', 'Ashley',
    'Trevor', 'Jasmine', 'Elijah', 'Samantha', 'Roberto', 'Tiffany',
    'Aaron', 'Layla', 'Patrick', 'Destiny'
]
  },
];

const item = require ("../../assets/images/MonoPay-splash-screen-transparent.png");

export default function CombiList() {
  
  return (
            <SectionList
                sections={DATA}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({section: {title}}) => (
                    <TouchableOpacity>
                        <Text style={s.friendsHeader}>{title}</Text>
                    </TouchableOpacity>
                )}
                renderItem={({item}) => (
                    <TouchableOpacity>
                        <View style={s.friendsItem}>
                            <Text style={s.friendsTitle}>{item}</Text>
                        </View>
                </TouchableOpacity>
                )}
            />
  );
}