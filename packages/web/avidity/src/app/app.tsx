// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter } from 'react-router-dom';
import styles from './App.module.css';
import { AppRouter } from '@web/router';
import { SideBar } from '@web/components';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-row">
        <SideBar />
        <AppRouter />
      </div>
    </BrowserRouter>
  );
}

export default App;
