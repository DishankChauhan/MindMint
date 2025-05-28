import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle, Platform } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showText?: boolean;
  variant?: 'light' | 'dark';
  style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'light',
  style 
}) => {
  const logoSizes = {
    small: 32,
    medium: 64,
    large: 96,
    xlarge: 128,
  };

  const textSizes = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 40,
  };

  const logoSize = logoSizes[size];
  const textSize = textSizes[size];

  const logoStyle: ImageStyle = {
    width: logoSize,
    height: logoSize,
    resizeMode: 'contain',
  };

  const textColor = variant === 'light' ? '#ffffff' : '#1f2937';
  const subtitleColor = variant === 'light' ? '#e5e7eb' : '#6b7280';

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={require('../../assets/Logo.png')} 
        style={logoStyle}
      />
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { fontSize: textSize, color: textColor }]}>
            MindMint
          </Text>
          {size !== 'small' && (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              Tokenized Mindfulness
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

export default Logo; 