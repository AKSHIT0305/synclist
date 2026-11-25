import { fireEvent, render, screen } from '@testing-library/react-native';

import { signInWithGoogle } from '@/features/auth/googleSignIn';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { getEnv } from '@/lib/env';

jest.mock('@/features/auth/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/lib/env', () => ({ getEnv: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const mockSignIn = jest.mocked(signInWithGoogle);
const mockEnv = jest.mocked(getEnv);

function setPhoneOtp(enabled: boolean) {
  mockEnv.mockReturnValue({
    supabaseUrl: 'https://x.supabase.co',
    supabaseAnonKey: 'key',
    googleWebClientId: 'id.apps.googleusercontent.com',
    enablePhoneOtp: enabled,
  });
}

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPhoneOtp(false);
  });

  it('offers Google sign-in and hides phone sign-in while the flag is off', async () => {
    await render(<SignInScreen />);
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeOnTheScreen();
    expect(screen.queryByText('Continue with phone')).not.toBeOnTheScreen();
  });

  it('shows phone sign-in when the flag is on', async () => {
    setPhoneOtp(true);
    await render(<SignInScreen />);
    expect(screen.getByRole('button', { name: 'Continue with phone' })).toBeOnTheScreen();
  });

  it('starts Google sign-in when pressed', async () => {
    mockSignIn.mockResolvedValue({ kind: 'success' });
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByTestId('google-sign-in'));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('shows the error when sign-in fails', async () => {
    mockSignIn.mockResolvedValue({ kind: 'error', message: 'Network request failed' });
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByTestId('google-sign-in'));
    expect(await screen.findByText('Network request failed')).toBeOnTheScreen();
  });

  it('stays quiet when the user cancels the Google sheet', async () => {
    mockSignIn.mockResolvedValue({ kind: 'cancelled' });
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByTestId('google-sign-in'));
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });
});
