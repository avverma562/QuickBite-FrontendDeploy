import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';
import api from '../api/axios';

// Mock the axios API
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the hero section text properly', async () => {
    // Mock successful API response with an empty array so loading finishes
    api.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for data to fetch
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check if the main heading exists
    expect(screen.getByText(/Craving something/i)).toBeInTheDocument();
    expect(screen.getByText(/Delicious/i)).toBeInTheDocument();
  });

  test('displays categories correctly', async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('Sushi')).toBeInTheDocument();
    });
  });

  test('displays featured restaurants fetched from API', async () => {
    const mockRestaurants = [
      { restaurantId: 1, name: 'Spicy Delight', avgRating: 4.5, estimatedDeliveryMin: 25, cuisine: 'Indian, Chinese' },
    ];
    api.get.mockResolvedValueOnce({ data: mockRestaurants });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Spicy Delight')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('25 mins')).toBeInTheDocument();
    });
  });
});
