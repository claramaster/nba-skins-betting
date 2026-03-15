-- Réinitialise toutes les données (drafts, picks, scores, matchs).
-- Les joueurs (players) sont conservés.
-- Exécuter dans l’éditeur SQL du projet Supabase (Dashboard → SQL Editor).

DELETE FROM monthly_scores;
DELETE FROM game_results;
DELETE FROM draft_picks;
DELETE FROM drafts;
-- Optionnel : vider le cache équipes NBA
-- DELETE FROM nba_teams_cache;
