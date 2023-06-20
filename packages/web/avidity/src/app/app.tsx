// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter } from 'react-router-dom';
import styles from './App.module.css';
import { AppRouter } from '@web/router';
import { SideBar } from '@web/components';
import useUtilStore from './stores/useUtilStore';

export function App() {
  const theme = useUtilStore.use.theme();
  return (
    <div data-theme={theme}>
      <BrowserRouter>
        <div className="flex flex-row">
          <SideBar />
          <AppRouter />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
