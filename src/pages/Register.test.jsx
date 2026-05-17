import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Register from './Register';
import { useAuth } from '../context/AuthContext';

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

describe('Register Component', () => {
  const mockRegister = vi.fn();
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ 
      register: mockRegister,
      login: mockLogin,
      logout: mockLogout
    });
    
    // Mock window.alert
    global.alert = vi.fn();
  });

  test('renders register form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
  });

  test('shows error when fields are empty', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  test('calls register and login for CUSTOMER role', async () => {
    mockRegister.mockResolvedValueOnce({});
    mockLogin.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'john@mail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'pass123' } });
    
    // Default role is CUSTOMER
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@mail.com', 'pass123', 'CUSTOMER');
      expect(mockLogin).toHaveBeenCalledWith('john@mail.com', 'pass123');
      expect(mockedUseNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('calls register and redirects to login for PARTNER role', async () => {
    mockRegister.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Restaurant Owner' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'owner@mail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'pass123' } });
    
    // Change role to PARTNER
    fireEvent.click(screen.getByText(/Restaurant/i));

    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRegister).toHaveBeenCalledWith('Restaurant Owner', 'owner@mail.com', 'pass123', 'PARTNER');
      expect(global.alert).toHaveBeenCalled();
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockedUseNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
