import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';  // Confirm path
import { BottomNav } from './components/BottomNav';  // Confirm path

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 max-w-md mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}