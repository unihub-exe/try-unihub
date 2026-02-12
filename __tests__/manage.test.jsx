import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageEventPage from '../src/pages/event/[eventId]/manage';
import '@testing-library/jest-dom';

// Mocks
jest.mock('@/components/UserNavBar', () => {
    return function DummyNavBar() {
        return <div data-testid="user-navbar">NavBar</div>;
    };
});
jest.mock('@/utils/getUserToken', () => ({
    getUserToken: jest.fn(() => 'mock-user-token'),
}));
jest.mock('@/utils/getAdminToken', () => ({
    getAdminToken: jest.fn(() => 'mock-admin-token'),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ManageEventPage Check-in Logic', () => {
    beforeEach(() => {
        fetch.mockClear();
        // Reset console.error to avoid cluttering test output
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send checkInList array when checking in a guest', async () => {
        // Mock getevent response
        fetch.mockImplementation((url) => {
            if (url.includes('/getevent')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        name: 'Test Event',
                        participants: [
                            { id: 'p1', name: 'John Doe', email: 'john@example.com', ticketType: 'General', entry: false }
                        ]
                    })
                });
            }
            if (url.includes('/event/checkin')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<ManageEventPage />);

        // Wait for event to load and "Manage Event" header to appear
        await waitFor(() => expect(screen.getByText('Manage Event')).toBeInTheDocument());

        // Switch to Guests tab
        const guestsTab = screen.getByText('Guests');
        fireEvent.click(guestsTab);

        // Find Check In button
        const checkInBtn = await screen.findByText('Check In');
        fireEvent.click(checkInBtn);

        // Verify fetch call
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/event/checkin'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"checkInList":["p1"]')
                })
            );
        });

        // Verify UI update (button should disappear or status change)
        await waitFor(() => {
            expect(screen.queryByText('Check In')).not.toBeInTheDocument();
        });
    });

    it('should handle check-in errors gracefully', async () => {
         // Mock getevent response
         fetch.mockImplementation((url) => {
            if (url.includes('/getevent')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        name: 'Test Event',
                        participants: [
                            { id: 'p2', name: 'Jane Doe', email: 'jane@example.com', ticketType: 'General', entry: false }
                        ]
                    })
                });
            }
            if (url.includes('/event/checkin')) {
                return Promise.reject(new Error('Network Error'));
            }
            return Promise.resolve({ ok: false });
        });

        render(<ManageEventPage />);

        await waitFor(() => expect(screen.getByText('Manage Event')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Guests'));

        const checkInBtn = await screen.findByText('Check In');
        fireEvent.click(checkInBtn);

        // Verify error handling (message should be set)
        await waitFor(() => {
            expect(screen.getByText('Check-in error')).toBeInTheDocument();
        });
    });
});
