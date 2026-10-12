import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nextSoundtrackHold, soundtrackCanPlay } from './soundtrack.js'

describe('nextSoundtrackHold', () => {
  it('lets the song play when no video is on screen', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: false, audible: false }), false)
    assert.equal(nextSoundtrackHold(true, { onVideo: false, audible: true }), false)
  })

  it('pauses for a video that is playing with sound', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: true, audible: true }), true)
  })

  it('keeps playing over a video that is still muted', () => {
    assert.equal(nextSoundtrackHold(false, { onVideo: true, audible: false }), false)
  })

  it('stays paused until the video has been scrolled away', () => {
    assert.equal(nextSoundtrackHold(true, { onVideo: true, audible: false }), true)
    assert.equal(nextSoundtrackHold(true, { onVideo: false, audible: false }), false)
  })
})

describe('soundtrackCanPlay', () => {
  it('stays silent while the mute button is on', () => {
    assert.equal(soundtrackCanPlay(true, false), false)
  })

  it('stays silent while a video is holding the song', () => {
    assert.equal(soundtrackCanPlay(false, true), false)
  })

  it('plays once the button is off and the video is gone', () => {
    assert.equal(soundtrackCanPlay(false, false), true)
  })
})
