interface CollisionResult {
  collision: boolean;
  direction: "none" | "top" | "bottom" | "left" | "right";
  offset: number;
}
export const boxCollider = (
  aX: number,
  aY: number,
  aW: number,
  aH: number,
  bX: number,
  bY: number,
  bW: number,
  bH: number
): CollisionResult => {
  const col: CollisionResult = {
    collision: false,
    direction: "none",
    offset: 0,
  };
  const distanceX = aX - bX;
  const distanceY = aY - bY;
  const distanceXabs = Math.abs(distanceX);
  const distanceYabs = Math.abs(distanceY);
  const combinedW = aW / 2 + bW / 2;
  const combinedH = aH / 2 + bH / 2;

  if (distanceXabs < combinedW && distanceYabs < combinedH) {
    const offsetX = combinedW - distanceXabs;
    const offsetY = combinedH - distanceYabs;

    col.collision = true;

    if (offsetX >= offsetY) {
      col.offset = offsetY;
      if (distanceY > 0) {
        col.direction = "top";
      } else {
        col.direction = "bottom";
      }
    } else {
      col.offset = offsetX;
      if (distanceX > 0) {
        col.direction = "left";
      } else {
        col.direction = "right";
      }
    }
  }

  return col;
};
