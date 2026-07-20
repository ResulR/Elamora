import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { Resend } from "resend";
import { config } from "../config.js";

type Mode = "daily" | "weekly" | "failure" | "shutdown";

type Check = {
  label: string;
  ok: boolean;
  detail: string;
  evidence?: string[];
};

const BACKUP_DIR = config.backup.directory;
const BACKUP_PATTERN = new RegExp(
  `^${escapeRegExp(config.backup.dbName)}-(\\d{4})-(\\d{2})-(\\d{2})-(\\d{6})\\.dump$`,
);
const RECIPIENT = config.backupReportEmail;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CommandResult = {
  ok: boolean;
  executable: string;
  args: string[];
  commandLine: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  output: string;
  systemError: string | null;
};

function formatCommandLine(
  executable: string,
  args: string[],
): string {
  return [executable, ...args]
    .map((value) => JSON.stringify(value))
    .join(" ");
}

function safeCommand(
  executable: string,
  args: string[],
): CommandResult {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdout =
    typeof result.stdout === "string"
      ? result.stdout.trim()
      : "";

  const stderr =
    typeof result.stderr === "string"
      ? result.stderr.trim()
      : "";

  const systemError = result.error
    ? result.error.message
    : null;

  const output =
    stderr ||
    stdout ||
    systemError ||
    (result.signal
      ? `Processus interrompu par le signal ${result.signal}`
      : "");

  return {
    ok:
      !result.error &&
      result.status === 0 &&
      result.signal === null,
    executable,
    args: [...args],
    commandLine: formatCommandLine(
      executable,
      args,
    ),
    exitCode: result.status,
    signal: result.signal,
    stdout,
    stderr,
    output,
    systemError,
  };
}

function commandEvidence(
  result: CommandResult,
): string[] {
  const evidence = [
    `Commande : ${result.commandLine}`,
    `Code de sortie : ${
      result.exitCode === null
        ? "indisponible"
        : result.exitCode
    }`,
  ];

  if (result.signal) {
    evidence.push(`Signal : ${result.signal}`);
  }

  if (result.stdout) {
    evidence.push(`Sortie standard : ${result.stdout}`);
  }

  if (result.stderr) {
    evidence.push(`Erreur standard : ${result.stderr}`);
  }

  if (result.systemError) {
    evidence.push(
      `Erreur système : ${result.systemError}`,
    );
  }

  return evidence;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function expectedDateKeys(days: number): string[] {
  const result: string[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    result.push(utcDateKey(date));
  }

  return result;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Belgrade",
  }).format(date);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`;

  const kib = bytes / 1024;

  if (kib < 1024) return `${kib.toFixed(1)} Ko`;

  return `${(kib / 1024).toFixed(1)} Mo`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBackups() {
  return readdirSync(BACKUP_DIR)
    .filter((name) => BACKUP_PATTERN.test(name))
    .map((name) => {
      const path = join(BACKUP_DIR, name);
      const stats = statSync(path);
      const match = name.match(BACKUP_PATTERN);

      return {
        name,
        path,
        size: stats.size,
        modifiedAt: stats.mtime,
        dateKey: match
          ? `${match[1]}-${match[2]}-${match[3]}`
          : "",
      };
    })
    .sort(
      (left, right) =>
        right.modifiedAt.getTime() -
        left.modifiedAt.getTime(),
    );
}

function getDiskUsage(): {
  percentage: number | null;
  raw: string;
} {
  const result = safeCommand("/usr/bin/df", [
    "-P",
    BACKUP_DIR,
  ]);

  if (!result.ok) {
    return {
      percentage: null,
      raw: result.output,
    };
  }

  const lines = result.output.split("\n");
  const lastLine = lines.at(-1) ?? "";
  const columns = lastLine.trim().split(/\s+/);
  const percentageText = columns[4] ?? "";
  const percentage = Number(
    percentageText.replace("%", ""),
  );

  return {
    percentage: Number.isFinite(percentage)
      ? percentage
      : null,
    raw: result.output,
  };
}

function buildChecks(mode: Mode) {
  const checks: Check[] = [];
  const backups = getBackups();
  const latest = backups[0] ?? null;

  const timerEnabled = safeCommand(
    "/usr/bin/systemctl",
    ["is-enabled", "elamora-db-backup.timer"],
  );

  const timerActive = safeCommand(
    "/usr/bin/systemctl",
    ["is-active", "elamora-db-backup.timer"],
  );

  checks.push({
    label: "Planification active",
    ok:
      timerEnabled.ok &&
      timerEnabled.output === "enabled" &&
      timerActive.ok &&
      timerActive.output === "active",
    detail:
      `enabled=${timerEnabled.output || "unknown"}, ` +
      `active=${timerActive.output || "unknown"}`,
    evidence: [
      ...commandEvidence(timerEnabled),
      ...commandEvidence(timerActive),
    ],
  });

  checks.push({
    label: "Sauvegarde disponible",
    ok: latest !== null,
    detail: latest
      ? latest.path
      : "Aucun fichier de sauvegarde trouvé.",
    evidence: latest
      ? [
          `Fichier détecté : ${latest.path}`,
          `Date réelle : ${latest.modifiedAt.toISOString()}`,
          `Taille réelle : ${latest.size} octets`,
        ]
      : [
          `Dossier analysé : ${BACKUP_DIR}`,
          `Format recherché : ${BACKUP_PATTERN.source}`,
          `Nombre de fichiers correspondants : ${backups.length}`,
        ],
  });

  if (latest) {
    const ageHours =
      (Date.now() - latest.modifiedAt.getTime()) /
      (1000 * 60 * 60);

    checks.push({
      label: "Sauvegarde récente",
      ok: ageHours <= config.backup.maxAgeHours,
      detail:
        `${ageHours.toFixed(1)} heure(s) — ` +
        `${formatDateTime(latest.modifiedAt)}`,
      evidence: [
        `Fichier contrôlé : ${latest.path}`,
        `Date du fichier : ${latest.modifiedAt.toISOString()}`,
        `Âge calculé : ${ageHours.toFixed(2)} heure(s)`,
        `Seuil configuré : ${config.backup.maxAgeHours} heures`,
      ],
    });

    checks.push({
      label: "Fichier non vide",
      ok: latest.size >= config.backup.minSizeBytes,
      detail: formatSize(latest.size),
      evidence: [
        `Fichier contrôlé : ${latest.path}`,
        `Taille mesurée : ${latest.size} octets`,
        `Taille minimale configurée : ${config.backup.minSizeBytes} octets`,
      ],
    });

    const archive = safeCommand("/usr/bin/pg_restore", [
      "--list",
      latest.path,
    ]);

    const archiveEntries = archive.ok
      ? archive.output.split("\n").length
      : 0;

    checks.push({
      label: "Archive PostgreSQL lisible",
      ok: archive.ok && archiveEntries >= config.backup.minArchiveEntries,
      detail: archive.ok
        ? `${archiveEntries} lignes vérifiées`
        : archive.output,
      evidence: [
        `Fichier contrôlé : ${latest.path}`,
        `Nombre de lignes retournées : ${archiveEntries}`,
        `Minimum configuré : ${config.backup.minArchiveEntries} lignes`,
        ...commandEvidence(archive),
      ],
    });
  }

  if (mode === "weekly") {
    const availableDates = new Set(
      backups.map((backup) => backup.dateKey),
    );

    const oldestBackupDate =
      backups.length > 0
        ? backups[backups.length - 1]?.dateKey
        : undefined;

    const expectedDates = expectedDateKeys(7).filter(
      (date) =>
        !oldestBackupDate || date >= oldestBackupDate,
    );

    const missingDates = expectedDates.filter(
      (date) => !availableDates.has(date),
    );

    checks.push({
      label: "Une sauvegarde chaque jour",
      ok: missingDates.length === 0,
      detail:
        missingDates.length === 0
          ? expectedDates.length === 7
            ? "Les 7 derniers jours sont couverts."
            : `Tous les jours sont couverts depuis la mise en service (${oldestBackupDate}).`
          : `Jours manquants : ${missingDates.join(", ")}`,
      evidence: [
        `Dates attendues : ${expectedDates.join(", ")}`,
        `Dates disponibles : ${[...availableDates].sort().join(", ")}`,
        `Dates manquantes : ${
          missingDates.length > 0
            ? missingDates.join(", ")
            : "aucune"
        }`,
        `Première sauvegarde disponible : ${
          oldestBackupDate ?? "indisponible"
        }`,
      ],
    });
  }

  const serviceResult = safeCommand(
    "/usr/bin/systemctl",
    [
      "show",
      "elamora-db-backup.service",
      "-p",
      "Result",
      "-p",
      "ExecMainStatus",
      "--value",
    ],
  );

  const serviceValues = serviceResult.output
    .split("\n")
    .filter(Boolean);

  const serviceSuccess =
    serviceResult.ok &&
    serviceValues.includes("success") &&
    serviceValues.includes("0");

  checks.push({
    label: "Dernière exécution terminée correctement",
    ok: serviceSuccess,
    detail:
      serviceValues.length >= 2
        ? `Result=${serviceValues[0]}, ExecMainStatus=${serviceValues[1]}`
        : serviceResult.output || "Résultat indisponible",
    evidence: [
      `Valeurs systemd reçues : ${
        serviceValues.length > 0
          ? serviceValues.join(", ")
          : "aucune"
      }`,
      ...commandEvidence(serviceResult),
    ],
  });

  const disk = getDiskUsage();

  checks.push({
    label: "Espace disque suffisant",
    ok:
      disk.percentage !== null &&
      disk.percentage < config.backup.diskWarningPercent,
    detail:
      disk.percentage === null
        ? disk.raw
        : `${disk.percentage}% utilisé`,
    evidence: [
      `Dossier contrôlé : ${BACKUP_DIR}`,
      `Pourcentage mesuré : ${
        disk.percentage === null
          ? "indisponible"
          : `${disk.percentage}%`
      }`,
      `Seuil configuré : ${config.backup.diskWarningPercent}%`,
      `Résultat df : ${disk.raw || "indisponible"}`,
    ],
  });

  const expired = backups.filter((backup) => {
    const ageDays =
      (Date.now() - backup.modifiedAt.getTime()) /
      (1000 * 60 * 60 * 24);

    return ageDays > config.backup.retentionDays;
  });

  checks.push({
    label: "Rétention respectée",
    ok: expired.length === 0,
    detail:
      expired.length === 0
        ? "Aucun ancien fichier expiré."
        : `${expired.length} ancien(s) fichier(s) trouvé(s).`,
    evidence: [
      "Seuil de contrôle configuré : plus de 15 jours",
      `Nombre total de sauvegardes détectées : ${backups.length}`,
      `Nombre de fichiers expirés détectés : ${expired.length}`,
      `Fichiers expirés : ${
        expired.length > 0
          ? expired
              .map((backup) => backup.path)
              .join(", ")
          : "aucun"
      }`,
    ],
  });

  if (mode === "failure") {
    checks.push({
      label: "Alerte d’échec reçue",
      ok: false,
      detail:
        serviceResult.output ||
        "Aucun résultat systemd disponible.",
      evidence: [
        "Mode d’exécution reçu : failure",
        ...commandEvidence(serviceResult),
      ],
    });
  }

  return {
    checks,
    backups,
    latest,
    disk,
  };
}

function buildTechnicalReport(
  mode: Mode,
  checks: Check[],
  backups: ReturnType<typeof getBackups>,
): string {
  const failedChecks = checks.filter(
    (check) => !check.ok,
  );

  const successfulChecks = checks.filter(
    (check) => check.ok,
  );

  const latest = backups[0] ?? null;
  const reportSuccess = failedChecks.length === 0;

  const lines = [
    "ELAMORA — ÉTAT DES SAUVEGARDES",
    "================================",
    "",
    `Statut : ${reportSuccess ? "SUCCÈS" : "ÉCHEC"}`,
    `Contrôle : ${mode}`,
    `Généré le : ${formatDateTime(new Date())}`,
    "",
    "DERNIÈRE SAUVEGARDE",
    "-------------------",
    latest
      ? `Fichier : ${latest.name}`
      : "Fichier : aucun fichier détecté",
    latest
      ? `Date : ${formatDateTime(latest.modifiedAt)}`
      : "Date : indisponible",
    latest
      ? `Taille : ${formatSize(latest.size)}`
      : "Taille : indisponible",
    "",
  ];

  if (reportSuccess) {
    lines.push(
      "CONTRÔLES",
      "---------",
      ...successfulChecks.map(
        (check) =>
          `[OK] ${check.label} — ${check.detail}`,
      ),
      "",
      "ACTION",
      "------",
      "Aucune action nécessaire.",
      "",
    );

    return lines.join("\n");
  }

  lines.push(
    "PROBLÈMES DÉTECTÉS",
    "------------------",
  );

  failedChecks.forEach((check, index) => {
    lines.push(
      "",
      `${index + 1}. ${check.label}`,
      `Résultat observé : ${check.detail}`,
    );

    if (check.evidence?.length) {
      lines.push(
        "Preuves observées :",
        ...check.evidence.map(
          (item) => `- ${item}`,
        ),
      );
    }
  });

  const journal = safeCommand(
    "/usr/bin/journalctl",
    [
      "-u",
      "elamora-db-backup.service",
      "-n",
      "40",
      "--no-pager",
      "--output",
      "short-iso",
    ],
  );

  lines.push(
    "",
    "JOURNAL RÉCENT DU SERVICE",
    "-------------------------",
    `Commande : ${journal.commandLine}`,
    `Code de sortie : ${
      journal.exitCode === null
        ? "indisponible"
        : journal.exitCode
    }`,
    journal.stdout ||
      journal.stderr ||
      journal.systemError ||
      "Aucune ligne retournée.",
    "",
  );

  return lines.join("\n");
}

async function sendReport(
  mode: Mode,
  testMode: boolean,
) {
  if (!config.email.configured) {
    throw new Error("email_not_configured");
  }

  const { checks, backups, latest } =
    buildChecks(mode);

  const normalSuccess = checks.every(
    (check) => check.ok,
  );

  const success =
    mode === "shutdown"
      ? normalSuccess
      : mode === "failure"
        ? false
        : normalSuccess;

  const technicalReport = buildTechnicalReport(
    mode,
    checks,
    backups,
  );

  const testPrefix = testMode ? "[TEST] " : "";

  let subject: string;
  let title: string;
  let summary: string;

  if (mode === "shutdown") {
    subject =
      `${testPrefix}[Elamora] Arrêt du VPS détecté`;
    title = "Le serveur Elamora est en train de s’arrêter";
    summary =
      "Un arrêt propre ou un redémarrage du VPS vient d’être détecté. " +
      "La dernière sauvegarde connue est indiquée ci-dessous.";
  } else if (success) {
    subject =
      `${testPrefix}[Elamora] Sauvegardes réussies`;
    title = "Tout va bien avec les sauvegardes";
    summary =
      "Les contrôles ont été effectués et aucun problème n’a été détecté. " +
      "Les sauvegardes sont récentes, lisibles et correctement planifiées.";
  } else {
    subject =
      `${testPrefix}[Elamora] ÉCHEC des sauvegardes`;
    title = "Un problème a été détecté avec les sauvegardes";
    summary =
      "Au moins un contrôle important a échoué. " +
      "Le résultat est volontairement classé en échec afin d’éviter tout faux positif.";
  }

  const failedChecks = checks.filter(
    (check) => !check.ok,
  );

  const latestText = latest
    ? `${formatDateTime(latest.modifiedAt)} — ${formatSize(latest.size)}`
    : "Aucune sauvegarde disponible";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f6f3f5;font-family:Arial,Helvetica,sans-serif;color:#271f24;">
        <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border:1px solid #eadde5;border-radius:18px;padding:28px;">
            <p style="margin:0 0 8px;font-size:13px;color:#7f4f73;text-transform:uppercase;letter-spacing:0.08em;">
              Elamora — contrôle des sauvegardes
            </p>

            <h1 style="margin:0 0 16px;font-size:25px;line-height:1.3;color:${success ? "#287a50" : mode === "shutdown" ? "#8a641f" : "#a12d3d"};">
              ${escapeHtml(title)}
            </h1>

            <div style="display:inline-block;margin:0 0 20px;padding:8px 14px;border-radius:999px;background:${success ? "#e7f7ee" : mode === "shutdown" ? "#fff4d9" : "#fde8eb"};color:${success ? "#246d49" : mode === "shutdown" ? "#7a5718" : "#922638"};font-weight:700;">
              ${success ? "SUCCÈS" : mode === "shutdown" ? "ARRÊT DÉTECTÉ" : "ÉCHEC"}
            </div>

            <p style="font-size:16px;line-height:1.65;margin:0 0 20px;">
              ${escapeHtml(summary)}
            </p>

            <div style="background:#f8f3f6;border-radius:14px;padding:16px;margin:18px 0;">
              <p style="margin:0 0 6px;font-size:13px;color:#74656e;">
                Dernière sauvegarde connue
              </p>
              <p style="margin:0;font-size:16px;font-weight:700;">
                ${escapeHtml(latestText)}
              </p>
            </div>

            ${
              failedChecks.length > 0
                ? `
                  <h2 style="font-size:17px;margin:24px 0 10px;">
                    Ce qui demande ton attention
                  </h2>
                  <ul style="padding-left:20px;line-height:1.7;">
                    ${failedChecks
                      .map(
                        (check) =>
                          `<li>${escapeHtml(check.label)}</li>`,
                      )
                      .join("")}
                  </ul>
                `
                : `
                  <p style="font-size:15px;line-height:1.6;margin:20px 0;">
                    Tu n’as aucune action à effectuer.
                  </p>
                `
            }

            ${
              success
                ? ""
                : `
                  <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#74656e;">
                    Le diagnostic factuel est disponible dans le fichier texte joint.
                  </p>
                `
            }
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    title,
    "",
    success
      ? "STATUT : SUCCÈS"
      : mode === "shutdown"
        ? "STATUT : ARRÊT DÉTECTÉ"
        : "STATUT : ÉCHEC",
    "",
    summary,
    "",
    `Dernière sauvegarde : ${latestText}`,
    "",
    failedChecks.length
      ? "Points à vérifier :"
      : "Aucune action nécessaire.",
    ...failedChecks.map(
      (check) => `- ${check.label}`,
    ),
    "",
    success
      ? "Aucune pièce jointe : aucune anomalie détectée."
      : "Le diagnostic factuel est joint dans un fichier texte.",
  ].join("\n");

  if (
    mode === "daily" &&
    success &&
    !testMode
  ) {
    console.log({
      sent: false,
      mode,
      testMode,
      success,
      recipient: RECIPIENT,
      reason: "daily_check_success_no_email_required",
    });

    return;
  }

  const resend = new Resend(
    config.email.resendApiKey,
  );

  const result = await resend.emails.send({
    from: config.email.from,
    to: RECIPIENT,
    replyTo: config.email.replyTo,
    subject,
    html,
    text,
    attachments: success
      ? undefined
      : [
          {
            filename:
              `elamora-backup-report-${new Date()
                .toISOString()
                .slice(0, 10)}.txt`,
            content: Buffer.from(
              technicalReport,
              "utf8",
            ),
          },
        ],
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log({
    sent: true,
    mode,
    testMode,
    success,
    recipient: RECIPIENT,
    providerMessageId: result.data?.id ?? null,
  });

  if (
    !testMode &&
    !success &&
    (mode === "daily" || mode === "weekly")
  ) {
    process.exitCode = 2;
  }
}

const rawMode = process.argv[2] ?? "weekly";
const testMode = process.argv.includes("--test");

if (
  !["daily", "weekly", "failure", "shutdown"].includes(
    rawMode,
  )
) {
  throw new Error(
    "Mode must be daily, weekly, failure or shutdown",
  );
}

sendReport(rawMode as Mode, testMode).catch(
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
