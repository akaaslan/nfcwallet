import { setStatusBarHidden, StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import ExpandableCard from "./ExpandableCard"



export default function App() {
  return (
    <View style={styles.container}>
      <Text style = {styles.header}> Cüzdan. </Text>
      <StatusBar style='auto' hidden = {true}/>
      <ExpandableCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#292929',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 28,
    color: '#e8e8e8',
    fontWeight: 'bold',
    top: 20,
    left: 20,
  },
});
