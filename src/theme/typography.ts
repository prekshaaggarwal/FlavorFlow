import { Platform, TextStyle } from 'react-native';

const platformFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.1,
    fontFamily: platformFont,
  } as TextStyle,
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: platformFont,
  } as TextStyle,
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: platformFont,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: platformFont,
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: platformFont,
  } as TextStyle,
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: platformFont,
  } as TextStyle,
};
