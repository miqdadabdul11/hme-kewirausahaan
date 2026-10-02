"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(result.error || "Login gagal.");
        return;
      }

      router.push("/admin");
    } catch {
      setLoading(false);
      setError("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoFrame}>
            <Image
              src="/logo-estore-transparent-trimmed.png"
              alt="Logo E-STORE HME FPTI UPI"
              width={563}
              height={704}
              className={styles.logo}
              unoptimized
            />
          </div>
          <h1 className={`heading ${styles.title}`}>Portal Admin</h1>
          <p className={styles.subtitle}>Sistem Manajemen Kewirausahaan</p>
        </div>
        
        <form className={styles.form} onSubmit={submit}>
          <Input 
            label="Email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {error && <div className={styles.errorBox}>{error}</div>}
          
          <Button type="submit" size="lg" isLoading={loading} style={{ width: '100%', marginTop: '8px' }}>
            Masuk Dashboard
          </Button>
        </form>

        <Link href="/" className={styles.backLink}>
          &larr; Kembali ke halaman utama
        </Link>
      </div>
    </div>
  );
}
