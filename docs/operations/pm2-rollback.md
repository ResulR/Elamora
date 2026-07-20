# Procédure de rollback Elamora

Cette procédure permet de restaurer une version précédente d’Elamora
sur le VPS de production.

## Configuration du projet

Dépôt :

    /home/debian/apps/elamora

Branche de production :

    main

Applications PM2 concernées :

    elamora-web
    elamora-api

Commandes de compilation :

    npm run build
    npm run api:build

Contrôles publics :

    https://elamora.eu/
    https://elamora.eu/api/health

## Informations importantes

La commande `pm2 prev` n’est pas disponible sur ce VPS.

La commande `pm2 backward` ne doit pas être utilisée pour Elamora,
car le projet n’utilise pas le système de déploiement Git intégré à PM2.

Le rollback doit être réalisé avec Git, npm et PM2.

Un rollback du code ne restaure pas automatiquement la base PostgreSQL.
Les migrations doivent être vérifiées avant tout retour vers une ancienne
version.

Les fichiers d’environnement ne doivent jamais être supprimés ou remplacés :

    server/.env
    server/.env.backup.*
    server/.env.bak-*

## Vérifications avant rollback

Avant toute intervention, ouvrir le dépôt :

    cd /home/debian/apps/elamora

Vérifier la branche, le commit actuel et l’état du dépôt :

    git branch --show-current
    git log -1 --oneline --decorate
    git status --short

Le dépôt doit être propre.

Si git status affiche des modifications ou des fichiers non suivis,
arrêter la procédure.

Ne pas utiliser git reset --hard sans avoir identifié précisément
les fichiers présents.

Vérifier les processus PM2 :

    pm2 list

Les deux processus suivants doivent exister :

    elamora-web
    elamora-api

Vérifier la production avant rollback :

    curl -fsS --max-time 15 https://elamora.eu/ >/dev/null

    curl -fsS --max-time 15 https://elamora.eu/api/health

## Enregistrer les commits

Enregistrer le commit actuellement déployé :

    ROLL_FORWARD_COMMIT="$(git rev-parse HEAD)"

Enregistrer le commit précédent comme cible par défaut :

    ROLLBACK_COMMIT="$(git rev-parse HEAD^)"

Afficher les deux références :

    echo "Version actuelle : $ROLL_FORWARD_COMMIT"
    echo "Version cible : $ROLLBACK_COMMIT"

La valeur de ROLL_FORWARD_COMMIT doit être conservée.

Elle permettra de revenir à la version récente si le rollback échoue.

Pour sélectionner un autre commit :

    git log -20 --oneline --decorate

Puis définir manuellement la cible :

    ROLLBACK_COMMIT="<hash-du-commit-validé>"

Le commit ne doit jamais être choisi au hasard.

## Vérifier le commit cible

Afficher les informations du commit cible :

    git show --stat --oneline --decorate "$ROLLBACK_COMMIT"

Comparer la version cible avec la version actuellement déployée :

    git diff --stat "$ROLLBACK_COMMIT" "$ROLL_FORWARD_COMMIT"

Afficher la liste des fichiers modifiés :

    git diff --name-only "$ROLLBACK_COMMIT" "$ROLL_FORWARD_COMMIT"

Rechercher les fichiers liés aux migrations ou à la base de données :

    git diff --name-only "$ROLLBACK_COMMIT" "$ROLL_FORWARD_COMMIT" \
      | grep -Ei 'migration|schema|database|migrate' \
      || true

Si une migration incompatible apparaît, arrêter la procédure.

Un rollback du code ne restaure pas automatiquement PostgreSQL.

La base de données doit être analysée séparément avant de continuer.

## Basculer vers la version précédente

Mettre à jour les références Git :

    git fetch origin

Vérifier une dernière fois que le dépôt est propre :

    test -z "$(git status --porcelain)"

Basculer temporairement sur le commit cible :

    git switch --detach "$ROLLBACK_COMMIT"

Vérifier le commit actif :

    git rev-parse HEAD
    git log -1 --oneline --decorate
    git status --short

Le mode detached HEAD est volontaire.

Il permet de déployer un ancien commit sans modifier la branche main
et sans créer de commit parasite.

## Reconstruire le projet

Après avoir basculé sur le commit cible, réinstaller les dépendances :

    npm ci

Compiler le frontend :

    npm run build

Compiler l’API :

    npm run api:build

Si une de ces commandes échoue, ne pas recharger PM2.

Les dossiers dist et server/dist sont générés localement.
Ils ne sont pas suivis par Git.

Les fichiers suivants ne doivent jamais être supprimés ou remplacés :

    server/.env
    server/.env.backup.*
    server/.env.bak-*

## Recharger uniquement Elamora

Recharger le frontend :

    pm2 reload elamora-web --update-env

Recharger l’API :

    pm2 reload elamora-api --update-env

Ne jamais recharger ou redémarrer tous les processus PM2 en une seule commande.

Le VPS héberge plusieurs autres applications qui ne doivent pas être touchées.

## Vérifier le rollback

Attendre quelques secondes après le reload :

    sleep 3

Vérifier les processus PM2 :

    pm2 list
    pm2 describe elamora-web
    pm2 describe elamora-api

Vérifier le frontend :

    curl -fsS --max-time 15 https://elamora.eu/ >/dev/null

Vérifier l’API et PostgreSQL :

    curl -fsS --max-time 15 https://elamora.eu/api/health

La réponse doit contenir au minimum :

    "ok": true
    "db": "ok"

Consulter les logs :

    pm2 logs elamora-web --lines 100 --nostream
    pm2 logs elamora-api --lines 100 --nostream

Le rollback est validé uniquement si :

    elamora-web est online
    elamora-api est online
    la page publique répond correctement
    l’API répond correctement
    PostgreSQL est disponible
    aucune nouvelle erreur critique n’apparaît dans les logs

## Restaurer la version récente si le rollback échoue

Revenir au commit enregistré avant le rollback :

    git switch --detach "$ROLL_FORWARD_COMMIT"

Réinstaller et reconstruire :

    npm ci
    npm run build
    npm run api:build

Recharger uniquement Elamora :

    pm2 reload elamora-web --update-env
    pm2 reload elamora-api --update-env

Attendre quelques secondes :

    sleep 3

Vérifier à nouveau :

    pm2 list
    curl -fsS --max-time 15 https://elamora.eu/ >/dev/null
    curl -fsS --max-time 15 https://elamora.eu/api/health

Consulter les logs si nécessaire :

    pm2 logs elamora-web --lines 100 --nostream
    pm2 logs elamora-api --lines 100 --nostream

## Revenir proprement sur main après intervention

Une fois la version correcte validée, revenir sur la branche principale :

    git fetch origin
    git switch main
    git pull --ff-only origin main

Reconstruire puis recharger Elamora :

    npm ci
    npm run build
    npm run api:build

    pm2 reload elamora-web --update-env
    pm2 reload elamora-api --update-env

Vérifier l’état final :

    git log -1 --oneline --decorate
    git status --short
    pm2 list

    curl -fsS --max-time 15 https://elamora.eu/ >/dev/null
    curl -fsS --max-time 15 https://elamora.eu/api/health

## À propos de pm2 save

La commande pm2 save ne réalise pas un rollback du code.

Elle sauvegarde uniquement la liste actuelle des processus PM2
afin qu’ils puissent être restaurés après un redémarrage du VPS.

Elle ne doit être utilisée que lorsque les processus corrects sont actifs :

    pm2 save
