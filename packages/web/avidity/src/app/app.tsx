// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter } from 'react-router-dom';
import styles from './App.module.css';
import { AppRouter } from '@web/router';

export function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
