# Elamora content and language convention

Last updated: 17 June 2026

## Goal

Elamora is a public e-commerce website targeting customers in English. The user-facing experience must remain consistent, professional and understandable for payment review, customer support and legal trust.

## Public-facing language

The following content must be written in English:

- public website pages;
- checkout and confirmation screens;
- contact and legal pages;
- customer emails;
- customer-facing error messages;
- customer-facing order statuses;
- CTA buttons, forms, labels and helper text.

## Code language

Code identifiers should preferably be written in English:

- file names;
- component names;
- function names;
- variable names;
- route names;
- API field names.

This keeps the codebase consistent and easier for another developer to maintain.

## Internal comments

Internal comments should preferably be written in English.

However, comments in French are not considered blocking if:

- they are not visible to customers;
- they do not affect SEO, emails, legal pages or checkout;
- they are temporary technical notes for the developer.

When touching a file for another reason, French comments can be translated to English opportunistically.

## Rule for future changes

Before committing a visible UI/content change, check that the customer-facing text is in English.

Suggested quick check:

```bash
grep -R -n -E "Panier|Commande|Paiement|Livraison|Retour|Confidentialité|Mentions|Accueil|Contactez|valider|annuler|supprimer|chargement|erreur" \
  src \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude=routeTree.gen.ts \
  || true
```

If the result is only internal comments or non-visible developer notes, it is acceptable.
