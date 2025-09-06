// src/theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#B8E6FF',
      200: '#8AD4FF',
      300: '#5CC2FF',
      400: '#2EB0FF',
      500: '#007ACC',
      600: '#0066AA',
      700: '#004D80',
      800: '#003355',
      900: '#001A2B',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'gray.200',
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 'medium',
      },
    },
  },
});

export default theme;
