import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito-sans/latin-400.css';
import '@fontsource/nunito-sans/latin-700.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/legal.css';

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
