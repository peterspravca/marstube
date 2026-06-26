const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    
    // add import if not there
    if (!content.includes('import { useLanguage } from')) {
        content = content.replace(/(import .*?;?\n)(?!import)/, `$1import { useLanguage } from "./LanguageProvider";\n`);
    }

    // add const { t } = useLanguage(); inside component
    if (!content.includes('const { t } = useLanguage();')) {
        content = content.replace(/(export default function \w+\(.*?\)\s*\{)/, `$1\n  const { t } = useLanguage();`);
    }

    // apply replacements
    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }

    fs.writeFileSync(path, content, 'utf8');
}

// PlaylistSection.js
replaceInFile('./src/components/PlaylistSection.js', [
    { from: />Moja hudba</g, to: '>{t("playlist.myMusic") || "Moja hudba"}<' },
    { from: />Obľúbené</g, to: '>{t("player.favorite")}<' },
    { from: />Pridať playlist</g, to: '>{t("playlist.add") || "Pridať playlist"}<' },
    { from: />Prehrávať všetko</g, to: '>{t("playlist.playAll")}<' },
    { from: />Zmazať Playlist</g, to: '>{t("playlist.delete")}<' },
    { from: />Načítať</g, to: '>{t("playlist.load")}<' },
    { from: /"Vložiť ID nového playlistu"/g, to: 't("playlist.inputId")' },
    { from: /"V tomto playliste nie sú žiadne videá\."/g, to: 't("playlist.empty")' }
]);

// AuthButton.js
replaceInFile('./src/components/AuthButton.js', [
    { from: />Prihlásiť \/ Registrovať</g, to: '>{t("auth.loginBtn")}<' },
    { from: />Odhlásiť sa</g, to: '>{t("auth.logout")}<' },
    { from: />Prihlásený ako:</g, to: '>{t("auth.loggedInAs")}<' }
]);

// AuthModal.js
replaceInFile('./src/components/AuthModal.js', [
    { from: />Prihlásenie \/ Registrácia</g, to: '>{t("auth.modalTitle")}<' },
    { from: />Meno</g, to: '>{t("auth.name")}<' },
    { from: />Heslo</g, to: '>{t("auth.password")}<' },
    { from: />Prihlásiť \/ Zaregistrovať</g, to: '>{t("auth.submitBtn")}<' },
    { from: /"Zadajte meno"/g, to: 't("auth.enterName")' },
    { from: /"Zadajte heslo"/g, to: 't("auth.enterPassword")' }
]);

// HistoryList.js
replaceInFile('./src/components/HistoryList.js', [
    { from: />V histórii nemáte žiadne videá\.</g, to: '>{t("history.empty")}<' },
    { from: />Zmazať históriu</g, to: '>{t("history.clear")}<' },
    { from: />Zobraziť viac</g, to: '>{t("history.showMore")}<' },
    { from: />Zobraziť menej</g, to: '>{t("history.showLess")}<' }
]);

// VideoPlayer.js
replaceInFile('./src/components/VideoPlayer.js', [
    { from: /> Obľúbené</g, to: '> {t("player.favorite")}<' },
    { from: />Stiahnuť Hudbu \(MP3\)</g, to: '>{t("player.downloadAudio")}<' },
    { from: />Stiahnuť Video \(MP4\)</g, to: '>{t("player.downloadVideo")}<' },
    { from: /title="Stiahnuť hudbu \(MP3\)"/g, to: 'title={t("player.downloadAudio")}' },
    { from: /title="Stiahnuť video \(MP4\)"/g, to: 'title={t("player.downloadVideo")}' },
    { from: /'Odstrániť z obľúbených'/g, to: 't("player.removeFavorite")' },
    { from: /'Pridať do obľúbených'/g, to: 't("player.addFavorite")' },
    { from: />Hudba</g, to: '>{t("player.music")}<' },
    { from: />Video</g, to: '>{t("player.video")}<' },
    { from: /"Nenašla sa žiadna audio stopa\."/g, to: 't("player.noAudio")' },
    { from: />Nepodarilo sa načítať stream\.</g, to: '>{t("player.streamError")}<' }
]);

console.log('done');
