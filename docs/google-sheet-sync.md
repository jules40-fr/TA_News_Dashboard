# Google Sheet -> metrics.json

Ce projet peut mettre a jour `data/metrics.json` automatiquement depuis le Google Sheet de reference.

## Classeur de reference

Google Sheet : `TA_Dashboard - Source Metrics`

ID du classeur : `1O0pyfF1Mjd9qSQ8EfOKbXCJJDCL70j-ysF9z72a-198`

Onglets utilises :
- `KPIs` (`gid` `270386200`)
- `Anniversaires` (`gid` `270386201`)
- `Opportunites` (`gid` `270386202`)
- `QHSE` (`gid` `270386203`)

## Prerequis

Le GitHub Action lit les onglets via l'URL d'export Google Sheets.
Pour que cela fonctionne, le classeur doit etre lisible en consultation.

Le plus simple :
1. Ouvrir le Google Sheet
2. Cliquer sur `Partager`
3. Donner l'acces `Lecteur` a `Toute personne disposant du lien`

## Secrets GitHub a ajouter

Dans `Settings > Secrets and variables > Actions`, creer :

- `GOOGLE_SHEET_ID` = `1O0pyfF1Mjd9qSQ8EfOKbXCJJDCL70j-ysF9z72a-198`
- `GOOGLE_SHEET_GID_KPIS` = `270386200`
- `GOOGLE_SHEET_GID_ANNIVERSAIRES` = `270386201`
- `GOOGLE_SHEET_GID_OPPORTUNITES` = `270386202`
- `GOOGLE_SHEET_GID_QHSE` = `270386203`

## Fonctionnement

Le workflow `.github/workflows/sync-metrics.yml` :
- peut etre lance manuellement
- tourne toutes les 30 minutes
- execute `node scripts/sync-google-sheet.js`
- regenere `data/metrics.json`
- commit/push le fichier si son contenu a change

## Mappage des donnees

### Onglet `KPIs`

Bloc cle/valeur attendu :
- `ca_ytd`
- `ca_objectif`
- `ca_prog_pct`
- `ca_trend_pct`
- `ca_trend_label`
- `consultants`
- `sourcing`
- `fins_de_mission`
- `taux_occupation`

Puis tableau mensuel :
- colonne A : `mois`
- colonne B : `ca_n1_mensuel`
- colonne C : `ca_n_mensuel`

### Onglet `Anniversaires`

Colonnes attendues :
- `initiales`
- `nom`
- `role`
- `client`
- `date`
- `age`
- `color`
- `colorbg`

### Onglet `Opportunites`

Colonnes attendues :
- `client`
- `poste`
- `statut`
- `statut_label`
- `lieu`
- `region`
- `color`

### Onglet `QHSE`

Bloc cle/valeur attendu :
- `jours_sans_accident`
- `dernier_accident`
- `audits_realises`
- `audits_a_faire`

Puis tableau des causeries :
- `sujet`
- `animateur`
- `date`
- `color`
