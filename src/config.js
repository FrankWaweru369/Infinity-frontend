const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://infinity-app-127d.onrender.com/api'  // Your live backend
    : 'http://localhost:10000/api'              // Local backend for development
};

export default config;
