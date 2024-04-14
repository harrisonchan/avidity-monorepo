import { SafeAreaView, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function App() {
  return (
    <SafeAreaView>
      <Text>Hello World</Text>
      <Text>Bitach</Text>
      <Icon name="airplane" size={40} color="red" />
    </SafeAreaView>
  );
}
