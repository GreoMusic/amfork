import AuthProvider from "./provider/authProvider";
import Routes from "./routes";
import toast, { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Routes />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
