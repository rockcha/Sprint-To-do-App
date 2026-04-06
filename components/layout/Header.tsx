import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={96}
            height={28}
            className={styles.desktopLogo}
            priority
          />
        </Link>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/logo-small.png"
            alt="Logo"
            width={96}
            height={28}
            className={styles.mobileLogo}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
