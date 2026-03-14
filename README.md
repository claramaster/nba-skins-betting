# NBA Skins — Paris amicaux

Application web de paris amicaux sur les matchs NBA pour 4 joueurs (Carlito, Papa, Vincent, Tonio). Utilisation sur **écran partagé**.

## Stack

- **Next.js 15** (App Router)
- **Supabase** (base de données)
- **balldontlie.io** (API NBA gratuite)
- **Auth** : 4 profils fixes + mot de passe commun

## Installation

1. Cloner / ouvrir le projet, puis :

```bash
cd nba-skins-betting
npm install
```

2. Créer un projet sur [Supabase](https://supabase.com) et exécuter le schéma SQL :

   - Fichier : `supabase/schema.sql`  
   - Coller son contenu dans l’éditeur SQL du tableau de bord Supabase et exécuter.

3. Obtenir une clé API gratuite sur [app.balldontlie.io](https://app.balldontlie.io).

4. Copier les variables d’environnement :

```bash
cp .env.local.example .env.local
```

Renseigner dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase)
- `APP_PASSWORD` : mot de passe commun pour les 4 joueurs
- `BALLDONTLIE_API_KEY` : clé API balldontlie

5. Lancer l’app :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Se connecter en choisissant un profil et le mot de passe.

## Modules

1. **Draft mensuelle**  
   Ordre et mode (serpent / régulier) tirés au sort. Chaque joueur draft 7 équipes et annonce W ou L pour le mois. Récap 4×7 + 2 équipes écartées.

2. **Matchs**  
   Matchs NBA du mois impliquant au moins une équipe draftée (scores, possesseurs, paris). Bouton « Rafraîchir » pour synchroniser avec l’API.

3. **Scores du mois**  
   1 point par pari correct. Égalisation : X = minimum de matchs joués parmi les 4 ; seuls les X premiers matchs chronologiques comptent.  
   **Clôturer le mois** : enregistre les rangs et attribue les points de saison (1er → 6 pts, 2e → 3 pts, 3e → 1 pt, ex-æquo partagés).

4. **Classement de saison**  
   Cumul des points de saison (novembre à avril). Tableau joueurs × mois + total. Historique des drafts consultable par mois.

## Production

- Définir `NEXT_PUBLIC_APP_URL` (URL publique de l’app) pour que « Clôturer le mois » fonctionne correctement en production (appel interne à `/api/scores`).
