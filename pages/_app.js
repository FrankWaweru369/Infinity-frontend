import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { PostsProvider } from "../context/PostsContext";
import { UsersProvider } from "../context/UsersContext";

export default function App({ Component, pageProps }) {
  return (
   <UsersProvider>
    <AuthProvider>
      <PostsProvider>
        <Component {...pageProps} />
      </PostsProvider>
    </AuthProvider>
   </UsersProvider>
  );
}
