import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { AppRoutes } from './routes';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
