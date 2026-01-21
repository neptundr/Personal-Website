import {useMotionValue, useSpring} from 'framer-motion';

export const useTilt = () => {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothRotateX = useSpring(rotateX, {stiffness: 180, damping: 22});
  const smoothRotateY = useSpring(rotateY, {stiffness: 180, damping: 22});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // signed position in range [-1, 1]
    const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    const maxTilt = 12;

    // IMPORTANT:
    // Y movement affects rotateX
    // X movement affects rotateY
    // Y is inverted because screen coords grow downward
    rotateX.set(-py * maxTilt);
    rotateY.set(px * maxTilt);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return {
    rotateX: smoothRotateX,
    rotateY: smoothRotateY,
    handleMouseMove,
    reset,
  };
};