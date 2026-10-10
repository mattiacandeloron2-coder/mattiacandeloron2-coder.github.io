// Knobs for the Look Behind sticker. The artwork itself is the original PNG.
export const stickerConfig = {
  // "left-to-right" sticks from the left edge. "right-to-left" sticks from the right.
  direction: 'left-to-right',

  // How much of the sticker is already down when the slide arrives.
  initialAttachedFraction: 0.08,

  // Subdivisions along the curl (width) and across it (height).
  // The graphic is wide, so the curl direction gets more segments.
  widthSegments: 80,
  heightSegments: 24,
  narrowWidthSegments: 44,
  narrowHeightSegments: 14,

  // How far the free edge has turned at the start, in radians.
  // Just past a right angle, so the backing shows without becoming a roll.
  curlAngle: 1.9,

  // Higher values keep the sheet low and put the curl near the free edge.
  // Lower values lift more of the free sheet, so the bend is easy to see.
  curlBias: 1.85,

  // How quickly the curl shrinks as more of the sticker sticks down.
  curlFalloff: 0.4,

  // Extra curl during the last 10% of the scroll, as a fraction of curlAngle.
  // It returns to zero, so the sticker ends flat.
  settlingIntensity: 0.06,

  shadowOpacity: 0.12,
  shadowSoftness: 0.9,
  shadowOffset: 0.12,

  // World-unit thickness. The sticker height is 1.
  thickness: 0.0022,

  // Extra lag after the page scroll, in seconds. 0 follows the page directly.
  // The project scroll is already eased.
  scrollScrub: 0,

  // Fraction of the sticker slide's scroll used to finish sticking.
  // 1 uses the whole slide. 0.75 finishes earlier and then stays flat.
  scrollEnd: 1,

  // Off-white backing. Not the printed front.
  backColor: [0.953, 0.941, 0.914],

  // Camera distance. The flat sticker still fills its frame.
  // Larger values make the curl's perspective milder.
  cameraDistance: 11,

  // Camera angle while the sticker is still lifting, in radians.
  // It eases back to a straight-on view, so the finished sticker is undistorted.
  viewYaw: 0.2,
  viewPitch: 0.045,

  // Extra frame around the sticker while it is still lifting, so the curl
  // is not cut off. This eases back to zero when the sticker is flat.
  viewPadding: 0.14,
}
