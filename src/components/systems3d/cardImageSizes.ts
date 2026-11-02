/**
 * The card's width for the `sizes` of its images (the poster and the end stills), as the layout
 * draws it: the viewport less the page gutters below 1280 px (16 px each side on phones, 24 px from
 * 768 px), and 600 px beside the accordion from 1280 px.
 *
 * O-10: with `100vw` the phone layout fetched the 750 w poster on a 412 px, DPR 1.75 phone; with the
 * card's true width the browser takes the 640 w file. Chrome fetches the poster while the page loads
 * (it is within the lazy-loading distance on a fast connection), so its weight counts in the load.
 *
 * A plain module (not `'use client'`), so the server-rendered poster can import the value.
 */
export const CARD_IMAGE_SIZES =
  '(max-width: 767px) calc(100vw - 32px), (max-width: 1279px) calc(100vw - 48px), 600px'
