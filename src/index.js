import './index.html';

import Layout from './Layout.js';
import Stage from './Stage.js';

const APP = window.APP || {};

const initApp = () => {
  window.APP = APP;
  
  APP.Layout = new Layout();
  APP.Stage = new Stage();
};

if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp);
}