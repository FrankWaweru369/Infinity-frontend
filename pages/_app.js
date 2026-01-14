import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { PostsProvider } from "../context/PostsContext";
import { UsersProvider } from "../context/UsersContext";
import Head from "next/head";
import InstallPWA from "../components/installPWA";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Infinity" />
        <meta name="description" content="Beyond the scroll, real connections are made" />
        <meta name="keywords" content="social, infinity, connect, share" />
        
        {/* Apple/iOS Specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Infinity" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* Microsoft/Windows */}
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Theme & Display */}
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#8B5CF6" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#8B5CF6" />
        
        {/* Mobile Web App */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Infinity" />
        <meta property="og:description" content="Beyond the scroll, real connections are made" />
        <meta property="og:site_name" content="Infinity" />
        <meta property="og:url" content="https://yourdomain.com" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Infinity" />
        <meta name="twitter:description" content="Beyond the scroll, real connections are made" />
      </Head>
      
      <UsersProvider>
        <AuthProvider>
          <PostsProvider>
            <Component {...pageProps} />
          </PostsProvider>
        </AuthProvider>
      </UsersProvider>
      
      {/* PWA Install Floating Button */}
      <InstallPWA variant="floating" />
    </>
  );
}
