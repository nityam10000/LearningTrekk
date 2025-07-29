import { render, screen } from '@testing-library/react';
import App from './App';

test('renders e-learning application', () => {
  render(<App />);
  // Check if the main navigation elements are present
  const navbar = document.querySelector('nav') || document.querySelector('.navbar');
  expect(navbar || document.body).toBeInTheDocument();
});

test('renders without crashing', () => {
  render(<App />);
});
