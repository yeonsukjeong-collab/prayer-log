import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontSizeControl } from "./FontSizeControl";

function NavTab({ to, end, icon, label }: { to: string; end?: boolean; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1.5 border-b-[3px] pb-2 pt-1 transition ${
          isActive ? "border-brand-600" : "border-transparent"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-sm transition ${
              isActive ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {icon}
          </span>
          <span className={`text-xs font-bold ${isActive ? "text-brand-700" : "text-slate-400"}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-slate-50 px-4 pb-3 pt-3">
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
        <nav className="mt-3 flex rounded-2xl bg-white px-2 pt-2 shadow-sm">
          <NavTab to="/" end icon="🙏" label="기도제목" />
          <NavTab to="/prayers" icon="📖" label="릴레이 기도" />
        </nav>
      </div>
    </header>
  );
}
