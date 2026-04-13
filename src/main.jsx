import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const hideSplash = () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 350);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// Hide splash once React has painted
requestAnimationFrame(() => requestAnimationFrame(hideSplash));