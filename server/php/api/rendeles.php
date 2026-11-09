<?php
/**
 * SÓDERÁRAK — rendelési igény fogadása (árkalkulátor → megrendeles@soderarak.hu).
 *
 * Statikus weboldal mellé, PHP-t futtató tárhelyre készült végpont:
 * /api/rendeles.php. A böngésző JSON-t POST-ol ide; a végpont
 *  - szerveroldalon validál (a kliens validációja csak kényelmi),
 *  - a központi árakból ÚJRASZÁMOL (rendeles-adatok.php, generált),
 *  - korlátozza a beküldések számát, kiszűri a dupla beküldést,
 *  - a levelet a FIX címzettnek küldi (megrendeles@soderarak.hu + a szerveroldali
 *    ORDER_EXTRA_RECIPIENTS — a kliens nem írhatja felül), a beküldő Reply-To.
 *
 * Sikert CSAK akkor jelez, ha a levelet a küldő (PHP mail() / SMTP-szerver)
 * ténylegesen ÁTVETTE. Ez nem azonos a postafiókba érkezéssel.
 *
 * Konfiguráció (titok SOHA nem kerül ide vagy a frontendbe) — lásd
 * server/php/README.md. Forrás: környezeti változók (pl. .htaccess SetEnv),
 * vagy a webgyökéren KÍVÜLI soderarak-rendeles-config.php.
 */

declare(strict_types=1);
define('SODERARAK_RENDELES', 1);

const RECIPIENT = 'megrendeles@soderarak.hu';
const MAX_BODY_BYTES = 16384;
const RATE_LIMIT_DEFAULT = 5;  // beküldés / IP
const RATE_WINDOW = 600;       // 10 perc
const IDEMPOTENCY_TTL = 86400; // 24 óra
const PHONE_FALLBACK = 'Kérjük, próbálja újra néhány perc múlva, vagy hívjon minket telefonon: +36 30 852 8909.';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ───────────────────────────── Konfiguráció ───────────────────────────── */

function load_config(): array
{
    $cfg = [];
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $candidates = array_filter([
        getenv('ORDER_CONFIG_FILE') ?: null,
        $docRoot !== '' ? dirname($docRoot) . '/soderarak-rendeles-config.php' : null,
    ]);
    foreach ($candidates as $file) {
        if (is_string($file) && is_file($file) && is_readable($file)) {
            $loaded = require $file;
            if (is_array($loaded)) $cfg = $loaded;
            break;
        }
    }
    $env = static function (string $key) {
        $v = getenv($key);
        if ($v === false && isset($_SERVER[$key])) $v = $_SERVER[$key];
        if ($v === false && isset($_SERVER['REDIRECT_' . $key])) $v = $_SERVER['REDIRECT_' . $key];
        return ($v === false || $v === '') ? null : (string) $v;
    };
    $pick = static fn (string $key, $default = null) => $env($key) ?? ($cfg[$key] ?? $default);
    return [
        'transport'       => strtolower((string) $pick('ORDER_TRANSPORT', 'mail')), // mail | smtp | file (csak teszt) | fail (csak teszt)
        'from'            => (string) $pick('ORDER_MAIL_FROM', RECIPIENT),
        'from_name'       => (string) $pick('ORDER_MAIL_FROM_NAME', 'Sóderárak weboldal'),
        'smtp_host'       => $pick('ORDER_SMTP_HOST'),
        'smtp_port'       => (int) $pick('ORDER_SMTP_PORT', 587),
        'smtp_secure'     => strtolower((string) $pick('ORDER_SMTP_SECURE', 'tls')), // tls (STARTTLS) | ssl
        'smtp_user'       => $pick('ORDER_SMTP_USER'),
        'smtp_pass'       => $pick('ORDER_SMTP_PASS'),
        'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) $pick('ORDER_ALLOWED_ORIGINS', ''))))),
        'test_dir'        => $pick('ORDER_TEST_DIR'),
        'state_dir'       => $pick('ORDER_STATE_DIR'),
        'rate_limit'      => max(1, (int) $pick('ORDER_RATE_LIMIT', RATE_LIMIT_DEFAULT)),
        // További FIX címzett(ek), vesszővel — csak szerveroldali konfigból, a kliens nem adhat meg.
        'extra_recipients' => (string) $pick('ORDER_EXTRA_RECIPIENTS', ''),
    ];
}

$cfg = load_config();
if ($cfg['transport'] === 'smtp' || ($cfg['transport'] === 'mail' && $cfg['smtp_host'])) {
    $cfg['transport'] = 'smtp';
}

/* ───────────────────────────── Állapot (fájl) ───────────────────────────── */

function state_dir(array $cfg): string
{
    $dir = $cfg['state_dir'] ?: (rtrim(sys_get_temp_dir(), '/\\') . '/soderarak-rendeles-' . substr(hash('sha256', __DIR__), 0, 12));
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function rate_limit_ok(string $dir, string $ip, int $limit): array
{
    $file = $dir . '/rl-' . hash('sha256', $ip) . '.json';
    $now = time();
    $fh = @fopen($file, 'c+');
    if (!$fh) return [true, 0];
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $hits = array_values(array_filter((array) json_decode($raw ?: '[]', true), static fn ($t) => is_int($t) && $t > $now - RATE_WINDOW));
    if (count($hits) >= $limit) {
        flock($fh, LOCK_UN);
        fclose($fh);
        return [false, max(1, min($hits) + RATE_WINDOW - $now)];
    }
    $hits[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN);
    fclose($fh);
    return [true, 0];
}

function idem_file(string $dir, string $key): string
{
    return $dir . '/id-' . hash('sha256', $key);
}

function idem_seen(string $dir, string $key): bool
{
    $f = idem_file($dir, $key);
    return is_file($f) && (time() - (int) @filemtime($f)) < IDEMPOTENCY_TTL;
}

/* ───────────────────────────── Segédek ───────────────────────────── */

function clean_line($v, int $max = 200): string
{
    $s = is_string($v) ? $v : '';
    $s = preg_replace('/[\x00-\x1F\x7F\x{2028}\x{2029}]/u', ' ', $s) ?? '';
    $s = trim(preg_replace('/\s{2,}/u', ' ', $s) ?? '');
    return mb_substr($s, 0, $max, 'UTF-8');
}

function clean_block($v, int $max = 2000): string
{
    $s = is_string($v) ? $v : '';
    $s = str_replace(["\r\n", "\r"], "\n", $s);
    $s = preg_replace('/[\x00-\x09\x0B-\x1F\x7F\x{2028}\x{2029}]/u', '', $s) ?? '';
    $s = preg_replace("/\n{3,}/", "\n\n", $s) ?? '';
    return mb_substr(trim($s), 0, $max, 'UTF-8');
}

function valid_email(string $v): bool
{
    $v = trim($v);
    if (strlen($v) < 6 || strlen($v) > 254) return false;
    return (bool) preg_match('/^[^\s@,;:<>()\[\]\\\\"]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/', $v);
}

function valid_phone(string $v): bool
{
    $digits = preg_replace('/\D/', '', $v) ?? '';
    return (bool) preg_match('/^[+\d][\d\s\-().]{6,19}$/', trim($v)) && strlen($digits) >= 7 && strlen($digits) <= 15;
}

function ft(int $n): string
{
    // A hu-HU formátumot követjük: 4 jegyű számot nem tagolunk.
    return ($n >= 10000 ? number_format($n, 0, ',', ' ') : (string) $n) . ' Ft';
}

function mime_header(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

/* ───────────────────────────── Kérés ellenőrzése ───────────────────────────── */

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET' && isset($_GET['allapot'])) {
    // Telepítési állapotjelzés — titkot és címet nem ad ki.
    respond(200, [
        'ok' => true,
        'vegpont' => 'rendeles',
        'php' => PHP_VERSION,
        'kuldes' => in_array($cfg['transport'], ['smtp', 'mail'], true) ? $cfg['transport'] : 'teszt',
        'smtpBeallitva' => (bool) ($cfg['smtp_host'] && $cfg['smtp_user'] && $cfg['smtp_pass']),
        'mailFuggveny' => function_exists('mail'),
    ]);
}
if ($method !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'message' => 'Nem támogatott kérés.']);
}

// Csak a saját oldalról (vagy kifejezetten engedélyezett originről) fogadunk.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $self = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '');
    $allowed = array_map('strtolower', $cfg['allowed_origins']);
    if ($host === '' || ($host !== $self && !in_array(strtolower(rtrim($origin, '/')), $allowed, true))) {
        respond(403, ['ok' => false, 'message' => 'Nem engedélyezett beküldési forrás.']);
    }
}

$ctype = strtolower($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
if (strpos($ctype, 'application/json') === false) {
    respond(415, ['ok' => false, 'message' => 'Nem támogatott adatformátum.']);
}

$len = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($len > MAX_BODY_BYTES) {
    respond(413, ['ok' => false, 'message' => 'A beküldött adat túl nagy.']);
}
$body = (string) file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if (strlen($body) > MAX_BODY_BYTES) {
    respond(413, ['ok' => false, 'message' => 'A beküldött adat túl nagy.']);
}

$state = state_dir($cfg);
[$allowedRate, $retry] = rate_limit_ok($state, (string) ($_SERVER['REMOTE_ADDR'] ?? 'ismeretlen'), $cfg['rate_limit']);
if (!$allowedRate) {
    header('Retry-After: ' . $retry);
    respond(429, [
        'ok' => false,
        'message' => 'Túl sok beküldés érkezett rövid időn belül. Kérjük, próbálja újra később, vagy hívjon minket telefonon: +36 30 852 8909.',
        'retryAfterSeconds' => $retry,
    ]);
}

try {
    $in = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    respond(400, ['ok' => false, 'message' => 'Érvénytelen adat.']);
}
if (!is_array($in)) respond(400, ['ok' => false, 'message' => 'Érvénytelen adat.']);

$data = require __DIR__ . '/rendeles-adatok.php';

/* ───────────────────────────── Validáció ───────────────────────────── */

$errors = [];
$str = static fn (string $k): string => is_string($in[$k] ?? null) ? trim($in[$k]) : '';

// Rejtett „csapda" mező: ember nem tölti ki.
if ($str('website') !== '') {
    respond(422, ['ok' => false, 'message' => 'Kérjük, ellenőrizze a megjelölt mezőket.', 'errors' => []]);
}

$name = $str('name');
if (mb_strlen($name) < 2 || mb_strlen($name) > 120) $errors['name'] = 'Kérjük, adja meg a nevét.';
$email = $str('email');
if (!valid_email($email)) $errors['email'] = 'Kérjük, érvényes e-mail-címet adjon meg.';
$phone = $str('phone');
if (mb_strlen($phone) > 40 || !valid_phone($phone)) $errors['phone'] = 'Kérjük, érvényes telefonszámot adjon meg.';

$slug = $str('materialSlug');
$material = $data['materials'][$slug] ?? null;
if ($material === null) $errors['materialSlug'] = 'Ismeretlen anyag.';

$m3 = $in['m3'] ?? null;
if (!is_int($m3) || $m3 < $data['minM3'] || $m3 > $data['maxM3']) {
    $errors['m3'] = "A mennyiség {$data['minM3']}–{$data['maxM3']} m³ között adható meg.";
    $m3 = (int) $data['minM3'];
}

$muni = $str('municipalityId');
$municipality = null;
foreach ($data['municipalities'] as $m) if ($m['id'] === $muni) $municipality = $m;
if ($municipality === null) $errors['municipalityId'] = 'Kérjük, válassza ki a települést.';

$district = $in['districtId'] ?? null;
if ($district !== null && (!is_int($district) || $district < 1 || $district > 23)) {
    $errors['districtId'] = 'Érvénytelen kerület.';
    $district = null;
}
if ($muni === 'budapest' && $district === null && !isset($errors['districtId'])) {
    $errors['districtId'] = 'Budapest esetén a kerület megadása kötelező.';
}
if ($muni !== 'budapest') $district = null;

$postal = preg_replace('/\D/', '', $str('postalCode')) ?? '';
if (!preg_match('/^\d{4}$/', $postal)) $errors['postalCode'] = 'Az irányítószám négy számjegy.';

$address = $str('address');
if (mb_strlen($address) < 4 || mb_strlen($address) > 240) $errors['address'] = 'Kérjük, adja meg a szállítási címet.';

$date = $str('preferredDate');
if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) $errors['preferredDate'] = 'Érvénytelen dátum.';

$castle = $str('castleAnswer');
if (!in_array($castle, ['', 'igen', 'nem', 'nem-tudom'], true)) $errors['castleAnswer'] = 'Érvénytelen válasz.';

$noteRaw = is_string($in['note'] ?? null) ? $in['note'] : '';
if (mb_strlen($noteRaw) > 2000) $errors['note'] = 'A megjegyzés legfeljebb 2000 karakter lehet.';

$idem = $str('idempotencyKey');
if (!preg_match('/^[A-Za-z0-9._:-]{8,80}$/', $idem)) $errors['idempotencyKey'] = 'Érvénytelen beküldés-azonosító.';

if (($in['privacyAccepted'] ?? null) !== true) $errors['privacyAccepted'] = 'Az adatkezelési tájékoztató elfogadása szükséges.';

/* Számlázási adatok — OPCIONÁLIS blokk (lásd src/lib/order.ts billingSchema).
   Ha a blokk szerepel, legyen teljes; magánszemélynél adószám nem kerül tovább.
   Az adószám csak FORMAILAG ellenőrzött (nem NAV-lekérdezés). */
$billing = null;
$billingRaw = $in['billing'] ?? null;
if ($billingRaw !== null) {
    if (!is_array($billingRaw)) {
        $errors['billing'] = 'Érvénytelen számlázási adat.';
    } else {
        $bs = static fn ($arr, string $k): string => is_array($arr) && is_string($arr[$k] ?? null) ? trim($arr[$k]) : '';
        $addr = is_array($billingRaw['address'] ?? null) ? $billingRaw['address'] : [];
        $ctype = $bs($billingRaw, 'customerType');
        $bName = $bs($billingRaw, 'name');
        $bTax = preg_replace('/\s+/u', '', $bs($billingRaw, 'taxNumber')) ?? '';
        $bCountry = $bs($addr, 'country');
        $bPostal = $bs($addr, 'postalCode');
        $bCity = $bs($addr, 'city');
        $bStreet = $bs($addr, 'streetAddress');
        $bExtra = $bs($addr, 'additionalAddress');
        $isHu = in_array(mb_strtolower($bCountry, 'UTF-8'), ['magyarország', 'magyarorszag', 'hungary', 'hu'], true);

        if (!in_array($ctype, ['private', 'business'], true)) $errors['billing.customerType'] = 'Kérjük, válassza ki a vevő típusát.';
        if (mb_strlen($bName) < 2 || mb_strlen($bName) > 160) $errors['billing.name'] = 'Kérjük, adja meg a számlázási nevet.';
        if (mb_strlen($bCountry) < 2 || mb_strlen($bCountry) > 60) $errors['billing.address.country'] = 'Kérjük, adja meg az országot.';
        if (mb_strlen($bPostal) < 3 || mb_strlen($bPostal) > 10) {
            $errors['billing.address.postalCode'] = 'Kérjük, adja meg az irányítószámot.';
        } elseif ($isHu && !preg_match('/^\d{4}$/', $bPostal)) {
            $errors['billing.address.postalCode'] = 'A magyar irányítószám négy számjegy.';
        }
        if (mb_strlen($bCity) < 2 || mb_strlen($bCity) > 80) $errors['billing.address.city'] = 'Kérjük, adja meg a települést.';
        if (mb_strlen($bStreet) < 3 || mb_strlen($bStreet) > 160) $errors['billing.address.streetAddress'] = 'Kérjük, adja meg a közterületet és a házszámot.';
        if (mb_strlen($bExtra) > 120) $errors['billing.address.additionalAddress'] = 'A további címadat legfeljebb 120 karakter lehet.';

        $taxOut = '';
        if ($ctype === 'business') {
            if ($bTax === '') {
                $errors['billing.taxNumber'] = 'Kérjük, adja meg az adószámot.';
            } elseif ($isHu) {
                if (preg_match('/^(\d{8})-?([1-5])-?(\d{2})$/', $bTax, $m)) {
                    $taxOut = "{$m[1]}-{$m[2]}-{$m[3]}";
                } else {
                    $errors['billing.taxNumber'] = 'Az adószám formátuma: 12345678-1-12 (11 számjegy).';
                }
            } elseif (preg_match('/^[A-Za-z0-9][A-Za-z0-9.\-\/]{2,19}$/', $bTax)) {
                $taxOut = $bTax;
            } else {
                $errors['billing.taxNumber'] = 'Kérjük, ellenőrizze az adóazonosítót.';
            }
        }
        $billing = [
            'type' => $ctype,
            'name' => $bName,
            'tax' => $taxOut, // magánszemélynél mindig üres
            'country' => $bCountry,
            'postal' => $bPostal,
            'city' => $bCity,
            'street' => $bStreet,
            'extra' => $bExtra,
        ];
    }
}

$clientTotal = $in['clientTotalGross'] ?? null;
if ($clientTotal !== null && (!is_int($clientTotal) || $clientTotal < 0)) $clientTotal = null;

if ($errors) {
    respond(422, ['ok' => false, 'message' => 'Kérjük, ellenőrizze a megjelölt mezőket.', 'errors' => $errors]);
}

if (idem_seen($state, $idem)) {
    respond(200, [
        'ok' => true,
        'duplicate' => true,
        'mock' => false,
        'message' => 'Ezt a rendelési igényt már megkaptuk. Hamarosan jelentkezünk a visszaigazolással.',
    ]);
}

/* ───────────────────── Szerveroldali újraszámolás ───────────────────── */

$roman = static fn (int $d): string => $data['roman'][$d - 1] ?? (string) $d;

$unit = $material['priceGross'];
$materialSubtotal = $unit === null ? null : (int) round($unit * $m3);

$byCode = null;
foreach ($data['profiles'] as $p) if (in_array($postal, $p['postalCodes'], true)) $byCode = $p;
$selected = array_values(array_filter($data['profiles'], static fn ($p) => $p['municipalityId'] === $muni && (!$municipality['requiresDistrict'] || $p['districtId'] === $district)));
$selectedLabel = $municipality['requiresDistrict'] ? 'Budapest ' . $roman((int) $district) . ' kerület' : $municipality['name'];

$freight = ['kind' => 'ok'];
if ($byCode === null) {
    $freight = ['kind' => $selected ? 'mismatch' : 'unsupported'];
} elseif (!in_array($byCode, $selected, true)) {
    $freight = ['kind' => 'mismatch', 'actual' => $byCode['label']];
} else {
    $band = null;
    foreach ($byCode['bands'] as $b) if ($m3 <= $b['upTo']) { $band = $b; break; }
    $profileMax = end($byCode['bands'])['upTo'];
    $freight = $band === null
        ? ['kind' => 'quote-required', 'profileMax' => $profileMax]
        : ['kind' => 'ok', 'net' => $band['netFee'], 'label' => $band['label']];
}

$needsPermit = $district === $data['castleDistrictId'] && in_array($castle, ['', 'igen', 'nem-tudom'], true);
$freightNet = $freight['kind'] === 'ok' ? (int) $freight['net'] : null;
$freightVat = $freightNet === null ? null : (int) round($freightNet * $data['vatRate']);
$freightGross = $freightNet === null ? null : $freightNet + $freightVat;
$total = ($materialSubtotal !== null && $freightGross !== null && !$needsPermit) ? $materialSubtotal + $freightGross : null;
$mismatch = $clientTotal !== $total;

/* ───────────────────────────── Levél ───────────────────────────── */

$isTest = ($_SERVER['HTTP_X_SODERARAK_TESZT'] ?? '') === '1';
$L = [];
$L[] = 'RENDELÉSI IGÉNY — soderarak.hu árkalkulátor';
if ($isTest) {
    $L[] = '';
    $L[] = '*** TESZTLEVÉL — nem valódi megrendelés. ***';
}
$L[] = '';
$L[] = $data['texts']['orderIntent'];
$L[] = '';
$L[] = '── Vevő típusa ──';
if ($billing === null) {
    $L[] = 'Nem adta meg (a számlázási adatok nélkül kért ajánlatot).';
    $L[] = '';
    $L[] = '── Számlázási adatok ──';
    $L[] = 'Nem adott meg számlázási adatot — számlázás előtt egyeztetni kell.';
} else {
    $L[] = $billing['type'] === 'business' ? 'Cég / egyéni vállalkozó' : 'Magánszemély';
    $L[] = '';
    $L[] = '── Számlázási adatok ──';
    $L[] = ($billing['type'] === 'business' ? 'Cégnév / számlázási név: ' : 'Számlázási név: ') . clean_line($billing['name'], 160);
    if ($billing['type'] === 'business') $L[] = 'Adószám: ' . clean_line($billing['tax'], 20) . ' (formailag ellenőrizve, NAV-nál nem)';
    $L[] = 'Ország: ' . clean_line($billing['country'], 60);
    $L[] = 'Irányítószám: ' . clean_line($billing['postal'], 10);
    $L[] = 'Település: ' . clean_line($billing['city'], 80);
    $L[] = 'Közterület, házszám: ' . clean_line($billing['street'], 160);
    if ($billing['extra'] !== '') $L[] = 'További címadat: ' . clean_line($billing['extra'], 120);
}
$L[] = '';
$L[] = '── Kapcsolattartó ──';
$L[] = 'Név: ' . clean_line($name, 120);
$L[] = 'E-mail: ' . clean_line($email, 254);
$L[] = 'Telefon: ' . clean_line($phone, 40);
$L[] = '';
$L[] = '── Szállítási adatok ──';
$L[] = 'Település: ' . $municipality['name'];
$L[] = 'Kerület: ' . ($district ? $roman($district) : '—');
$L[] = 'Irányítószám: ' . $postal;
$L[] = 'Szállítási cím (utca, házszám): ' . clean_line($address, 240);
$L[] = 'Kívánt időpont: ' . ($date !== '' ? $date : 'nem adott meg');
$L[] = '';
$L[] = '── Behajtási engedély / Vár ──';
if ($district === $data['castleDistrictId']) {
    $answer = ['igen' => 'Igen', 'nem' => 'Nem', 'nem-tudom' => 'Nem tudom', '' => 'nem válaszolt'][$castle];
    $L[] = $data['texts']['castleQuestion'] . ' → ' . $answer;
    if ($needsPermit) {
        $L[] = 'FIGYELEM: a Vár területe miatt külön engedély és előzetes egyeztetés szükséges.';
        $L[] = 'Az engedély díja még nem ismert — a végösszeg nem garantált.';
    }
} else {
    $L[] = $data['texts']['permit'];
}
$L[] = '';
$L[] = '── Kalkuláció és kért anyag ──';
$L[] = 'Anyag és termékváltozat: ' . $material['name'];
if ($material['wash']) $L[] = 'Mosottság: ' . $material['wash'];
if ($material['unclassified']) $L[] = 'Minőségjelölés: osztályozatlan termék';
$L[] = "Mennyiség: {$m3} m³";
$L[] = '';
$L[] = '── Árösszesítő (szerveroldalon újraszámolva) ──';
$L[] = $unit === null ? 'Anyag bruttó egységár: egyeztetés után' : 'Anyag bruttó egységár: ' . ft((int) $unit) . '/m³';
$L[] = "Mennyiség: {$m3} m³";
$L[] = $materialSubtotal === null ? 'Anyag bruttó részösszeg: egyeztetés után' : 'Anyag bruttó részösszeg: ' . ft($materialSubtotal);
if ($freightNet !== null) {
    $L[] = 'Fuvar nettó díj (' . $freight['label'] . '): ' . ft($freightNet);
    $L[] = 'Fuvar ÁFA (' . (int) round($data['vatRate'] * 100) . '%): ' . ft($freightVat);
    $L[] = 'Fuvar bruttó díj: ' . ft($freightGross);
} else {
    $L[] = 'Fuvar díja: egyedi egyeztetés szükséges';
}
if ($needsPermit) $L[] = 'Behajtási engedély (Vár területe): külön egyeztetés, az engedély díja még nem ismert.';
$L[] = $total === null
    ? 'Teljes bruttó összeg: egyeztetés után (a fenti ismert tételek tájékoztató jellegűek)'
    : 'Teljes bruttó tájékoztató összeg: ' . ft($total);
if ($freight['kind'] === 'unsupported') $L[] = $data['texts']['unsupported'];
if ($freight['kind'] === 'mismatch') $L[] = "FIGYELEM: az irányítószám ({$postal}) nem egyezik a választott területtel ({$selectedLabel}).";
if ($freight['kind'] === 'quote-required') $L[] = "FIGYELEM: ehhez a mennyiséghez ({$m3} m³) nincs egyfuvaros díj — legfeljebb {$freight['profileMax']} m³. Egyedi egyeztetés szükséges.";
if ($mismatch) {
    $L[] = '';
    $L[] = 'FIGYELEM: a kalkulátorban megjelenített összeg (' . ($clientTotal === null ? '—' : ft($clientTotal)) . ') eltér a szerveroldali összegtől. A hiteles érték a fenti.';
}
$L[] = '';
$L[] = '── Megjegyzés ──';
$note = clean_block($noteRaw, 2000);
$L[] = $note !== '' ? $note : '—';
$L[] = '';
$L[] = 'Árazási verzió: ' . $data['pricingVersion'];
$L[] = 'Beküldés azonosító: ' . $idem;
$L[] = 'Beküldve: ' . gmdate('Y-m-d H:i') . ' (UTC)';
$text = implode("\r\n", $L) . "\r\n";

$subject = clean_line(($isTest ? '[TESZT] ' : '') . "Rendelési igény: {$material['name']} {$m3} m³ — {$postal}", 180);
$replyTo = clean_line($email, 254);
$from = clean_line($cfg['from'], 254);
$fromName = clean_line($cfg['from_name'], 80);
if (!valid_email($from)) $from = RECIPIENT;

// Címzettek: megrendeles@soderarak.hu mindig + a konfigurált további címek (max. 3, validálva).
$recipients = [RECIPIENT];
foreach (explode(',', $cfg['extra_recipients']) as $extra) {
    $extra = clean_line($extra, 254);
    if ($extra !== '' && valid_email($extra) && !in_array(strtolower($extra), array_map('strtolower', $recipients), true) && count($recipients) < 4) {
        $recipients[] = $extra;
    }
}
$toHeader = implode(', ', $recipients);

$domain = substr(strrchr($from, '@') ?: '@soderarak.hu', 1);
$headers = [
    'From' => mime_header($fromName) . " <{$from}>",
    'Reply-To' => $replyTo,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'base64',
    'Message-ID' => '<' . bin2hex(random_bytes(12)) . '@' . $domain . '>',
    'Date' => date(DATE_RFC2822),
];
$encodedBody = chunk_split(base64_encode($text), 76, "\r\n");

/* ───────────────────────────── Küldés ───────────────────────────── */

function smtp_send(array $cfg, string $from, array $to, string $subject, array $headers, string $body): bool
{
    $host = (string) $cfg['smtp_host'];
    $port = (int) $cfg['smtp_port'];
    $secure = $cfg['smtp_secure'];
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) return false;
    stream_set_timeout($fp, 20);
    $read = static function () use ($fp): string {
        $out = '';
        while (($line = fgets($fp, 515)) !== false) {
            $out .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $out;
    };
    $cmd = static function (string $c, array $ok) use ($fp, $read): bool {
        fwrite($fp, $c . "\r\n");
        return in_array((int) substr($read(), 0, 3), $ok, true);
    };
    if ((int) substr($read(), 0, 3) !== 220) { fclose($fp); return false; }
    $ehlo = 'EHLO ' . (gethostname() ?: 'localhost');
    if (!$cmd($ehlo, [250])) { fclose($fp); return false; }
    if ($secure === 'tls') {
        if (!$cmd('STARTTLS', [220])) { fclose($fp); return false; }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) { fclose($fp); return false; }
        if (!$cmd($ehlo, [250])) { fclose($fp); return false; }
    }
    if ($cfg['smtp_user'] !== null) {
        if (!$cmd('AUTH LOGIN', [334])) { fclose($fp); return false; }
        if (!$cmd(base64_encode((string) $cfg['smtp_user']), [334])) { fclose($fp); return false; }
        if (!$cmd(base64_encode((string) $cfg['smtp_pass']), [235])) { fclose($fp); return false; }
    }
    if (!$cmd("MAIL FROM:<{$from}>", [250])) { fclose($fp); return false; }
    foreach ($to as $rcpt) {
        if (!$cmd("RCPT TO:<{$rcpt}>", [250, 251])) { fclose($fp); return false; }
    }
    if (!$cmd('DATA', [354])) { fclose($fp); return false; }
    $msg = "To: " . implode(', ', $to) . "\r\nSubject: " . mime_header($subject) . "\r\n";
    foreach ($headers as $k => $v) $msg .= "{$k}: {$v}\r\n";
    $msg .= "\r\n" . preg_replace('/^\./m', '..', $body);
    fwrite($fp, $msg . "\r\n.\r\n");
    $accepted = (int) substr($read(), 0, 3) === 250;
    $cmd('QUIT', [221]);
    fclose($fp);
    return $accepted;
}

$accepted = false;
try {
    switch ($cfg['transport']) {
        case 'smtp':
            $accepted = smtp_send($cfg, $from, $recipients, $subject, $headers, $encodedBody);
            break;
        case 'file': // CSAK automata teszthez: ORDER_TEST_DIR-be ír, nem küld.
            $dir = (string) $cfg['test_dir'];
            if ($dir !== '' && is_dir($dir)) {
                $raw = "To: {$toHeader}\r\nSubject: {$subject}\r\n";
                foreach ($headers as $k => $v) $raw .= "{$k}: {$v}\r\n";
                $accepted = file_put_contents($dir . '/' . $idem . '.eml', $raw . "\r\n" . $text) !== false;
            }
            break;
        case 'fail': // CSAK automata teszthez: a küldő elutasítását szimulálja.
            $accepted = false;
            break;
        default:
            $hdr = '';
            foreach ($headers as $k => $v) $hdr .= "{$k}: {$v}\r\n";
            $accepted = function_exists('mail') && mail($toHeader, mime_header($subject), $encodedBody, rtrim($hdr), '-f' . $from);
    }
} catch (Throwable $e) {
    $accepted = false;
}

if (!$accepted) {
    // Belső részlet (szerver, jelszó, szolgáltatói válasz) soha nem megy vissza.
    error_log('soderarak rendeles: a levelet a küldő nem vette át (' . $cfg['transport'] . ')');
    respond(502, ['ok' => false, 'message' => 'A beküldés most nem sikerült. ' . PHONE_FALLBACK]);
}

@touch(idem_file($state, $idem));

respond(200, [
    'ok' => true,
    'mock' => false,
    'duplicate' => false,
    'message' => 'Rendelési igényét továbbítottuk. A megrendelés a részletek egyeztetése és visszaigazolásunk után válik véglegessé.',
    'serverTotalGross' => $total,
    'totalMismatch' => $mismatch,
]);
