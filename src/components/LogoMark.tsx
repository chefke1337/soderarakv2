/**
 * Sóderárak jel — hatszögbe írt, hajtott szalagból álló térbeli „S" betű (ezüst ·
 * kőszürke · narancs lapok), az ügyfél 2026-11-17-i mockupjának fejléc-jele alapján, vektorban
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
      <polygon points="78.58,27.26 50.00,10.76 50.00,29.24 78.58,45.74" fill="#57534e" />
      <polygon points="78.58,21.26 50.00,4.76 50.00,10.76 78.58,27.26" fill="#57534e" />
      <polygon points="50.00,4.76 50.00,23.24 50.00,29.24 50.00,10.76" fill="#57534e" />
      <polygon points="50.00,23.24 78.58,39.74 78.58,45.74 50.00,29.24" fill="#57534e" />
      <polygon points="78.58,39.74 78.58,21.26 78.58,27.26 78.58,45.74" fill="#57534e" />
      <polygon points="50.00,10.76 5.42,36.50 37.42,36.50 50.00,29.24" fill="#8a847e" />
      <polygon points="50.00,4.76 5.42,30.50 5.42,36.50 50.00,10.76" fill="#8a847e" />
      <polygon points="5.42,30.50 37.42,30.50 37.42,36.50 5.42,36.50" fill="#8a847e" />
      <polygon points="37.42,30.50 50.00,23.24 50.00,29.24 37.42,36.50" fill="#8a847e" />
      <polygon points="50.00,23.24 50.00,4.76 50.00,10.76 50.00,29.24" fill="#8a847e" />
      <polygon points="5.42,36.50 62.58,69.50 94.58,69.50 37.42,36.50" fill="#6b6560" />
      <polygon points="5.42,30.50 62.58,63.50 62.58,69.50 5.42,36.50" fill="#6b6560" />
      <polygon points="62.58,63.50 94.58,63.50 94.58,69.50 62.58,69.50" fill="#6b6560" />
      <polygon points="94.58,63.50 37.42,30.50 37.42,36.50 94.58,69.50" fill="#6b6560" />
      <polygon points="37.42,30.50 5.42,30.50 5.42,36.50 37.42,36.50" fill="#6b6560" />
      <polygon points="62.58,69.50 50.00,76.76 50.00,95.24 94.58,69.50" fill="#9a3412" />
      <polygon points="62.58,63.50 50.00,70.76 50.00,76.76 62.58,69.50" fill="#9a3412" />
      <polygon points="50.00,70.76 50.00,89.24 50.00,95.24 50.00,76.76" fill="#9a3412" />
      <polygon points="50.00,89.24 94.58,63.50 94.58,69.50 50.00,95.24" fill="#9a3412" />
      <polygon points="94.58,63.50 62.58,63.50 62.58,69.50 94.58,69.50" fill="#9a3412" />
      <polygon points="50.00,76.76 21.42,60.26 21.42,78.74 50.00,95.24" fill="#7c2d12" />
      <polygon points="50.00,70.76 21.42,54.26 21.42,60.26 50.00,76.76" fill="#7c2d12" />
      <polygon points="21.42,54.26 21.42,72.74 21.42,78.74 21.42,60.26" fill="#7c2d12" />
      <polygon points="21.42,72.74 50.00,89.24 50.00,95.24 21.42,78.74" fill="#7c2d12" />
      <polygon points="50.00,89.24 50.00,70.76 50.00,76.76 50.00,95.24" fill="#7c2d12" />
      <polygon points="78.58,21.26 50.00,4.76 50.00,23.24 78.58,39.74" fill="#a39d97" />
      <polygon points="50.00,4.76 5.42,30.50 37.42,30.50 50.00,23.24" fill="#fafaf9" />
      <polygon points="5.42,30.50 62.58,63.50 94.58,63.50 37.42,30.50" fill="#d9d6d2" />
      <polygon points="62.58,63.50 50.00,70.76 50.00,89.24 94.58,63.50" fill="#f97316" />
      <polygon points="50.00,70.76 21.42,54.26 21.42,72.74 50.00,89.24" fill="#c2410c" />
    </svg>
  );
}
