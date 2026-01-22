import React, {type ReactNode} from 'react';
import AdminNav from './AdminNav';


interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage }) => {

    return (
    <div className="min-h-screen bg-black" style={{fontFamily: 'var(--font-codecLight)'}}>
      <AdminNav currentPage={currentPage} />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
