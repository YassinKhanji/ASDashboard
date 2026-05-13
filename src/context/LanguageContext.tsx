"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar
    overview: "Overview",
    projects: "Projects",
    students: "Students",
    staff: "Staff",
    calendar: "Calendar",
    discussions: "Discussions",
    governance: "Governance",
    settings: "Settings",
    search_placeholder: "Search...",
    notifications: "Notifications",
    clear_all: "Clear all",
    no_notifications: "Your inbox is empty",
    new_notif_count: "NEW",
    user_role_admin: "Admin",
    
    // Dashboard / Projects
    active: "Active",
    approved: "Approved",
    submitted: "Submitted",
    under_review: "Under Review",
    draft: "Draft",
    rejected: "Rejected",
    completed: "Completed",
    archived: "Archived",
    new_project: "New Project",
    back_to_projects: "Back to projects",
    project_details: "Project details",
    
    // UI
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    
    // Dashboard Specific
    enrollments_activity: "Enrollments (Activity)",
    project_breakdown: "Project Breakdown",
    recent_projects: "Recent Projects",
    upcoming_sessions: "Upcoming Sessions",
    view_all: "View all",
    week: "Week",
    month: "Month",
    year: "Year",
    total: "Total",
    review: "Review",
  },
  fr: {
    // Sidebar
    overview: "Aperçu",
    projects: "Projets",
    students: "Étudiants",
    staff: "Personnel",
    calendar: "Calendrier",
    discussions: "Discussions",
    governance: "Gouvernance",
    settings: "Paramètres",
    search_placeholder: "Rechercher...",
    notifications: "Notifications",
    clear_all: "Tout effacer",
    no_notifications: "Votre boîte de réception est vide",
    new_notif_count: "NEUF",
    user_role_admin: "Administrateur",
    
    // Dashboard / Projets
    active: "Actif",
    approved: "Approuvé",
    submitted: "Soumis",
    under_review: "En révision",
    draft: "Brouillon",
    rejected: "Rejeté",
    completed: "Terminé",
    archived: "Archivé",
    new_project: "Nouveau Projet",
    back_to_projects: "Retour aux projets",
    project_details: "Détails du projet",
    
    // UI
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    loading: "Chargement...",
    
    // Dashboard Specific
    enrollments_activity: "Inscriptions (Activité)",
    project_breakdown: "Répartition des Projets",
    recent_projects: "Projets Récents",
    upcoming_sessions: "Sessions à Venir",
    view_all: "Tout voir",
    week: "Semaine",
    month: "Mois",
    year: "Année",
    total: "Total",
    review: "Revue",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr"); // Default to French as requested

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "en" || saved === "fr")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
