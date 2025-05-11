import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}