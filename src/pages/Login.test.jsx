import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Mock react-router-dom
const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate,
  };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Axios API
vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('can toggle to forgot password flow', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const forgotPasswordLink = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordLink);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
  });

  test('shows error when fields are empty on submit', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.submit(submitBtn.closest('form'));

    // Login.jsx has a 1s delay before validation — allow up to 3s
    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('calls login function on successful form submit', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'USER' });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@mail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123' } });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));

    // Login.jsx has an artificial 1s delay — allow up to 3s for the assertion
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@mail.com', 'password123');
      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });
});
