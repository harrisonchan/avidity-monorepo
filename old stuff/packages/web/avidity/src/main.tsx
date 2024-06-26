import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { enableMapSet } from 'immer';
// import App from './app';
import App from './app';

enableMapSet();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
