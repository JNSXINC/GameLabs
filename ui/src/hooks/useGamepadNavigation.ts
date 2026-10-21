import { useEffect, useRef } from "react";

type Params = {
  enabled: boolean;
  onLeft: () => void;
  onRight: () => void;
  onUp: () => void;
  onDown: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onNextTab: () => void;
  onPreviousTab: () => void;
};

export function useGamepadNavigation({
  enabled,
  onLeft,
  onRight,
  onUp,
  onDown,
  onConfirm,
  onBack,
  onNextTab,
  onPreviousTab,
}: Params) {
  const callbacksRef = useRef({
    onLeft,
    onRight,
    onUp,
    onDown,
    onConfirm,
    onBack,
    onNextTab,
    onPreviousTab,
  });

  callbacksRef.current = {
    onLeft,
    onRight,
    onUp,
    onDown,
    onConfirm,
    onBack,
    onNextTab,
    onPreviousTab,
  };

  useEffect(() => {
    if (!enabled) return;

    let frameId = 0;
    let previousDirection = "";
    let nextRepeatTime = 0;

    const previousButtons = [false, false, false, false];

    const INITIAL_DELAY = 450;
    const REPEAT_INTERVAL = 350;
    const DEADZONE = 0.65;

    const pollGamepad = (timestamp: number) => {
      const gamepads = navigator.getGamepads?.() ?? [];
      const gamepad = Array.from(gamepads).find(
        (pad): pad is Gamepad => pad !== null && pad.connected,
      );

      let direction = "";

      if (gamepad) {
        const horizontal = gamepad.axes[0] ?? 0;
        const vertical = gamepad.axes[1] ?? 0;

        const left = gamepad.buttons[14]?.pressed ?? false;
        const right = gamepad.buttons[15]?.pressed ?? false;
        const up = gamepad.buttons[12]?.pressed ?? false;
        const down = gamepad.buttons[13]?.pressed ?? false;

        if (left || horizontal < -DEADZONE) {
          direction = "left";
        } else if (right || horizontal > DEADZONE) {
          direction = "right";
        } else if (up || vertical < -DEADZONE) {
          direction = "up";
        } else if (down || vertical > DEADZONE) {
          direction = "down";
        }

        const buttonIndexes = [0, 1, 4, 5];
        const actions = [
          callbacksRef.current.onConfirm,
          callbacksRef.current.onBack,
          callbacksRef.current.onPreviousTab,
          callbacksRef.current.onNextTab,
        ];

        buttonIndexes.forEach((index, i) => {
          const pressed = gamepad.buttons[index]?.pressed ?? false;

          if (pressed && !previousButtons[i]) {
            actions[i]();
          }

          previousButtons[i] = pressed;
        });
      } else {
        previousButtons.fill(false);
      }

      if (!direction) {
        previousDirection = "";
        nextRepeatTime = 0;
      } else if (
        direction !== previousDirection ||
        timestamp >= nextRepeatTime
      ) {
        const callbacks = callbacksRef.current;

        if (direction === "left") callbacks.onLeft();
        if (direction === "right") callbacks.onRight();
        if (direction === "up") callbacks.onUp();
        if (direction === "down") callbacks.onDown();

        nextRepeatTime =
          direction !== previousDirection
            ? timestamp + INITIAL_DELAY
            : timestamp + REPEAT_INTERVAL;

        previousDirection = direction;
      }

      frameId = requestAnimationFrame(pollGamepad);
    };

    frameId = requestAnimationFrame(pollGamepad);

    return () => cancelAnimationFrame(frameId);
  }, [enabled]);
}
