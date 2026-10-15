import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../api/client";
import type { User } from "../types";

// 마지막으로 확인된 로그인 사용자를 기기에 저장해 둡니다. Render 무료 플랜 서버가
// 잠에서 깨어나는 동안(30초~1분) /auth/me 응답을 기다리지 않고 화면을 바로 띄우기 위해서입니다.
const STORAGE_KEY = "prayer-log-user";

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function storeUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(readStoredUser);
  // 저장된 사용자가 있으면 서버 확인을 기다리지 않고 바로 화면을 보여줍니다.
  const [loading, setLoading] = useState(() => readStoredUser() === null);

  function setUser(next: User | null) {
    setUserState(next);
    storeUser(next);
  }

  useEffect(() => {
    // 저장된 사용자가 있어도 세션이 아직 유효한지 뒤에서 확인합니다.
    api
      .get<{ user: User }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        } else {
          // 네트워크 오류 등은 세션 만료가 아니므로 저장된 사용자를 그대로 둡니다.
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(name: string, password: string) {
    const res = await api.post<{ user: User }>("/auth/login", { name, password });
    setUser(res.user);
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
