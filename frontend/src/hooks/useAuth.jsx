import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // fetch role from firestore
        try {
          const isAdminUser = user.email?.toLowerCase() === "haripatel2225@gmail.com";
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            setUserRole(adminDoc.data().role || "admin");
          } else {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role || (isAdminUser ? "admin" : "user"));
            } else {
              const assignedRole = isAdminUser ? "admin" : "user";
              setUserRole(assignedRole);
              // Auto-sync user account record into Firestore so users collection reflects registered accounts
              const targetCol = assignedRole === "admin" ? "admins" : "users";
              setDoc(
                doc(db, targetCol, user.uid),
                {
                  email: user.email,
                  role: assignedRole,
                  lastActiveAt: new Date().toISOString()
                },
                { merge: true }
              ).catch(() => {});
            }
          }
        } catch (error) {
          console.error("Error fetching user role: ", error);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
