/**
 * Sóderárak jel — izometrikus, lépcsőzetes „S" kocka (ezüst · fehér/fekete ·
 * narancs), az ügyfél 2026-11-17-i mockupjának fejléc-jele alapján, vektorban
 * újraépítve (éles minden méretben; ellenőrizve 96/48/24/16 px-en).
 * Díszítő: a hozzáférhető név a körülvevő linken van.
 */
export default function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <polygon points="8.43,74.00 50.00,98.00 50.00,82.00 8.43,58.00" fill="#ea6a12" />
      <polygon points="91.57,74.00 50.00,98.00 50.00,82.00 91.57,58.00" fill="#c2410c" />
      <polygon points="50.00,34.00 91.57,58.00 50.00,82.00 8.43,58.00" fill="#fb923c" />
      <polygon points="36.14,26.00 77.71,50.00 77.71,34.00 36.14,10.00" fill="#a39d97" />
      <polygon points="91.57,42.00 77.71,50.00 77.71,34.00 91.57,26.00" fill="#77716b" />
      <polygon points="50.00,2.00 91.57,26.00 77.71,34.00 36.14,10.00" fill="#d9d6d2" />
      <polygon points="50.00,66.00 63.86,74.00 63.86,58.00 50.00,50.00" fill="#ea6a12" />
      <polygon points="91.57,58.00 63.86,74.00 63.86,58.00 91.57,42.00" fill="#c2410c" />
      <polygon points="77.71,34.00 91.57,42.00 63.86,58.00 50.00,50.00" fill="#fb923c" />
      <polygon points="22.29,50.00 36.14,58.00 36.14,26.00 22.29,18.00" fill="#cfcbc6" />
      <polygon points="50.00,50.00 36.14,58.00 36.14,26.00 50.00,18.00" fill="#a39d97" />
      <polygon points="36.14,10.00 50.00,18.00 36.14,26.00 22.29,18.00" fill="#f7f6f4" />
      <polygon points="8.43,58.00 50.00,82.00 50.00,66.00 8.43,42.00" fill="#1c1917" />
      <polygon points="63.86,74.00 50.00,82.00 50.00,66.00 63.86,58.00" fill="#3a332e" />
      <polygon points="22.29,34.00 63.86,58.00 50.00,66.00 8.43,42.00" fill="#faf9f7" />
    </svg>
  );
}
