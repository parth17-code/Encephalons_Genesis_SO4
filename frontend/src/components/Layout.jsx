import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/auth';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeaf } from "@fortawesome/free-solid-svg-icons";

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full">
      <header className="bg-white text-slate-800 px-8 py-4 w-full">
        <div className="max-w-350 mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-center">
            <FontAwesomeIcon icon={faLeaf} className="mr-2 text-white bg-dark-green rounded-full p-1" />{" "}
            Green-Tax Compliance Monitor
          </h1>

          {user && (
            <div className="flex items-center gap-4">
              <div className='flex flex-col items-end gap-1'>
                <span className="font-bold">{user.name}</span>

              <span className="rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                {user.role}
              </span>
              </div>
              

              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-dark-green px-4 py-2 text-sm font-bold transition hover:bg-slate-200 text-white"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto bg-[#f7f7f7] p-8">
        {title && (
          <h2 className="mb-6 text-3xl font-bold text-slate-800">
            {title}
          </h2>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
