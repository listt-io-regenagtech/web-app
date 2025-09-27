// Listt.io Brand Configuration
export const brandConfig = {
  // Brand Colors from listt.io website
  colors: {
    primary: '#4A7C59',        // Forest green (main brand color)
    secondary: '#6B8E23',      // Olive green 
    accent: '#90EE90',         // Light green
    background: '#F5F7FA',     // Light gray background
    surface: '#FFFFFF',        // White cards/surfaces
    dark: '#2F4F2F',          // Dark forest green
    text: {
      primary: '#2F4F2F',      // Dark green text
      secondary: '#6B8E23',    // Medium green text
      light: '#FFFFFF'         // White text
    },
    status: {
      success: '#52C41A',      // Success green
      warning: '#FAAD14',      // Warning orange
      error: '#FF4D4F',        // Error red
      info: '#1890FF'          // Info blue
    }
  },
  
  // Logo and Brand Assets
  logo: {
    main: 'https://images.squarespace-cdn.com/content/v1/66f3e3709a423a4d6e10a20f/9452fce0-4397-40ca-83c7-8e640d669e87/listt-logo-greens.png?format=1500w',
    white: 'https://images.squarespace-cdn.com/content/v1/66f3e3709a423a4d6e10a20f/b3185be5-9d68-4fb4-8c0f-952165fb7f5b/listt-logo-white.png?format=300w',
    favicon: '/listt-logo.png',
    alt: 'Listt.io - Natural Technology Solutions'
  },
  
  // Brand Text
  brand: {
    name: 'listt.io',
    tagline: 'Natural Technology Solutions',
    description: 'Appropriate technology solutions for nature friendly farming'
  },
  
  // Theme Configuration for Ant Design
  antdTheme: {
    token: {
      colorPrimary: '#4A7C59',
      colorSuccess: '#52C41A',
      colorWarning: '#FAAD14',
      colorError: '#FF4D4F',
      colorInfo: '#1890FF',
      borderRadius: 24,  // Rounded buttons like listt.io website
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }
  },
  
  // Button Styles (matching listt.io website)
  buttonStyle: {
    borderRadius: '24px',
    fontWeight: 500,
    padding: '8px 24px',
    height: 'auto',
    minHeight: '40px'
  },
  
  // Disabled button styles
  disabledButtonStyle: {
    borderRadius: '24px',
    fontWeight: 500,
    padding: '8px 24px',
    height: 'auto',
    minHeight: '40px',
    backgroundColor: '#f5f5f5',
    borderColor: '#d9d9d9',
    color: '#bfbfbf'
  }
};

export default brandConfig;
