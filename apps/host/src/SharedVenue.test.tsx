import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CONTROLLER_BUTTONS,
  type ControllerButton,
  type SignalSprintPlayer,
} from "@party-game/shared";
import type { RobotPresentation } from "./robot-presentation";
import { SharedVenue } from "./SharedVenue";
import { LIGHTING_ROBOT_SPRITE_ASSETS } from "./sprite-assets";
import { getVenueStationSystems } from "./station-presentation";
import { StationTargetDisplay } from "./StationTargetDisplay";

const targets: readonly ControllerButton[] = [
  "primary",
  "secondary1",
  "secondary2",
  "secondary3",
];

const player = (
  playerNumber: number,
  overrides: Partial<SignalSprintPlayer> = {},
): SignalSprintPlayer => ({
  playerId: `player-${playerNumber}`,
  playerNumber,
  displayName: `Crew ${playerNumber}`,
  accent: "violet",
  connectionState: "connected",
  target: targets[playerNumber - 1] ?? "secondary4",
  score: playerNumber - 1,
  mistakes: 0,
  stunnedUntil: null,
  lastOutcome: null,
  ...overrides,
});

const presentation: RobotPresentation = {
  state: "working",
  label: "Working",
  acknowledgementSequence: null,
  showAcknowledgement: false,
};

const renderVenue = (playerCount: number) =>
  renderToStaticMarkup(
    <SharedVenue
      players={Array.from({ length: playerCount }, (_, index) =>
        player(index + 1),
      )}
      scoreToWin={15}
      getPresentation={() => presentation}
    />,
  );

const renderLightingState = (
  state: RobotPresentation["state"],
  overrides: Partial<SignalSprintPlayer> = {},
) =>
  renderToStaticMarkup(
    <SharedVenue
      players={[player(1, overrides)]}
      scoreToWin={15}
      getPresentation={() => ({
        ...presentation,
        state,
        label: state,
      })}
    />,
  );

describe("shared Signal Sprint venue", () => {
  it.each([1, 2, 3, 4])(
    "renders exactly %i connected workstation(s)",
    (playerCount) => {
      const markup = renderVenue(playerCount);
      expect(markup.match(/class="player-workstation /g)).toHaveLength(
        playerCount,
      );
      expect(markup).toContain(`data-player-count="${playerCount}"`);
    },
  );

  it.each([
    [1, ["lighting"]],
    [2, ["lighting", "sound"]],
    [3, ["lighting", "sound", "decorations"]],
    [4, ["lighting", "sound", "decorations", "machinery"]],
  ] as const)(
    "renders only the %i occupied station assignment(s)",
    (playerCount, stationTypes) => {
      const markup = renderVenue(playerCount);
      const occupiedStationTypes = new Set<string>(stationTypes);
      for (const stationType of [
        "lighting",
        "sound",
        "decorations",
        "machinery",
      ] as const) {
        if (occupiedStationTypes.has(stationType)) {
          expect(markup).toContain(`data-station-type="${stationType}"`);
        } else {
          expect(markup).not.toContain(`data-station-type="${stationType}"`);
        }
      }
    },
  );

  it("does not render empty player placeholders in the one-player composition", () => {
    const markup = renderVenue(1);
    expect(markup).not.toContain("Open slot");
    expect(markup).not.toContain("placeholder");
  });

  it("renders the focused Lighting workstation as explicit depth layers", () => {
    const markup = renderVenue(1);

    for (const layer of [
      "lighting-bay-background",
      "station-back",
      "robot",
      "station-front",
      "dynamic-target-monitor",
      "local-station-effects",
      "foreground-props",
    ]) {
      expect(markup).toContain(`data-layer="${layer}"`);
    }
    expect(markup).toContain('data-lighting-state="broken"');
  });

  it("represents one dominant primary and four grouped secondary controls", () => {
    const markup = renderVenue(1);

    expect(markup.match(/lighting-control--primary/g)).toHaveLength(1);
    expect(markup.match(/lighting-control--secondary/g)).toHaveLength(4);
    for (const target of CONTROLLER_BUTTONS) {
      expect(markup).toContain(`data-button="${target}"`);
    }
  });

  it("attaches an independent semantic target to every workstation", () => {
    const markup = renderVenue(4);
    for (const target of targets) {
      expect(markup).toContain(`data-target="${target}"`);
    }
  });

  it("keeps all five semantic target identifiers visible", () => {
    const markup = renderToStaticMarkup(
      <div>
        {CONTROLLER_BUTTONS.map((target) => (
          <StationTargetDisplay key={target} target={target} />
        ))}
      </div>,
    );

    for (const target of CONTROLLER_BUTTONS) {
      expect(markup).toContain(`data-target="${target}"`);
      expect(markup).toContain(`>${target}</small>`);
    }
  });

  it("keeps fixed player identity attributes separate from target tone attributes", () => {
    const markup = renderToStaticMarkup(
      <SharedVenue
        players={[player(1, { target: "secondary2" })]}
        scoreToWin={15}
        getPresentation={() => presentation}
      />,
    );

    expect(markup).toContain('data-identity-colour="red"');
    expect(markup).toContain('data-target="secondary2"');
    expect(markup).toContain('data-tone="blue"');
  });

  it("keeps the target dynamic, redundant, and accessible inside Lighting", () => {
    const markup = renderLightingState("working", { target: "secondary3" });

    expect(markup).toContain('data-target-monitor="integrated"');
    expect(markup).toContain("lighting-monitor-housing");
    expect(markup).toContain('data-target="secondary3"');
    expect(markup).toContain('data-tone="yellow"');
    expect(markup).toContain('aria-label="Current target 3 Yellow"');
    expect(markup).toContain(">secondary3</small>");
    expect(markup).not.toContain("lighting-detached-target-card");
    expect(markup).not.toContain("lighting-interaction-status");
  });

  it("maps active Lighting states to dedicated work-capable robot material", () => {
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.idle?.name).toBe("work-idle");
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.working?.name).toBe("work-idle");
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.inputAcknowledgement?.name).toBe(
      "reach-contact",
    );
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.correct?.name).toBe("reach-contact");
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.wrong?.name).toBe("wrong-recoil");
    expect(LIGHTING_ROBOT_SPRITE_ASSETS.stunned?.name).toBe("stunned-hold");
  });

  it("attaches runtime identity and stable anchors to the Lighting robot", () => {
    const markup = renderVenue(1);

    expect(markup).toContain('data-presentation-anchor="head"');
    expect(markup).toContain('data-presentation-anchor="torso"');
    expect(markup).toContain('data-presentation-anchor="working-hand"');
    expect(markup).toContain('data-presentation-anchor="feet"');
    expect(markup).toContain('data-presentation-anchor="station-contact"');
    expect(markup).toContain("identity-mark--circle");
    expect(markup).toContain("--robot-anchor-torso-x");
    expect(markup).toContain("--robot-anchor-hand-y");
  });

  it("selects positive feedback only from an authoritative correct presentation", () => {
    const markup = renderLightingState("correct");

    expect(markup).toContain('data-interaction-phase="contact"');
    expect(markup).toContain('data-feedback-tone="positive"');
    expect(markup).toContain('data-lighting-feedback="correct"');
    expect(markup).toContain("Lighting cue confirmed");
  });

  it("distinguishes immediate wrong feedback from authoritative stun lockout", () => {
    const wrongMarkup = renderLightingState("wrong");
    const stunnedMarkup = renderLightingState("stunned", { stunnedUntil: 900 });

    expect(wrongMarkup).toContain('data-interaction-phase="wrongReaction"');
    expect(wrongMarkup).toContain('data-feedback-tone="warning"');
    expect(wrongMarkup).toContain('data-controls-locked="false"');
    expect(stunnedMarkup).toContain('data-interaction-phase="stunnedHold"');
    expect(stunnedMarkup).toContain('data-feedback-tone="locked"');
    expect(stunnedMarkup).toContain('data-controls-locked="true"');
    expect(stunnedMarkup).toContain("Lighting controls locked");
  });

  it("maps every player's score to only that player's station", () => {
    const systems = getVenueStationSystems(
      [
        player(1, { score: 0 }),
        player(2, { score: 1 }),
        player(3, { score: 10 }),
        player(4, { score: 15 }),
      ],
      15,
    );

    expect(systems.map(({ state }) => state)).toEqual([
      "broken",
      "partial",
      "nearlyOperational",
      "complete",
    ]);
  });

  it("does not complete another station when Lighting completes", () => {
    const systems = getVenueStationSystems(
      [
        player(1, { score: 15 }),
        player(2, { score: 1 }),
        player(3, { score: 0 }),
        player(4, { score: 10 }),
      ],
      15,
    );

    expect(systems.map(({ station, state }) => [station.type, state])).toEqual([
      ["lighting", "complete"],
      ["sound", "partial"],
      ["decorations", "broken"],
      ["machinery", "nearlyOperational"],
    ]);
  });

  it("retains the CSS robot fallback and a visible state label", () => {
    const markup = renderVenue(1);
    expect(markup).toContain('data-visual-source="css-fallback"');
    expect(markup).toContain('data-station-type="lighting"');
    expect(markup).toContain("Working");
  });

  it("exposes station state text independently of motion", () => {
    const markup = renderVenue(4);
    expect(markup).toContain("Lighting control: broken");
    expect(markup).toContain("Sound control: partially operational");
    expect(markup).toContain("Decorations / event setup: partially operational");
    expect(markup).toContain("Stage machinery: partially operational");
  });
});
