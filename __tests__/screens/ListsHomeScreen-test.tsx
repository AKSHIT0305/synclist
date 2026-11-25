import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListsHomeScreen } from '@/features/lists/ListsHomeScreen';
import type { ListSummary } from '@/features/lists/types';

const me = { name: 'Riya Sharma', avatarUrl: null };

describe('ListsHomeScreen', () => {
  it('shows the empty state when there are no lists', async () => {
    await render(<ListsHomeScreen lists={[]} me={me} onOpenSettings={jest.fn()} />);
    expect(screen.getByText('Your lists')).toBeOnTheScreen();
    expect(screen.getByText('No lists yet')).toBeOnTheScreen();
  });

  it('renders the create button disabled until list creation exists', async () => {
    await render(<ListsHomeScreen lists={[]} me={me} onOpenSettings={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Create list' })).toBeDisabled();
  });

  it('enables the create button when a handler is given', async () => {
    const onCreate = jest.fn();
    await render(
      <ListsHomeScreen lists={[]} me={me} onOpenSettings={jest.fn()} onCreateList={onCreate} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Create list' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('opens settings from the avatar', async () => {
    const onOpenSettings = jest.fn();
    await render(<ListsHomeScreen lists={[]} me={me} onOpenSettings={onOpenSettings} />);
    expect(screen.getByText('RS')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('renders list cards with open counts', async () => {
    const lists: ListSummary[] = [
      {
        id: '1',
        name: 'Groceries',
        emoji: '🛒',
        color: '#208AEF',
        openCount: 3,
        members: [],
        lastActivityAt: null,
      },
      {
        id: '2',
        name: 'Trip',
        emoji: '🧳',
        color: '#22A06B',
        openCount: 0,
        members: [],
        lastActivityAt: null,
      },
    ];
    await render(<ListsHomeScreen lists={lists} me={me} onOpenSettings={jest.fn()} />);
    expect(screen.getByText('Groceries')).toBeOnTheScreen();
    expect(screen.getByText('3 open')).toBeOnTheScreen();
    expect(screen.getByText('All done 🎉')).toBeOnTheScreen();
    expect(screen.queryByText('No lists yet')).not.toBeOnTheScreen();
  });
});
