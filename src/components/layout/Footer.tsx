import React from "react";
import styles from "./Footer.module.css";

const CONTACT = {
  whatsappNumber: "6285659372309",
  whatsappDisplay: "+62 856-5937-2309",
  instagramUsername: "@estore.hme",
  email: "Miqdadabdul110304@gmail.com",
};

const whatsappUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=Halo%20Admin%20HME%2C%20saya%20mau%20tanya%20soal%20E-STORE`;

export const Footer = () => (
  <footer className={styles.footer}>
    <section className={styles.contact} aria-labelledby="footer-contact-title">
      <h2 id="footer-contact-title" className={styles.contactTitle}>Hubungi Kami</h2>
      <p className={styles.contactDescription}>
        Ada pertanyaan seputar produk, pre-order, atau pesanan? Hubungi kami.
      </p>
      <div className={styles.contactLinks}>
        <div className={styles.whatsappContact}>
          <a
            className={styles.whatsappButton}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat via WhatsApp
          </a>
          <span className={styles.whatsappNumber}>{CONTACT.whatsappDisplay}</span>
        </div>
        <a
          className={styles.contactLink}
          href={`https://instagram.com/${CONTACT.instagramUsername.slice(1)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle className={styles.iconDot} cx="18" cy="6" r="1" />
          </svg>
          <span>{CONTACT.instagramUsername}</span>
        </a>
        <a className={styles.contactLink} href={`mailto:${CONTACT.email}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <span className={styles.email}>{CONTACT.email}</span>
        </a>
      </div>
    </section>
    <div className={styles.footerMeta}>
      <p className={styles.brand}>E-STORE HME FPTI UPI</p>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} Himpunan Mahasiswa Elektro FPTI UPI.
      </p>
    </div>
  </footer>
);
