import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-800 transition-colors duration-200">
      <Header />
      <main className="flex-grow p-4 max-w-md mx-auto text-black dark:text-white transition-colors duration-200">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}