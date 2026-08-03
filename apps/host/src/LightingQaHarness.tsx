import type {
  ControllerButton,
  SignalSprintPlayer,
  SignalSprintState,
} from "@party-game/shared";
import type {
  RobotPresentation,
  RobotPresentationState,
} from "./robot-presentation";
import { SharedVenue } from "./SharedVenue";
import { SignalSprintResults } from "./SignalSprintResults";

export const LIGHTING_QA_SCENARIOS = [
  "one-idle",
  "one-contact",
  "one-wrong",
  "one-stunned",
  "one-partial",
  "one-complete",
  "one-results",
  "four-active",
  "four-contact",
  "four-mixed",
  "four-stunned",
  "four-results",
] as const;

export type LightingQaScenario = (typeof LIGHTING_QA_SCENARIOS)[number];

export const LIGHTING_QA_FULL_HD_VIEWPORT = "1920x1080";

export const getLightingQaScenario = (
  search: string,
  development: boolean,
): LightingQaScenario | undefined => {
  if (!development) {
    return undefined;
  }

  const value = new URLSearchParams(search).get("lightingQa");
  return LIGHTING_QA_SCENARIOS.find((scenario) => scenario === value);
};

export const shouldUseLightingQaFullHdCaptureFrame = (
  search: string,
  development: boolean,
) =>
  development &&
  new URLSearchParams(search).get("lightingQaViewport") ===
    LIGHTING_QA_FULL_HD_VIEWPORT;

export const LightingQaFullHdCaptureFrame = ({
  scenario,
}: {
  scenario: LightingQaScenario;
}) => (
  <iframe
    className="lighting-qa-full-hd-frame"
    src={`/?lightingQa=${scenario}&assetRevision=3`}
    title={`${scenario} full-HD QA capture`}
  />
);

const targets: readonly ControllerButton[] = [
  "secondary1",
  "primary",
  "secondary3",
  "secondary4",
];

const playerNames = ["Luma", "Echo", "Tiko", "Nex"] as const;

const createPlayer = (
  playerNumber: number,
  score: number,
  mistakes = 0,
): SignalSprintPlayer => ({
  playerId: `lighting-qa-player-${playerNumber}`,
  playerNumber,
  displayName: playerNames[playerNumber - 1] ?? `Crew ${playerNumber}`,
  accent: "violet",
  connectionState: "connected",
  target: targets[playerNumber - 1] ?? "secondary2",
  score,
  mistakes,
  stunnedUntil: null,
  lastOutcome: null,
});

interface ScenarioConfig {
  scores: readonly number[];
  lightingState: RobotPresentationState;
  lightingMistakes?: number;
  results?: boolean;
}

const SCENARIO_CONFIG: Record<LightingQaScenario, ScenarioConfig> = {
  "one-idle": { scores: [0], lightingState: "idle" },
  "one-contact": { scores: [7], lightingState: "correct" },
  "one-wrong": { scores: [6], lightingState: "wrong", lightingMistakes: 1 },
  "one-stunned": {
    scores: [6],
    lightingState: "stunned",
    lightingMistakes: 1,
  },
  "one-partial": { scores: [5], lightingState: "working" },
  "one-complete": { scores: [15], lightingState: "working" },
  "one-results": { scores: [15], lightingState: "winning", results: true },
  "four-active": { scores: [0, 0, 0, 0], lightingState: "idle" },
  "four-contact": { scores: [7, 4, 9, 3], lightingState: "correct" },
  "four-mixed": { scores: [5, 2, 11, 7], lightingState: "working" },
  "four-stunned": {
    scores: [5, 2, 11, 7],
    lightingState: "stunned",
    lightingMistakes: 1,
  },
  "four-results": {
    scores: [15, 9, 12, 7],
    lightingState: "winning",
    results: true,
  },
};

const presentation = (
  state: RobotPresentationState,
): RobotPresentation => ({
  state,
  label:
    state === "correct"
      ? "Lighting cue confirmed"
      : state === "wrong"
        ? "Wrong control contact"
        : state === "stunned"
          ? "Lighting controls locked"
          : state === "winning"
            ? "Top crew"
            : state === "working"
              ? "Working"
              : "Work ready",
  acknowledgementSequence: null,
  showAcknowledgement: false,
});

const getScenarioPresentation = (
  player: SignalSprintPlayer,
  lightingState: RobotPresentationState,
  results: boolean,
) => {
  if (results) {
    return presentation(player.playerNumber === 1 ? "winning" : "losing");
  }
  if (player.playerNumber === 1) {
    return presentation(lightingState);
  }
  return presentation(player.score > 0 ? "working" : "idle");
};

export const LightingQaHarness = ({
  scenario,
}: {
  scenario: LightingQaScenario;
}) => {
  const config = SCENARIO_CONFIG[scenario];
  const players = config.scores.map((score, index) =>
    createPlayer(
      index + 1,
      score,
      index === 0 ? (config.lightingMistakes ?? 0) : 0,
    ),
  );
  const game: SignalSprintState = {
    roomCode: "QA01",
    phase: config.results ? "results" : "playing",
    roundId: 4,
    countdownEndsAt: null,
    roundEndsAt: config.results ? null : 18_400,
    scoreToWin: 15,
    players,
    winnerPlayerIds: config.results ? [players[0]?.playerId ?? ""] : [],
  };
  const getPresentation = (player: SignalSprintPlayer) =>
    getScenarioPresentation(
      player,
      config.lightingState,
      Boolean(config.results),
    );

  return (
    <main
      className={`host-screen host-screen--${game.phase} host-screen--lighting-qa`}
      data-lighting-qa-scenario={scenario}
    >
      <div className="venue-set" aria-hidden="true">
        <span className="venue-rig venue-rig--left" />
        <span className="venue-rig venue-rig--right" />
        <span className="venue-curtain venue-curtain--left" />
        <span className="venue-curtain venue-curtain--right" />
        <span className="venue-floor-line" />
      </div>
      <header className="host-header">
        <div>
          <p className="eyebrow">Event Rescue // Lighting QA</p>
          <h1>Signal Sprint</h1>
        </div>
        <div className="header-status">
          <span className="header-room">Room QA01</span>
          <div className="connection connection--connected" role="status">
            <span className="connection__dot" aria-hidden="true" />
            Presentation-only QA state
          </div>
        </div>
      </header>

      {config.results ? (
        <SignalSprintResults
          game={game}
          getPresentation={getPresentation}
          replayDisabled={false}
          pendingReplay={false}
          actionsDisabled={false}
          onReplay={() => undefined}
          onReturnToLobby={() => undefined}
          waitingNames={[]}
          error=""
        />
      ) : (
        <section className="play-stage">
          <div className="round-bar">
            <div>
              <span>Presentation QA // Round {game.roundId}</span>
              <strong>Route the next cue</strong>
            </div>
            <div className="round-timer" aria-label="Time remaining">
              <strong>18.4</strong>
              <span>seconds</span>
            </div>
          </div>
          <SharedVenue
            players={players}
            scoreToWin={game.scoreToWin}
            getPresentation={getPresentation}
          />
        </section>
      )}

      <footer className="host-footer">
        <span>Deterministic presentation-only QA</span>
        <strong>{scenario}</strong>
        <span>Production rules and timing are unchanged</span>
      </footer>
    </main>
  );
};
