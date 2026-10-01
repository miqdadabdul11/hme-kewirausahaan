import React from 'react';

export const Footer = () => (
  <footer style={{ background: 'var(--black-900)', color: 'var(--gray-500)', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
    <p style={{ fontFamily: 'var(--font-space)', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>Sub Kewirausahaan HME FPTI UPI</p>
    <p style={{ fontSize: '0.875rem' }}>© {new Date().getFullYear()} Himpunan Mahasiswa Elektro FPTI UPI.</p>
  </footer>
);