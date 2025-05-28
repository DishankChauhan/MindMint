import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MintNFTScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mint NFT Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    fontSize: 18,
    color: '#1f2937',
  },
}); 