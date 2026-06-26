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
    "auth.logout": "Odhlásiť sa",
    "auth.loggedInAs": "Prihlásený ako:",
    "auth.modalTitle": "Prihlásenie / Registrácia",
    "auth.name": "Meno",
    "auth.password": "Heslo",
    "auth.submitBtn": "Prihlásiť / Zaregistrovať",
    "auth.enterName": "Zadajte meno",
    "auth.enterPassword": "Zadajte heslo",
    "playlist.title": "Tvoj Playlist",
    "playlist.myMusic": "Moja hudba",
    "playlist.add": "Pridať playlist",
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
    "auth.logout": "Logout",
    "auth.loggedInAs": "Logged in as:",
    "auth.modalTitle": "Login / Registration",
    "auth.name": "Username",
    "auth.password": "Password",
    "auth.submitBtn": "Login / Register",
    "auth.enterName": "Enter username",
    "auth.enterPassword": "Enter password",
    "playlist.title": "Your Playlist",
    "playlist.myMusic": "My Music",
    "playlist.add": "Add playlist",
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
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith("en")) {
        setLanguage("en");
      }
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
