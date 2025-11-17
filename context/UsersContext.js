import { createContext, useContext, useState } from "react";

const UsersContext = createContext();

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([
    {
      username: "johndoe",
      avatar: "https://i.pravatar.cc/150?img=3",
      followers: [],
      following: [],
    },
    {
      username: "alice",
      avatar: "https://i.pravatar.cc/150?img=5",
      followers: [],
      following: [],
    },
  ]);

  // Assume current logged-in user is alice
  const currentUser = users.find((u) => u.username === "alice");

  const toggleFollow = (targetUsername) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.username === currentUser.username) {
          return {
            ...u,
            following: u.following.includes(targetUsername)
              ? u.following.filter((f) => f !== targetUsername)
              : [...u.following, targetUsername],
          };
        }
        if (u.username === targetUsername) {
          return {
            ...u,
            followers: u.followers.includes(currentUser.username)
              ? u.followers.filter((f) => f !== currentUser.username)
              : [...u.followers, currentUser.username],
          };
        }
        return u;
      })
    );
  };

  return (
    <UsersContext.Provider value={{ users, toggleFollow, currentUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export const useUsers = () => useContext(UsersContext);
