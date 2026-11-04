<?php
/**
 * MINTA — a rendelési végpont beállításai. TITKOT NE TÁROLJ A REPÓBAN!
 *
 * Használat: másold le `soderarak-rendeles-config.php` néven a tárhelyen a
 * webgyökér (pl. public_html) FÖLÉ, azaz olyan mappába, amely böngészőből
 * nem érhető el, és töltsd ki. Ugyanezek a kulcsok környezeti változóként
 * (pl. .htaccess `SetEnv`) is megadhatók — a környezeti változó erősebb.
 *
 * Ha semmit nem adsz meg, a végpont a tárhely saját PHP mail() függvényével
 * küld, feladóként az info@soderarak.hu címmel. Hogy ez a tárhelyen
 * működik-e, azt csak egy (jóváhagyott) tesztlevél mutatja meg.
 */
return [
    // 'mail' (alapértelmezés: a tárhely PHP mail() függvénye) vagy 'smtp'.
    'ORDER_TRANSPORT' => 'mail',

    // Feladó: a levelezőszolgáltatónál engedélyezett, hitelesített cím.
    'ORDER_MAIL_FROM' => 'info@soderarak.hu',
    'ORDER_MAIL_FROM_NAME' => 'Sóderárak weboldal',

    // Csak SMTP esetén — az értékeket a tárhely/levelezés szolgáltatója adja meg.
    // 'ORDER_SMTP_HOST' => '',
    // 'ORDER_SMTP_PORT' => 587,        // 587 = STARTTLS ('tls'), 465 = 'ssl'
    // 'ORDER_SMTP_SECURE' => 'tls',
    // 'ORDER_SMTP_USER' => '',
    // 'ORDER_SMTP_PASS' => '',

    // Opcionális: további engedélyezett beküldési forrás(ok), vesszővel
    // (pl. 'https://www.soderarak.hu'). A saját domain mindig engedélyezett.
    // 'ORDER_ALLOWED_ORIGINS' => '',
];
