import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import DemoGate from './DemoGate.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DemoGate>
      <App />
    </DemoGate>
  </React.StrictMode>,
);
