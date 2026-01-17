import React from 'react';
import AdminNav from './AdminNav';

const AdminLayout = ({ children, currentPage }) => {
  return (
    <div className="min-h-screen bg-black">
      <AdminNav currentPage={currentPage} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;