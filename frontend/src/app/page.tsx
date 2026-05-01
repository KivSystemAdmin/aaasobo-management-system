import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.home}>
      <section className={styles.home__panel} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.home__title}>
          <Image
            src="/images/logo2.svg"
            alt=""
            width={183}
            height={51}
            priority
            className={styles.home__logo}
          />
          <span className={styles.home__titleText}>AaasoBo!</span>
        </h1>
        <nav className={styles.home__links} aria-label="Login options">
          <Link className={styles.home__link} href="/customers/login">
            Login as Customer
          </Link>
          <Link className={styles.home__link} href="/instructors/login">
            Login as Instructor
          </Link>
          <Link className={styles.home__link} href="/admins/login">
            Login as Admin
          </Link>
        </nav>
      </section>
    </main>
  );
}
