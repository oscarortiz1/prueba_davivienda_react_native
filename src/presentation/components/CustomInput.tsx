import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../../shared/constants/colors';
import { commonStyles } from '../theme/styles';

interface CustomInputProps extends TextInputProps {
  error?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({ error, style, ...props }) => {
  return (
    <View>
      <TextInput
        style={[
          commonStyles.input,
          error ? commonStyles.inputError : null,
          style,
        ]}
        placeholderTextColor={COLORS.gray}
        {...props}
      />
      {error && <Text style={commonStyles.errorText}>{error}</Text>}
    </View>
  );
};
