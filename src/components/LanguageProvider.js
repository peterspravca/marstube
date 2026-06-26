"use client";

import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  sk: {
    "home.subtitle1": "Bez reklám, bez prerušení.",
    "home.subtitle2": "Váš osobný, prémiový zážitok.",
    "home.history": "História sledovania",
    "home.trending": "Trendy",
    "home.noTrending": "Momentálne nie sú dostupné žiadne trendy.",
    "search.placeholder": "Vyhľadať video...",
    "search.button": "Vyhľadať",
    "search.loading": "Vyhľadávam...",
    "search.processing": "Spracovávam požiadavku, prosím počkajte.",
    "auth.loginBtn": "Prihlásiť / Registrovať",
    "auth.login": "Prihlásiť sa",
    "auth.logout": "Odhlásiť sa",
    "auth.logoutBtn": "Odhlásiť sa",
    "auth.loggedInAs": "Prihlásený ako:",
    "auth.modalTitle": "Prihlásenie / Registrácia",
    "auth.name": "Meno",
    "auth.password": "Heslo",
    "auth.submitBtn": "Prihlásiť / Zaregistrovať",
    "auth.enterName": "Zadajte meno",
    "auth.enterPassword": "Zadajte heslo",
    "auth.modalLogin": "Prihlásenie",
    "auth.modalRegister": "Registrácia",
    "auth.modalVerify": "Overenie E-mailu",
    "auth.modalForgot": "Obnova hesla",
    "auth.emailPlaceholder": "Email",
    "auth.passwordPlaceholder": "Heslo",
    "auth.noAccount": "Nemáte účet? Zaregistrujte sa",
    "auth.hasAccount": "Už máte účet? Prihláste sa",
    "auth.forgotPasswordBtn": "Zabudnuté heslo?",
    "auth.verifyBtn": "Overiť",
    "auth.sendResetBtn": "Zaslať odkaz na obnovu",
    "auth.backToLogin": "Späť na prihlásenie",
    "playlist.title": "Tvoj Playlist",
    "playlist.myMusic": "Moja hudba",
    "playlist.add": "Pridať playlist",
    "playlist.close": "Zavrieť",
    "playlist.registerBannerBold": "Viete, že...?",
    "playlist.registerBannerText": " Uložte si obľúbené videá a playlisty natrvalo. Stačí sa zaregistrovať.",
    "playlist.registerBtn": "Zaregistrovať sa",
    "playlist.addPrompt": "Vložte ID alebo odkaz na YouTube playlist:",
    "playlist.addPlaceholder": "Napr. PLxxx... alebo celý YouTube odkaz",
    "playlist.addBtn": "Pridať",
    "playlist.inputId": "Vložiť ID nového playlistu",
    "playlist.load": "Načítať",
    "playlist.playAll": "Prehrávať všetko",
    "playlist.empty": "V tomto playliste nie sú žiadne videá.",
    "playlist.delete": "Zmazať Playlist",
    "playlist.save": "Uložiť Playlist",
    "history.empty": "V histórii nemáte žiadne videá.",
    "history.clear": "Zmazať históriu",
    "history.showMore": "Zobraziť viac",
    "history.showLess": "Zobraziť menej",
    "player.favorite": "Obľúbené",
    "player.downloadAudio": "Stiahnuť Hudbu (MP3)",
    "player.downloadVideo": "Stiahnuť Video (MP4)",
    "player.removeFavorite": "Odstrániť z obľúbených",
    "player.addFavorite": "Pridať do obľúbených",
    "player.music": "Hudba",
    "player.video": "Video",
    "player.noAudio": "Nenašla sa žiadna audio stopa.",
    "player.streamError": "Nepodarilo sa načítať stream.",
    "player.experience": "zážitok",
    "player.preparingExperience": "Pripravujem",
    "player.audioError": "Nepodarilo sa prehrať audio priamo",
    "player.audioStreamError": "Chyba prípravy audio streamu.",
    "player.fallbackWarning": "Upozornenie: Nepodarilo sa prehrať súbor priamo",
    "player.error": "Chyba",
    "player.unknownError": "Neznáma chyba",
    "player.fallbackLoaded": "Preto bol načítaný oficiálny YouTube prehrávač.",
    "player.previous": "Predchádzajúca",
    "player.next": "Nasledujúca",
    "home.footer": "© 2026 Peter Maršo. Všetky práva vyhradené.",
    "watch.error": "Nepodarilo sa načítať video. Skontrolujte URL alebo skúste iné video.",
    "search.resultsFor": "Výsledky pre: ",
    "search.noResults": "Nenašli sa žiadne výsledky. Skúste iný výraz.",
    "common.loading": "Načítavam...",
    "common.processing": "Spracovávam údaje, prosím počkajte.",
    "common.home": "Domov",
    "auth.resetPasswordTitle": "Obnova ",
    "auth.resetPasswordTitleBold": "hesla",
    "auth.resetPasswordBtn": "Zmeniť heslo",
    "auth.loadingWait": "Čakajte...",
  },
  en: {
    "home.subtitle1": "Ad-free, without interruptions.",
    "home.subtitle2": "Your personal, premium experience.",
    "home.history": "Watch History",
    "home.trending": "Trending",
    "home.noTrending": "No trending videos available at the moment.",
    "search.placeholder": "Search for a video...",
    "search.button": "Search",
    "search.loading": "Searching...",
    "search.processing": "Processing your request, please wait.",
    "auth.loginBtn": "Login / Register",
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.logoutBtn": "Logout",
    "auth.loggedInAs": "Logged in as:",
    "auth.modalTitle": "Login / Registration",
    "auth.name": "Username",
    "auth.password": "Password",
    "auth.submitBtn": "Login / Register",
    "auth.enterName": "Enter username",
    "auth.enterPassword": "Enter password",
    "auth.modalLogin": "Login",
    "auth.modalRegister": "Registration",
    "auth.modalVerify": "Email Verification",
    "auth.modalForgot": "Password Recovery",
    "auth.emailPlaceholder": "Email",
    "auth.passwordPlaceholder": "Password",
    "auth.noAccount": "Don't have an account? Register",
    "auth.hasAccount": "Already have an account? Login",
    "auth.forgotPasswordBtn": "Forgot password?",
    "auth.verifyBtn": "Verify",
    "auth.sendResetBtn": "Send recovery link",
    "auth.backToLogin": "Back to login",
    "playlist.title": "Your Playlist",
    "playlist.myMusic": "My Music",
    "playlist.add": "Add playlist",
    "playlist.close": "Close",
    "playlist.registerBannerBold": "Did you know...?",
    "playlist.registerBannerText": " Save your favorite videos and playlists permanently. Just register.",
    "playlist.registerBtn": "Register",
    "playlist.addPrompt": "Enter ID or YouTube playlist link:",
    "playlist.addPlaceholder": "E.g. PLxxx... or full YouTube link",
    "playlist.addBtn": "Add",
    "playlist.inputId": "Enter new playlist ID",
    "playlist.load": "Load",
    "playlist.playAll": "Play All",
    "playlist.empty": "There are no videos in this playlist.",
    "playlist.delete": "Delete Playlist",
    "playlist.save": "Save Playlist",
    "history.empty": "You have no videos in your history.",
    "history.clear": "Clear history",
    "history.showMore": "Show more",
    "history.showLess": "Show less",
    "player.favorite": "Favorite",
    "player.downloadAudio": "Download Audio (MP3)",
    "player.downloadVideo": "Download Video (MP4)",
    "player.removeFavorite": "Remove from favorites",
    "player.addFavorite": "Add to favorites",
    "player.music": "Music",
    "player.video": "Video",
    "player.noAudio": "No audio track found.",
    "player.streamError": "Failed to load stream.",
    "player.experience": "experience",
    "player.preparingExperience": "Preparing",
    "player.audioError": "Failed to play audio directly",
    "player.audioStreamError": "Audio stream preparation error.",
    "player.fallbackWarning": "Warning: Failed to play file directly",
    "player.error": "Error",
    "player.unknownError": "Unknown error",
    "player.fallbackLoaded": "The official YouTube player has been loaded instead.",
    "player.previous": "Previous",
    "player.next": "Next",
    "home.footer": "© 2026 Peter Maršo. All rights reserved.",
    "watch.error": "Failed to load video. Check the URL or try another video.",
    "search.resultsFor": "Results for: ",
    "search.noResults": "No results found. Try a different query.",
    "common.loading": "Loading...",
    "common.processing": "Processing data, please wait.",
    "common.home": "Home",
    "auth.resetPasswordTitle": "Password ",
    "auth.resetPasswordTitleBold": "Recovery",
    "auth.resetPasswordBtn": "Reset password",
    "auth.loadingWait": "Please wait...",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("sk");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    } else {
      setLanguage("sk");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("language", language);
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  // Na serveri vyrenderujeme default (slovenčinu), aby sa zamedzilo hydration mismatch, 
  // aj keď sa potom na klientovi prepne do EN.
  const contextValue = mounted 
    ? { language, setLanguage, t }
    : { language: "sk", setLanguage: () => {}, t: (key) => translations["sk"]?.[key] || key };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
