# YowNews — Espace Admin / Éditeur : contexte & décisions

> Document de passation. Résume tout le travail réalisé sur l'espace d'administration
> de l'app **yownews** (Next 16 / next-intl) et son backend **KSM** (Spring WebFlux, hexagonal).
> Frontend réel = `/home/devstack/Documents/frontend/yownews` (port 3000). Le dossier
> `blog_podcasts` n'est QUE des maquettes UI. Backend = `/home/devstack/Documents/KSM_Kernel_Layer`.

## 1. Architecture & conventions

- **BFF (backend-for-frontend)** : yownews proxifie KSM (`KSM_BASE_URL=http://localhost:8081`) via
  `callKsm()` (`src/server/ksm/client.ts`). Envoie toujours `X-Client-Id` + `X-Api-Key` ; si session :
  `Authorization: Bearer`, `X-Tenant-Id`, `X-Organization-Id` (résolu via `resolvePlatformOrganizationId()`).
- **Sessions** : iron-session + Redis (port hôte **6380**, pas 6379).
- **Routing** : next-intl, routes sous `src/app/[locale]/`, navigation via `@/i18n/navigation`
  (Link/usePathname/useRouter), PAS `next/navigation` (sauf `redirect` serveur).
- **Réponses KSM** : la plupart sont enveloppées `{success,data,errorCode,message}` → `unwrapKsm`.
  **Le module education renvoie des entités BRUTES** → on utilise `callKsm({raw:true})` + parsing maison
  (`src/server/ksm/modules/education.ts`). Routes BFF : `handleRoute` + `readSession()` → `fail(401)`.

## 2. Détection des rôles (côté frontend)

Le backend `RolesPermissionResolver.mapAuthorities` injecte, pour chaque rôle assigné :
- `ROLE_<CODE>` **uniquement** si scope SYSTEM/TENANT, **plus** `ROLE_<CODE>#<scope>` dans tous les cas
  (`#TENANT`, `#ORGANIZATION:<id>`, `#AGENCY:<id>`) ;
- chaque permission, idem (bare si SYSTEM/TENANT, + suffixe de scope).

`src/lib/roles.ts` :
- `ADMIN_ROLE = 'ROLE_SUPER_EDUCATION_SERVICES_MANAGER'` (scope **TENANT**) → `isPlatformAdmin()`.
- `EDITOR_ROLE = 'ROLE_EDUCATION_EDITOR_PERMISSIONS'` (scope **ORGANIZATION**) → `isEducationEditor()`.
- Détection = `authorities.some(a => a.split('#')[0] === ROLE)` (on retire le suffixe de scope).

## 3. Espace ADMIN (livré)

- Détection admin par `ROLE_SUPER_EDUCATION_SERVICES_MANAGER` (zéro changement backend).
- Layout `src/app/[locale]/admin/layout.tsx` : garde `readSession` + `isPlatformAdmin` (sinon redirect).
- Composants `_components/` : `AdminSidebar` (prop `variant: 'admin'|'editor'`), `AdminTopbar`,
  `DashboardView` (présentationnel partagé), `TaxonomyManager` (CRUD catégories/tags).
- Pages : `dashboard`, `users` (**réel** — voir §5bis), `categories` (réel), `tags` (réel).
- Login : admin → `/admin/dashboard`, éditeur → `/editor/dashboard`, sinon `/`.

### Gestion des utilisateurs = RÉEL (livré — voir §5bis)
La page Utilisateurs liste désormais les **vrais comptes** du tenant via `GET /api/admin/users` (BFF →
`GET /api/administration/users`) et permet de **changer le rôle** via le ⋮. **Deux rôles seulement** :
**Rédacteur** (`EDUCATION_EDITOR_PERMISSIONS`) et **Lecteur** (`EDUCATION_READER_PERMISSIONS`).
`SEED_USERS` a été supprimé.

### Catégories / Tags = RÉEL
- Onglets de nav (plus des dropdowns) → pages centrales type « table users » : Nom, Description,
  Date de création, ⋮ (Modifier/Supprimer).
- Endpoints KSM `/api/v1/education/{categories,tags}` : **catégories = CRUD complet**,
  **tags = pas de DELETE** (GET/POST/PUT) → ⋮ Tags sans « Supprimer » (`canDelete={false}`).
- BFF : `src/server/ksm/modules/education.ts` + routes `src/app/api/education/{categories,tags}[/[id]]`.

## 4. Dé-duplication du rôle admin (backend, livré)

`SUPER_EDUCATION_SERVICES_MANAGER` n'est plus codé en dur dans le SQL. Source unique = template Java
`AdministrationApplicationService.defaultRoleTemplates`. `YowNewsAdminBootstrapInitializer`
(`IWM_BOOTSTRAP_YOWNEWS_ADMIN_ENABLED=true`) provisionne le rôle (`provisionDefaultRoles`) puis l'assigne
à `admin@yownews.com`. `V81__yownews_seed.sql` ne garde que les fixtures (client BFF, actor, org, agency,
souscriptions, compte user).

## 5. Compte ÉDITEUR de test (ce lot)

But : un compte avec le rôle **EDUCATION_EDITOR_PERMISSIONS** pour tester la création de blogs/cours,
en attendant le flux réel (user simple → demande de rôle rédacteur → validation admin), pas encore possible.

- **Seed** `V82__yownews_editor_seed.sql` : actor (`…011`) + user_account (`…012`)
  `editor@yownews.com` / `Demo@2024!` (même hash bcrypt que l'admin).
- **Assignation** : faite par `YowNewsAdminBootstrapInitializer` (le rôle est ORGANIZATION-scoped →
  assignation au scope ORGANIZATION avec l'org YowNews `…002`). Pas de SQL en dur de l'assignation
  (l'id du rôle est généré au runtime par `provisionDefaultRoles`).
- **Espace éditeur** `/editor` : réutilise `AdminSidebar variant="editor"` + `AdminTopbar` + `DashboardView`,
  **sans** les onglets Utilisateurs / Catégories / Tags. Garde = `isEducationEditor` (admin toléré).

### Pour activer le compte éditeur
1. Redémarrer le backend KSM (Liquibase applique V82 ; l'initializer assigne le rôle au boot).
2. Login `editor@yownews.com` / `Demo@2024!` → atterrit sur `/editor/dashboard`.
   (Alternative sans redémarrage, base déjà seedée : insérer actor+user puis
   `INSERT … user_role_assignment` en récupérant l'id via
   `SELECT id FROM roles.role WHERE tenant_id=… AND code='EDUCATION_EDITOR_PERMISSIONS'`.)

## 5bis. User-management RÉEL — méthode optimale (Partie E, LIVRÉ)

### Synthèse fonctionnelle (3 personas)
- **Lecteur** : s'inscrire/lire/s'abonner/noter ; demander à devenir Rédacteur (workflow BFF, pas KSM).
- **Rédacteur** : espace `/editor` ; créer ses contenus (brouillons) ; les soumettre.
- **Admin** : dashboard ; lister les users + rôles ; promouvoir/rétrograder ; valider/publier le contenu ;
  gérer catégories/tags.

### Constat KSM clé
- **Validation de contenu = native** : l'éditeur a `education:content:create` (brouillon) ; publier =
  `PATCH /api/v1/education/{blogs|courses}/{id}/publish` exige `:manage` (que l'admin a). Filtrage `?status=`.
- **Lister les users** était le seul vrai trou ; l'**assignation de rôle existait déjà**.

### Méthode retenue = 2 changements KSM seulement
- **C1 (1 ligne)** : `administration:assignments:write` ajouté au template `EDUCATION_SERVICES_ALL_PERMISSIONS`
  (`AdministrationApplicationService`) → débloque `canManageAdministrativeRoles` (list-roles + assign + revoke
  + gate du nouvel endpoint users). Appliqué en **recréant la base dev** (le template est la source unique).
- **C2 (1 endpoint read-only)** : `GET /api/administration/users` (garde `canManageAdministrativeRoles`).
  - `findAllByTenantId` descendu dans la stack auth (port `UserAccountRepository` + R2DBC + InMemory + Spring Data).
  - `findByTenantId` ajouté à `ActorRepository` (+ R2DBC/InMemory/Spring Data) pour enrichir **prénom/nom**.
  - Use case `ListTenantUsersUseCase` implémenté dans `AdministrationApplicationService` (agrège user + actor
    + rôles via assignments) ; DTO `AdministrationUserResponse` ; `ActorRepository` injecté dans le service.
- **C3 (0 KSM)** : assignation/révocation = endpoints existants `POST/DELETE /api/administration/users/{id}/roles`
  (`{ roleId, scope:"ORGANIZATION" }` ; l'org `…002` vient du contexte X-Organization-Id). `GET /api/administration/roles`
  pour récupérer l'id Rédacteur/Lecteur.
- **Simplifications** : pas de validation d'existence de compte (l'inscription crée un user **ACTIF**) ; modèle
  « employees d'organisation » écarté (l'inscription ne crée pas de membership). « Demande de rôle » = BFF only.

### Côté frontend (LIVRÉ)
- BFF `src/server/ksm/modules/administration.ts` : `listTenantUsers`, `listRoles`, `assignRole`, `revokeRole`
  (réponses enveloppées → `unwrapKsm`).
- Routes (admin-guarded `isPlatformAdmin`) : `src/app/api/admin/users/route.ts` (GET),
  `src/app/api/admin/roles/route.ts` (GET), `src/app/api/admin/users/[id]/roles/route.ts` (POST),
  `src/app/api/admin/users/[id]/roles/[assignmentId]/route.ts` (DELETE).
- `src/app/[locale]/admin/users/page.tsx` : réécrite (fetch réel users+roles, filtre par rôle, recherche,
  pagination, ⋮ « Passer Rédacteur/Lecteur » → assign/revoke réels, refetch). Plus de mock.

### Vérification
- Statique : `mvn -o compile` (actor/auth/administration/bootstrap) = **0** ; `tsc --noEmit` = **0** ; `eslint` = **0**.
- Runtime : **non exécutée ici** (Docker indisponible → Postgres/Redis/Kafka/ES + backend down). Séquence
  prête : recréer la base → `mvn -o -pl RT-comops-bootstrap -am package -DskipTests` → `java -jar …` →
  login admin → `curl /api/admin/users`. Un user yownews de test (`editor@yownews.com`, Rédacteur) est créé
  par le seed **V82** sur base fraîche.

## 6. Mécanismes KSM pour la gestion des utilisateurs (réf. — état après ce lot)

- **Lister les users d'un tenant** : ✅ **AJOUTÉ** — `findAllByTenantId` (stack auth) + `GET /api/administration/users`
  (use case `ListTenantUsersUseCase`).
- **Affecter un rôle** : ✅ endpoints existants `/api/administration/users/{userId}/roles` (POST/DELETE) +
  `GET /api/administration/roles`, gardés par `canManageAdministrativeRoles`. L'admin YowNews a maintenant
  `administration:assignments:write` (C1). (`/api/roles/**` reste gardé par `canManageIdentity`=`*:admin`, non utilisé.)
- Changement de **statut** de compte (Valider/Rejeter) : toujours **AUCUNE** capacité backend, et jugé
  **non nécessaire** (l'inscription crée un compte ACTIF ; la validation porte sur rôles + contenu).

## 7. Fichiers clés

Frontend (`yownews/`) :
- `src/lib/roles.ts`, `src/app/[locale]/auth/login/page.tsx`
- `src/app/[locale]/admin/{layout,dashboard/page,users/page,categories/page,tags/page}.tsx`
- `src/app/[locale]/admin/_components/{AdminSidebar,AdminTopbar,DashboardView,TaxonomyManager}.tsx`
- `src/app/[locale]/editor/{layout,dashboard/page}.tsx`
- `src/server/ksm/modules/{education,administration}.ts`
- `src/app/api/education/**` ; `src/app/api/admin/{users,roles,users/[id]/roles,users/[id]/roles/[assignmentId]}/route.ts`

Backend (`KSM_Kernel_Layer/`) :
- `RT-comops-bootstrap/.../config/YowNewsAdminBootstrap{Properties,Initializer}.java`
- `RT-comops-bootstrap/src/main/resources/db/r2dbc/V81__yownews_seed.sql`, `V82__yownews_editor_seed.sql`
- `RT-comops-bootstrap/.../db/changelog/releases/08{4,5}-yownews-*.yaml` + `db.changelog-master.yaml`
- `RT-comops-administration-core/.../AdministrationApplicationService.java` (templates + `listTenantUsers`)
- `RT-comops-administration-core/.../adapter/in/web/{AdministrationController,AdministrationUserResponse}.java`
- `RT-comops-administration-core/.../application/port/in/ListTenantUsersUseCase.java`
- `RT-comops-auth-core/.../UserAccountRepository.java` (+ R2DBC/InMemory/SpringData : `findAllByTenantId`)
- `RT-comops-actor-core/.../ActorRepository.java` (+ R2DBC/InMemory/SpringData : `findByTenantId`)

## 8. Inscription des users

L'inscription de base existait déjà (`POST /api/auth/sign-up` → Actor + UserAccount ACTIF + auto-login).
Deux trous comblés : le **Chantier 1** (rôle Lecteur auto) est **100 % BFF** ; le **Chantier 2**
(« Devenir Rédacteur ») a d'abord été fait en Redis puis **migré vers une vraie table KSM** dans le
module education (voir §8.2 — l'historique Redis est conservé en note).

### 8.1 Rôle Lecteur auto à l'inscription (Chantier 1)
- Un nouvel inscrit n'avait **aucun rôle**. Désormais le BFF lui assigne `EDUCATION_READER_PERMISSIONS`
  juste après le sign-up, **en tant qu'admin YowNews** (l'admin a `administration:assignments:write` — C1),
  exactement comme la page `/admin/users` (`assignRole`, scope ORGANIZATION).
- `src/server/ksm/admin-session.ts` : `getAdminSession()` (login `admin@yownews.com` via env,
  **cache mémoire** façon `platform-org.ts`) + `getReaderRoleId()` (via `listRoles`).
- `src/app/api/auth/sign-up/route.ts` : après `signUp`, `assignDefaultReaderRole` (best-effort : un échec
  ne casse pas l'inscription) puis **re-login** de l'utilisateur (`discoverContexts`+`selectContext`) pour
  que l'authority Lecteur soit dans la session.
- Env : `KSM_PLATFORM_ADMIN_EMAIL`, `KSM_PLATFORM_ADMIN_PASSWORD` (`.env.local` + `src/env.ts`).

### 8.2 Workflow « Devenir Rédacteur » (Chantier 2 — vraie table KSM `editor_application`)
> **Évolution** : initialement en Redis (`role-requests/store.ts`), c'est désormais une **vraie table
> en base** gérée par le module **education**. Le candidat fournit un **domaine** (multi-sélection), une
> **URL de preuve** (portfolio/LinkedIn) et une **motivation**. Le store Redis a été **supprimé**.

- **Table** `editor_application` (dans `V77__education_core.sql`, section 5c) : `id`, `user_id`,
  `tenant_id`, `organization_id`, `domains text[]`, `proof_url`, `motivation`, `status`
  (défaut `PENDING`), `created_at`/`decided_at`. Une seule candidature **PENDING** par user.
- **Chaîne hexagonale KSM** (`RT-comops-education-core/.../api/education/`) :
  `domain/model/EditorApplication.java` ; port out `EditorApplicationRepository` + adapter R2DBC ;
  port in `EditorApplicationUseCase` + DTOs (`EditorApplicationCreateDTO`, `EditorApplicationStatusDTO`) ;
  `application/service/EditorApplicationService.java` (userId/tenant/org via `ReactiveRequestContextHolder`,
  valide les domaines via `Domain.valueOf`, garde une-seule-PENDING) ;
  `adapter/in/web/EditorApplicationController.java` → `/api/v1/education/editor-applications` :
  `POST` (soumettre, **sans gate**), `GET /me`, `GET ?status=` (`:manage`), `PATCH /{id}/status` (`:manage`).
- **BFF** : `src/lib/education-domains.ts` (`EDUCATION_DOMAINS`, aussi consommé par `TaxonomyManager`) +
  `src/server/ksm/modules/editor-applications.ts` (`submitApplication`/`getMyApplication`/`listApplications`/`setStatus`).
- Routes BFF rebrandées vers KSM (mêmes chemins qu'avant) : `POST /api/role-requests`,
  `GET /api/role-requests/me` ; admin (`isPlatformAdmin`) : `GET /api/admin/role-requests`,
  `POST …/[id]/approve` (PATCH status APPROVED **+** `assignRole` Rédacteur), `POST …/[id]/reject`.
- UI Lecteur : formulaire dans `src/app/[locale]/reader/profile/ProfileClient.tsx` (cases domaines +
  proofUrl + motivation) — bannière « Devenir Rédacteur » sur le profil (voir §9).
- UI admin : `src/app/[locale]/admin/role-requests/page.tsx` (affiche domaines/preuve/motivation +
  Valider/Refuser) + entrée « Demandes de rôle » dans `AdminSidebar` (groupe Gestion, `adminOnly`).
- **Diagramme du workflow** : `docs/devenir-redacteur-workflow.mmd` (séquence Lecteur → BFF → KSM →
  Postgres : dépôt, suivi, revue admin, validation/refus).

> ⚠️ **Bug corrigé** : `EditorApplication` (modèle R2DBC du module education) n'avait pas `@Id` sur son
> champ `id`. Résultat : `PATCH …/status` (validation/refus, seul chemin utilisant `findById`) renvoyait
> 500 sans trace métier, alors que dépôt (INSERT) et liste (`findAll`) fonctionnaient. Corrigé en ajoutant
> `@Id` (`org.springframework.data.annotation.Id`) sur `id`. (`CategoryEntity` a le même manque latent.)

### 8.3 Correctifs d'inscription (BFF)
- **selectionToken** : `discover-sign-up-contexts` renvoie `selectionToken` (pas `token`) →
  `src/server/ksm/modules/auth.ts` (type) + `sign-up/route.ts` corrigés (sinon 400
  « signUpSelectionToken/contextId is required »).
- **accountType** : l'UI envoie `individual`/`organization`, KSM exige `PROSPECT`/`BUSINESS` →
  mapping dans `sign-up/route.ts` (`organization`→`BUSINESS`, sinon `PROSPECT`).

### 8.4 ⚠️ Point backend OUVERT — permission admin manquante sur base existante
- Symptôme : `GET /api/admin/users` → **500** (KSM mappe `AccessDenied` en 500) car le rôle
  `SUPER_EDUCATION_SERVICES_MANAGER` en base **n'a pas** `administration:assignments:write`.
- Cause : `provisionDefaultRoles` (`AdministrationApplicationService`) ne **crée** que les rôles absents
  (`existsByCode` → skip) ; il ne **met jamais à jour** un rôle existant. La permission a été ajoutée au
  template *après* la création du rôle → rôle figé. (La perm n'est pas « protégée » → sur base **fraîche**
  le rôle est créé correctement.)
- Impact : bloque l'assignation auto du rôle Lecteur (8.1) et la validation des demandes (8.2).
- Résolutions possibles (non tranché) : **reset base** (le template recrée le rôle), ou ajouter un
  **reconcile** au démarrage dans `YowNewsAdminBootstrapInitializer`
  (`replacePermissions` vers le template, idempotent). Le reset exige de recompiler d'abord
  (`mvn -o -pl RT-comops-administration-core,RT-comops-bootstrap -am compile`) si la modif du template
  est encore locale/non commitée.

### 8.5 Fichiers ajoutés/modifiés
- Nouveaux (frontend) : `src/server/redis.ts`, `src/server/ksm/admin-session.ts`,
  `src/lib/education-domains.ts`, `src/server/ksm/modules/editor-applications.ts`,
  `src/app/api/role-requests/{route,me/route}.ts`,
  `src/app/api/admin/role-requests/{route,[id]/approve/route,[id]/reject/route}.ts`,
  `src/app/[locale]/admin/role-requests/page.tsx`, + espace `/reader` (voir §9).
- Supprimés : `src/server/role-requests/store.ts` (remplacé par la table KSM `editor_application`).
- Modifiés : `src/env.ts`, `.env.local`, `src/server/session.ts` (utilise `redis.ts`),
  `src/server/ksm/modules/auth.ts`, `src/app/api/auth/sign-up/route.ts`,
  `src/components/landing/Header.tsx`, `src/app/[locale]/admin/_components/{AdminSidebar,TaxonomyManager}.tsx`.
- Backend (KSM) : chaîne `editor_application` du module education + table dans `V77` (voir §8.2),
  et durcissement du schéma education (voir §10). Le Chantier 1 reste, lui, **BFF-only**.

## 9. UX Lecteur & espace `/reader` (ce lot)

- **Pays par défaut au sign-up** : Cameroun (et non Côte d'Ivoire).
- **Header** (`src/components/landing/Header.tsx`) : menu hamburger **retiré totalement** ; l'email est
  remplacé par un **bouton « Dashboard »** role-aware (admin→`/admin`, rédacteur→`/editor`,
  lecteur→`/reader`) ; la déconnexion n'est plus dans le header (elle vit en bas de la sidebar, comme admin).
- **Espace `/reader`** : `src/app/[locale]/reader/layout.tsx` réutilise `AdminSidebar variant="reader"`
  (nouveau `READER_NAV`) — **sans** les onglets Utilisateurs / Tableau de bord / Education / Newsletter.
- **Profil minimal** : `src/app/[locale]/reader/profile/{page,ProfileClient}.tsx`. L'onglet **Posts**
  n'apparaît que pour un **Rédacteur** ; sinon une **bannière « Devenir Rédacteur »** (formulaire §8.2).
- **`/account`** redirige désormais vers `/reader/profile`.

## 10. Durcissement du schéma education (`V77__education_core.sql`, ce lot)

Revue + corrections (base **recréée**, donc tout passe dans le même `V77`, **sans renommage**) :
- 🔴 `tenant_id NOT NULL` sur les **12 tables** (corrige une fuite d'isolation : une ligne `tenant_id`
  NULL était visible de tous, le filtre applicatif laissant passer le NULL).
- 🔴 Clés uniques **scopées tenant** : `category_entity UNIQUE(tenant_id, name, domain)`,
  `tag_entity UNIQUE(tenant_id, name)` (fin des collisions inter-tenant).
- 🔴 `abonnement` : `UNIQUE(user_id, content_id)` (filet anti-doublon, cohérent avec le garde applicatif).
- 🟠 Suppression des index dupliqués `idx_podcast_tenant_rls` / `idx_blog_tenant_rls` (reliquats RLS).
- 🟠 Tous les `TIMESTAMP` → `TIMESTAMPTZ` (cohérence kernel). **Côté Java** : `LocalDateTime` → `Instant`
  sur les entités/services education concernés (`Favorite`, `Abonnement_entity`, `Education`, `TagEntity`,
  `Education/CourseR2dbcEntity`, `InterfaceEntity`, `AbstractEducationService`, `AbonnementServiceImpl`,
  `AbonnementResponseDTO`) pour matcher `timestamptz`.
- **Décisions** : `favorites`/`abonnement` restent **polymorphes** (`entity_id`+`entity_type`, bon patron
  pour leurs requêtes) ; **aucun renommage** (refactor Java massif, gain seulement esthétique).
- **Vérif** : `mvn -o -pl RT-comops-education-core -am compile` = **0**, plus aucun `LocalDateTime`
  ni `TIMESTAMP` non-tz résiduel.

## 11. Espace Rédacteur — Blogs : cover image, aperçu, horodatages (ce lot)

### 11.1 Bug corrigé — cover image jamais affichée (404), cause réelle = frontend
Le backend KSM enregistrait correctement la ressource (logs : `Ressource sauvegardée avec ID: …`,
plus de NPE après le fix `@Id` sur `ResourceEntity`, voir §KSM endpoint test status en mémoire), mais
l'image restait invisible. Cause : **le frontend n'était pas câblé pour la récupérer**, indépendamment
de tout bug backend.
- `BlogPreviewModal` (`src/app/[locale]/editor/blog/BlogWorkspace.tsx`) pointait l'`<img src>` vers
  `/api/education/blogs/{id}/coverblog` — route BFF **inexistante**.
- La route proxy réelle `src/app/api/education/blogs/[id]/cover/route.ts` n'exposait qu'un handler
  `POST` (upload) ; **aucun `GET`** pour streamer le binaire depuis KSM
  (`GET /api/v1/education/blogs/{id}/coverblog`).
- `ContentEditor.tsx` / `InitialContent.coverUrl` (`src/components/content-editor/types.ts`)
  n'étaient jamais alimentés en mode édition → l'aperçu de cover dans l'éditeur restait toujours vide
  même pour un blog ayant déjà une image.

**Fix (frontend uniquement)** :
- `src/server/ksm/modules/education.ts` : nouvelle fonction `getBlogCover(session, id)` → `callKsm`
  en `raw` sur `GET /api/v1/education/blogs/{id}/coverblog`, renvoie la `Response` brute.
- `src/app/api/education/blogs/[id]/cover/route.ts` : ajout du handler `GET` (auth via session,
  401 si absente) qui streame `res.body` avec le `Content-Type` repris de KSM (fallback `image/png`).
- `BlogWorkspace.tsx` : `coverblog` → `cover` dans l'`<img src>` de l'aperçu ; `initial.coverUrl` posé
  à `/api/education/blogs/{editing.id}/cover` en mode édition.
- `ContentEditor.tsx` : `onError` sur l'`<img>` de prévisualisation → si la cover n'existe pas (404),
  retombe proprement sur le dropzone vide plutôt qu'une icône d'image cassée.

### 11.2 Horodatages création/modification dans « Mes blogs »
Demande : afficher l'heure de création **et** de dernière modification, pour **tous les statuts**
(Brouillons, En attente de validation, Publiés) — pas seulement la date.
- `BlogWorkspace.tsx` (composant `MyBlogs`) : colonne unique **Date** remplacée par **Créé le** /
  **Modifié le**, formatées via `Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })`
  sur les champs `createdAt`/`updatedAt` déjà renvoyés par KSM (`BlogEntity`, passthrough complet via
  `GET /api/education/blogs`).

### 11.3 Reste à vérifier
Le fix ci-dessus règle un bug frontend confirmé indépendamment du backend. **Non encore vérifié en
conditions réelles** (KSM était down pendant cette investigation — pas de redémarrage fait par
l'agent, convention du projet). Si le 404 persiste après ce fix, suspect suivant côté KSM :
`AbstractEducationService.saveWithRessource` (`RT-comops-education-core`) — le `repository.save(entity)`
final qui pose `id_ressource` sur le blog n'a **aucun log**, donc son succès/échec est invisible ; et
`BlogMapperImpl` ne mappe pas `organizationId` (bug réel mais distinct, corruption silencieuse du
champ de la passerelle org KSM à chaque ré-sauvegarde via ce mapper).

---

## 12. Contrainte architecturale — un seul fichier SQL par module

**Décision validée lors de la session de corrections post-test (sessions #3).** Il existe un fichier
SQL *canonique* par module. On ne crée **jamais** de fichier patch `V8x__patch.sql` incrémental pour
modifier un schéma déjà défini — on modifie le fichier canonique du module directement.

| Module            | Fichier canonique                                      |
|-------------------|--------------------------------------------------------|
| education-core    | `db/r2dbc/V77__education_core.sql`                     |
| ratings-core      | `db/r2dbc/V78__ratings_core.sql`                       |
| newsletter-core   | `db/r2dbc/V80__newsletter_core.sql`                    |
| forum-core        | `db/r2dbc/V81__forum_core.sql` (nommage probable)      |
| bootstrap/seed    | `db/r2dbc/V81__yownews_seed.sql`, `V82__yownews_editor_seed.sql` |

Le changeset Liquibase correspondant (ex. `db/changelog/releases/080-ratings-core.yaml`) référence
le fichier SQL via `sqlFile:` — il reste inchangé si seul le SQL évolue dans les limites du même
schéma de départ. **Consequence :** toute évolution de schéma exige de recréer la base de
développement (ou de faire un `DROP TABLE / CREATE TABLE` manuellement si la base est déjà
existante).

---

## 13. Session de corrections post-test (11 points — session #3)

Après la mise en œuvre complète des modules newsletter/ratings/podcast/profil/espace lecteur,
l'utilisateur a relevé 11 points lors de tests en conditions réelles. Tous les points ont été traités.

### 13.1 Point 1 — Gestion des catégories newsletter par l'admin (CRUD)

Le backend `NewsletterCategorieController` exposait déjà `GET/POST/PUT/DELETE` sur
`/api/v1/newsletter/categorie`. Seul le `GET` était câblé côté frontend.

**Backend** : aucun changement.

**BFF** :
- `src/server/ksm/modules/newsletter.ts` : ajout de `createCategory`, `updateCategory`, `deleteCategory`.
- `src/app/api/newsletter/categories/route.ts` : ajout handler `POST`.
- `src/app/api/newsletter/categories/[id]/route.ts` (nouveau) : handlers `PUT` et `DELETE`.

**UI** :
- `src/app/[locale]/admin/newsletters/NewslettersAdminWorkspace.tsx` : nouvel onglet « Catégories »
  avec composant `CategoriesManager` inline (liste + formulaire création/édition + suppression).
  Ces catégories sont déjà consommées dynamiquement via `GET /api/newsletter/categories` par la
  demande de rédacteur et la création de newsletter — aucun changement consommateur requis.

### 13.2 Point 2 — Durée des cours en minutes

Le champ `duration` de `Course.java`/`CourseCreateDto.java` (KSM) est une `String` libre sans
validation. **Aucun changement backend.**

**Frontend** :
- `src/app/[locale]/editor/ContentWorkspace.tsx` : le champ `Durée` du formulaire de création
  de cours passe de `type="text"` à `type="number"` avec libellé « Durée (minutes) ».

### 13.3 Point 3 — Cover et audio dans la prévisualisation admin

Le backend exposait déjà `GET .../covercourse`, `GET .../coverpodcast`, `GET .../audiopodcast`.
Les routes BFF existantes `/api/education/{kind}/{id}/cover` et `/api/education/podcasts/{id}/audio`
étaient fonctionnelles en lecture. Seul le câblage UI manquait.

**Frontend** :
- `src/components/education/BlogPreviewModal.tsx` : nouvelle prop `audioPath?: string` ; rendu
  `<audio controls src={audioPath}>` quand fournie.
- `src/components/education/ContentModeration.tsx` : dans `openPreview`, passage de
  `coverPath={`/api/education/${kind}/${preview.id}/cover`}` et
  `audioPath={kind === 'podcasts' ? `/api/education/podcasts/${preview.id}/audio` : undefined}`
  à `BlogPreviewModal`. Avant ce fix, aucune prop n'était passée → fallback sur l'URL blog (404 silencieux).

### 13.4 Point 4 — Page de gestion des unités de cours

Le CRUD complet existait déjà aux deux extrémités (KSM `CourseController` et BFF
`/api/education/courses/[id]/units/**`). Seules la page et la navigation manquaient.

**Frontend (nouveau)** :
- `src/app/[locale]/editor/course/[id]/page.tsx` + `CourseUnitsManager.tsx` : page éditeur listant
  les unités d'un cours (`GET /api/education/courses/{id}/units`), formulaire de création (`POST`),
  suppression (`DELETE`).
- `src/app/[locale]/editor/ContentWorkspace.tsx` : ajout d'une entrée « Gérer les unités » dans le
  menu `RowMenu` du tableau « Mes cours », navigue vers `/editor/course/{id}` via `useAppRouter`.

### 13.5 Point 5 — Refonte du collapse sidebar

**Frontend** :
- `src/app/[locale]/admin/_components/AdminSidebar.tsx` :
  - Le bouton de bascule affiche désormais une **croix (×)** quand la sidebar est déployée et un
    **hamburger** quand elle est repliée (avant : hamburger dans les deux états).
  - Le logo + titre « YowNews » sont enveloppés dans un `<Link href="/">` naviguant vers la landing.

### 13.6 Point 6 — Nom de l'auteur sur les commentaires

**Problème** : les commentaires affichaient l'UUID auteur brut, illisible.

**Approche retenue** (après deux alternatives rejetées) : dénormalisation du nom au moment de la
création, calculé par le BFF depuis la session — sans nouvel endpoint actor-core.

**Schéma** (`V78__ratings_core.sql` — modification directe, pas de fichier patch) :
- Ajout `comment_by_name VARCHAR(255)` après `comment_by_user` dans `comments`.
- Ajout `reply_by_name VARCHAR(255)` après `reply_by_user_id` dans `comment_replies`.
- Suppression du fichier `V84__ratings_comment_author_name.sql` (migration incrémentale rejetée)
  et de son entrée `087-ratings-comment-author-name.yaml` dans `db.changelog-master.yaml`.

**Backend ratings-core** :
- Domain `Comment`/`CommentReply`, entités R2DBC, mappers, DTOs : champs `commentByName`/`replyByName` ajoutés.
- `CommentService.createComment` : `comment.setCommentByName(dto.getCommentByName())`.
- `CommentReplyService.createReply` : `reply.setReplyByName(dto.getReplyByName())`.
- `CommentReplyDTO.java` : getters/setters `replyByName` ajoutés (champ existait sans accesseurs).

**BFF** :
- `src/server/ksm/modules/ratings.ts` : champs `commentByName?`/`replyByName?` ajoutés aux types
  `CommentEntity`/`CommentReplyEntity` et aux signatures `createComment`/`createReply`.
- `src/app/api/ratings/comments/route.ts` (POST) : calcule
  `commentByName = [firstName, lastName].filter(Boolean).join(' ') || email` depuis la session.
- `src/app/api/ratings/comments/[id]/replies/route.ts` (POST) : même calcul → `replyByName`.

**Frontend** :
- `src/components/feed/ContentDetailView.tsx` : affiche `commentByName` (fallback `commentByUser.slice(0,8)`
  pour les anciens commentaires sans nom) avec avatar initiales au-dessus du contenu du commentaire.
  Idem `replyByName` pour les réponses.

### 13.7 Point 7 — Bug « le like revient à zéro »

**Cause racine** : `EntityStatsR2dbcEntity` implémentait `Persistable<UUID>` avec un flag `isNew`
jamais positionné à `true` à la première création. Spring Data R2DBC traitait donc chaque `save()`
comme un `UPDATE` — y compris le premier (aucune ligne existant encore, l'UPDATE ne faisait rien).
Au rechargement : `findById` ne trouvait rien → `hasLiked=false`, `totalLikes=0`.

**Fix backend** (`RT-comops-ratings-core/.../adapter/out/persistence/EntityStatsPersistenceAdapter.java`) :
- `save()` appelle d'abord `existsById` ; si la ligne n'existe pas, `entity.markNew()` avant `save`.

**Frontend** :
- `src/components/feed/ContentDetailView.tsx` : suppression du compteur numérique à côté des boutons
  like/dislike de la vue détail (juste l'icône colorée selon l'état, sans chiffre).

> Vérification requise : `CommentReplyR2dbcEntity` implémente aussi `Persistable` mais son mapper
> appelle `markNew()` quand `domain.getId() == null` — pas concerné. `RatingsR2dbcEntity` et
> `CommentR2dbcEntity` n'implémentent pas `Persistable` — pas concernés.

### 13.8 Point 8 — UI réponses aux commentaires

**Problème** : la barre de saisie de réponse était affichée dès que l'on ouvrait la liste des
réponses, sans que l'utilisateur ait cliqué « Répondre ».

**Fix** (`src/components/feed/ContentDetailView.tsx`) :
- État `replyFormOpen: Record<string, boolean>` ajouté, distinct de l'état « réponses visibles ».
- `toggleReplies` décomposé en `loadReplies` (charge + affiche) / `hideReplies` / `openReplyForm`.
- Le formulaire de saisie s'affiche **uniquement** si `replyFormOpen[commentId] === true` (après
  clic explicite sur « Répondre »).
- `submitReply` ferme le formulaire de saisie après succès et laisse la liste des réponses visible.

### 13.9 Point 9 — Compteur de like sur la card du feed pas mis à jour

Conséquence directe du bug du point 7 (`entity_stats` jamais persisté → `totalLikes` toujours 0).
`ContentFeedCard.tsx` appelle déjà `GET /api/ratings/total-likes?entityId=` à chaque montage.
**Aucun changement de code requis** — le correctif du point 7 suffit.

### 13.10 Point 10 — Lecteur audio podcast

**Problème** : aucun lecteur audio n'était affiché dans la vue détail d'un podcast côté lecteur.

**Fix** (`src/components/feed/ContentDetailView.tsx`) :
- Ajout d'un élément `<audio controls src={`/api/education/podcasts/${id}/audio`}` quand
  `contentType === 'PODCAST'`, placé en haut de la vue contenu (avant le transcript/body).

La route BFF `/api/education/podcasts/[id]/audio` existait déjà et fonctionne en lecture sans
restriction de rôle en `GET`.

### 13.11 Point 11 — Module forum : corrections backend + frontend complet

#### Contexte (audit réalisé avant implémentation)
Le module forum était isolé architecturalement (likes/commentaires propres, non branchés sur
`ratings-core`), avait plusieurs bugs bloquants et **zéro frontend**. Décision validée :
**Option B — corriger les bugs bloquants uniquement, construire le frontend sur les endpoints
propres au forum** (pas de migration vers ratings-core).

#### Corrections backend

**`RT-comops-forum-core`** :
- **Bug unicité globale des catégories** : `ForumCategorieService.createCategorie` vérifiait
  l'unicité par nom global → impossible d'avoir « Annonces » dans deux groupes différents.
  Corrigé en ajoutant `findByCategorieNameAndGroupeId` à travers toute la stack :
  `ForumCategorieRepository` (port out) → `R2dbcForumCategorieRepository` (Spring Data) →
  `CategoriePersistenceAdapter`.
- **Bug like/dislike incohérent** : `POST` utilisait `toggleLike`/`toggleDislike` ; `DELETE`
  appelait l'ancien `removeLike` (logique différente). Résolution : suppression de toutes les
  méthodes mortes (`addLike`, `removeLike`, `addDislike`, `removeDislike`, `handleDeletedPost`)
  depuis `PostUseCase` + `PostService` + `PostController`. Les endpoints `DELETE /like` et
  `DELETE /dislike` sont supprimés — toggle uniquement via `POST`.
- **Soft-delete ignoré** : les posts avec `suppressionDate != null` restaient visibles. Corrigé
  via prédicat `isNotDeleted()` dans `PostService`, appliqué sur tous les `Flux` de liste.
- **Endpoint groupes publics manquant** : `DiscussionGroupController` expose désormais
  `GET /groups/public` (guard `hasUserContext`) retournant uniquement les groupes VALIDATED,
  utilisable par les lecteurs sans que `GET /groups/all` (qui renvoie aussi PENDING/REJECTED)
  ne soit exposé.
- **Nettoyage permissions** : entrées mortes `forum:category:read`, `forum:categories:manage`,
  `forum:write:all`, `forum:delete` supprimées de `PermissionCatalogService.java`.
- **Code mort supprimé** : `LoginRequest.java` et `RegistrationRequest.java` (résidus boilerplate
  Spring Security, aucun lien avec le module forum).

#### Frontend (intégralement nouveau)

**Client KSM** :
- `src/server/ksm/modules/forum.ts` : client complet (groupes, posts, catégories, commentaires,
  `toggleLike`/`toggleDislike` — tous sur les endpoints propres au forum).

**Routes BFF** (toutes nouvelles, sous `/api/forum/`) :
- `groups/route.ts` — `GET` (publics), `POST` (créer groupe, type FORUM, statut PENDING)
- `groups/admin/route.ts` — `GET` tous (admin)
- `groups/[id]/validate/route.ts` — `PUT`
- `groups/[id]/reject/route.ts` — `PUT`
- `posts/route.ts` — `POST`
- `posts/group/[groupId]/route.ts` — `GET`
- `posts/[id]/like/route.ts` — `POST` toggle
- `posts/[id]/dislike/route.ts` — `POST` toggle
- `categories/group/[groupId]/route.ts` — `GET`, `POST`
- `categories/[id]/route.ts` — `DELETE`
- `commentaires/post/[postId]/route.ts` — `GET`, `POST`
- `commentaires/[id]/route.ts` — `DELETE`

**Pages admin** :
- `src/app/[locale]/admin/forums/page.tsx` + `ForumAdminWorkspace.tsx` : liste ongletée PENDING /
  VALIDATED / REJECTED, actions Valider/Rejeter sur les groupes PENDING.

**Pages lecteur** :
- `src/app/[locale]/reader/forums/page.tsx` + `ForumListPage.tsx` : liste des groupes publics
  (VALIDATED), bouton « Proposer un forum » (POST → statut PENDING → en attente de validation admin).
- `src/app/[locale]/reader/forums/[groupId]/page.tsx` + `ForumGroupView.tsx` : vue d'un groupe
  (posts + catégories), création de post avec sélection de catégories, toggle like, fil de
  commentaires (charger / masquer / créer / supprimer), suppression de post (auteur uniquement).

**Sidebar** :
- `src/app/[locale]/admin/_components/AdminSidebar.tsx` : entrées Forum (`/admin/forums`,
  `/reader/forums`) activées (`enabled: true`).

---

## 14. Fichiers clés — session #3 (corrections post-test)

### Backend modifié (`KSM_Kernel_Layer/`)
- `RT-comops-bootstrap/src/main/resources/db/r2dbc/V78__ratings_core.sql` — ajout `comment_by_name`, `reply_by_name`
- `RT-comops-bootstrap/.../db/changelog/db.changelog-master.yaml` — retrait entrée `087-ratings-comment-author-name.yaml`
- `RT-comops-ratings-core/.../application/service/CommentService.java` — `setCommentByName`
- `RT-comops-ratings-core/.../application/service/CommentReplyService.java` — `setReplyByName`
- `RT-comops-ratings-core/.../application/port/in/CommentReplyDTO.java` — getters/setters `replyByName`
- `RT-comops-ratings-core/.../adapter/out/persistence/EntityStatsPersistenceAdapter.java` — fix `markNew()` (point 7)
- `RT-comops-forum-core/.../application/port/out/ForumCategorieRepository.java` — `findByCategorieNameAndGroupeId`
- `RT-comops-forum-core/.../adapter/out/persistence/R2dbcForumCategorieRepository.java` — idem Spring Data
- `RT-comops-forum-core/.../adapter/out/persistence/CategoriePersistenceAdapter.java` — override
- `RT-comops-forum-core/.../application/service/ForumCategorieService.java` — unicité scopée par groupe
- `RT-comops-forum-core/.../application/port/in/PostUseCase.java` — suppression méthodes mortes like/dislike
- `RT-comops-forum-core/.../application/service/PostService.java` — suppression + filtre soft-delete
- `RT-comops-forum-core/.../adapter/in/web/PostController.java` — suppression endpoints DELETE like/dislike
- `RT-comops-forum-core/.../adapter/in/web/DiscussionGroupController.java` — `GET /groups/public`
- `RT-comops-administration-core/.../PermissionCatalogService.java` — suppression permissions forum mortes

**Supprimés** :
- `RT-comops-bootstrap/src/main/resources/db/r2dbc/V84__ratings_comment_author_name.sql`
- `RT-comops-bootstrap/.../db/changelog/releases/087-ratings-comment-author-name.yaml`
- `RT-comops-forum-core/.../adapter/in/web/LoginRequest.java`
- `RT-comops-forum-core/.../adapter/in/web/RegistrationRequest.java`

### Frontend modifié (`yownews/src/`)
- `components/feed/ContentDetailView.tsx` — auteur commentaire, réponses UI, like sans compteur, audio podcast
- `components/education/BlogPreviewModal.tsx` — prop `audioPath`, lecteur audio
- `components/education/ContentModeration.tsx` — passage `coverPath`/`audioPath` à la modale
- `app/[locale]/editor/ContentWorkspace.tsx` — durée en minutes, lien « Gérer les unités »
- `app/[locale]/admin/newsletters/NewslettersAdminWorkspace.tsx` — onglet catégories + `CategoriesManager`
- `app/[locale]/admin/_components/AdminSidebar.tsx` — toggle ×/☰, logo → landing, forum activé
- `server/ksm/modules/newsletter.ts` — `createCategory`, `updateCategory`, `deleteCategory`
- `server/ksm/modules/ratings.ts` — champs `commentByName`/`replyByName`
- `app/api/newsletter/categories/route.ts` — ajout `POST`
- `app/api/ratings/comments/route.ts` — calcul `commentByName` depuis session
- `app/api/ratings/comments/[id]/replies/route.ts` — calcul `replyByName` depuis session

### Frontend nouveau (`yownews/src/`)
- `app/api/newsletter/categories/[id]/route.ts` — `PUT`, `DELETE`
- `app/[locale]/editor/course/[id]/page.tsx` + `CourseUnitsManager.tsx` — gestion unités de cours
- `server/ksm/modules/forum.ts` — client KSM forum complet
- `app/api/forum/groups/route.ts`, `groups/admin/route.ts`, `groups/[id]/validate/route.ts`, `groups/[id]/reject/route.ts`
- `app/api/forum/posts/route.ts`, `posts/group/[groupId]/route.ts`, `posts/[id]/like/route.ts`, `posts/[id]/dislike/route.ts`
- `app/api/forum/categories/group/[groupId]/route.ts`, `categories/[id]/route.ts`
- `app/api/forum/commentaires/post/[postId]/route.ts`, `commentaires/[id]/route.ts`
- `app/[locale]/admin/forums/page.tsx` + `ForumAdminWorkspace.tsx`
- `app/[locale]/reader/forums/page.tsx` + `ForumListPage.tsx`
- `app/[locale]/reader/forums/[groupId]/page.tsx` + `ForumGroupView.tsx`
