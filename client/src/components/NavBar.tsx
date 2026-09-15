import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontSizeControl } from "./FontSizeControl";

export function NavBar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 rounded-lg py-2 text-center text-sm font-medium transition ${
      isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50"
    }`;

  return (
    <header className="sticky top-0 z-10 bg-slate-50 px-4 pt-3">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-orange-100 via-rose-50 to-sky-100 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-lg shadow-sm">
              🙏
            </span>
            <span className="text-[1.6875rem] font-extrabold text-slate-800">자카르타 목장</span>
          </div>
          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <FontSizeControl />
              <span className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                {user.name}
              </span>
              <button
                onClick={() => logout()}
                className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
        <nav className="flex gap-2 py-3">
          <NavLink to="/" end className={linkClass}>
            기도제목
          </NavLink>
          <NavLink to="/prayers" className={linkClass}>
            릴레이 기도
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
