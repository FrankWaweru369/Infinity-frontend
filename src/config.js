const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://infinity-app-127d.onrender.com/api'
    : 'http://localhost:10000/api'
};

export default config;
