import { BrowserRouter, RouterProvider } from 'react-router-dom';
import { AppRouter } from '@web/router';

export function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
