import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 rounded-lg py-2 text-center text-sm font-medium transition ${
      isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <span className="text-lg font-bold text-brand-700">목장 기도록</span>
        {user && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
            <button
              onClick={() => logout()}
              className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
      <nav className="mx-auto flex max-w-2xl gap-2 px-4 pb-3">
        <NavLink to="/" end className={linkClass}>
          기도제목
        </NavLink>
        <NavLink to="/prayers" className={linkClass}>
          대표기도문
        </NavLink>
      </nav>
    </header>
  );
}
