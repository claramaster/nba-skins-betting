# Calcul des scores par mois

## 1. Données utilisées

- **Draft du mois** : une draft = 28 picks (4 joueurs × 7 W + 7 L) sur des équipes NBA pour le mois.
- **`draft_picks`** : chaque ligne = un joueur a parié W ou L sur une équipe pour ce mois.
- **`game_results`** : résultats des matchs du mois (synchro basketball-reference via « Rafraîchir les scores »). Chaque ligne a notamment :
  - `home_team_id`, `visitor_team_id`, `winner_team_id`
  - `game_date`

## 2. API `GET /api/scores?year=&month=` — logique dans `src/app/api/scores/route.ts`

### Étape A : compter les matchs et les bons paris (sans plafond)

Pour **chaque match qui a un gagnant** (`winner_team_id` non null) :

- Pour **chaque joueur** :
  - Si le joueur n’a **aucune** équipe dans ce match (ni home ni visitor), on ignore.
  - Sinon il a une équipe dans le match (home ou visitor). On récupère son **pick** pour cette équipe (W ou L).
  - On incrémente **matchCountByPlayer[joueur]** (ce match « compte » pour lui).
  - **Bon pari** = (pick W et équipe a gagné) **ou** (pick L et équipe a perdu).
  - Si bon pari → on incrémente **correctByPlayer[joueur]**.

Résultat : pour chaque joueur, on a :

- `match_count` = nombre de matchs du mois où il avait une équipe impliquée.
- `raw_correct` = nombre total de bons paris sur tous ces matchs (aucune limite).

### Étape B : calcul des `scoreRows`

Pour **chaque joueur** : on parcourt **tous les matchs avec gagnant** ; pour chaque match où le joueur a une équipe et un pick, si le pari est correct on incrémente le total et le détail par équipe. **Aucun plafond** : tous les matchs du mois comptent.

- **score_count** = **raw_correct** = nombre total de bons paris sur le mois.
- **teamScores** = nombre de bons paris par équipe (ex. Memphis L = 7 si 7 défaites).

## 3. Plage de dates par page

Chaque page mois utilise un **(year, month)** (voir `src/lib/season-months.ts`) :

- **Nov** → 2025-11 → matchs du **2025-11-01** au **2025-11-30**
- **Dec** → 2025-12 → **2025-12-01** au **2025-12-31**
- **Jan** → 2026-01 → **2026-01-01** au **2026-01-31**
- **Fev** → 2026-02 → **2026-02-01** au **2026-02-28**
- **Mar/Avr** → 2026-03 → **2026-03-01** au **2026-03-31** (un seul mois pour l’instant)

Le bouton « Rafraîchir les scores » appelle basketball-reference avec l’URL du **mois calendaire** (ex. `NBA_2026_games-march.html`) : on récupère tous les matchs de ce mois. Les scores affichés sont calculés sur ces matchs uniquement.

## 4. Affichage dans l’app

- **Page mois** : score total = nombre de bons paris sur le mois ; **teamScores** = points par équipe (entre parenthèses). La plage de dates (du … au …) est affichée sous le titre.

## 5. Clôture du mois — `POST /api/scores/finalize`

- Appelée par « Clôturer le mois » (sur l’ancienne page scores ou à intégrer ailleurs).
- Elle relit les **scoreRows** de l’API scores (tous les bons paris du mois).
- Elle attribue les **points de saison** 6 / 3 / 1 selon le **classement** des `score_count` (1er = 6, 2e = 3, 3e = 1, ex‑aequo = partage des points).
- Elle écrit tout dans **`monthly_scores`** (draft_id, player_id, raw_correct_count, x_match_count, score_count, rank, season_points).

## 6. Page d’accueil (récap)

- **API `GET /api/season`** : pour chaque draft de la saison, elle lit **`monthly_scores`** (season_points, rank).
- Les lignes « Skins - {mois} » du tableau récap utilisent **season_points** (6/3/1) **uniquement** si le mois a été clôturé (lignes présentes dans `monthly_scores`).
- Sinon l’accueil utilise des **points statiques** (STATIC_SKIN_POINTS) pour nov/déc/jan/fév.

## Résumé des champs

| Champ              | Signification |
|--------------------|----------------|
| **match_count**    | Nombre de matchs du mois où le joueur avait une équipe impliquée. |
| **raw_correct** / **score_count** | Nombre total de bons paris sur tout le mois (égal, pas de plafond). |
| **teamScores**     | Détail des bons paris par équipe. |
| **season_points**  | Points 6/3/1 du mois, après clôture (stockés dans `monthly_scores`). |

Si tu me dis quel comportement est faux (ex. « le total ne matche pas mes comptes », « les points par équipe sont bizarres », « après clôture les totaux changent »), on peut cibler la partie du calcul à corriger.
