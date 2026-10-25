import confetti from 'canvas-confetti';

/**
 * Fires multi-stage gold, amber, and champagne sparkles for election closure and winner reveals.
 */
export const fireGoldConfetti = () => {
  const count = 180;
  const defaults = {
    origin: { y: 0.65 },
    colors: ['#D4AF37', '#F5E080', '#E6C76B', '#C9A020', '#FFFFFF', '#FFDF73'],
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    try {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    } catch {
      // fallback if canvas is unavailable
    }
  };

  fire(0.25, {
    spread: 30,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.9,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

/**
 * Fires a triumphant 2.5-second celebration cannon from both screen edges.
 */
export const fireWinnerCannon = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const colors = ['#D4AF37', '#FFD700', '#FFF8DC', '#E6C76B', '#FFFFFF'];

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    try {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        zIndex: 9999,
      });
    } catch {
      clearInterval(interval);
    }
  }, 200);
};
