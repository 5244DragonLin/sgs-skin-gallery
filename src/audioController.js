/**
 * audioController — 全局唯一的语音播放登记处。
 *
 * 页面里有多个互相独立的语音按钮（技能旁的小喇叭、底部语音列表），
 * 它们各自持有自己的音频对象，互不知道对方在播。
 * 这里用一个全局记录，保证"同一时间最多只有一段语音在响"：
 * 任意按钮开始播放前，先让正在响的那段停下来。
 */

let active = null; // { audio: HTMLAudioElement, stop: () => void }

/**
 * 声明"我要开始播放这段音频"。
 * 若当前有别的一段正在播放，先把它停下来（含界面复位）。
 *
 * @param {HTMLAudioElement} audio 本次要播放的音频对象
 * @param {() => void} stop 停掉本段音频并复位界面的回调
 */
export function claimPlayback(audio, stop) {
  if (active && active.audio !== audio) {
    try {
      active.stop();
    } catch (_) {
      /* 忽略旧音频已销毁等异常 */
    }
  }
  active = { audio, stop };
}

/**
 * 释放登记。仅在登记的正是本段音频时才清空（避免误清别人的）。
 * 用于音频自然播完、或组件卸载时。
 *
 * @param {HTMLAudioElement} audio 本段音频对象
 */
export function releasePlayback(audio) {
  if (active && active.audio === audio) {
    active = null;
  }
}

/**
 * 立即停止当前正在播放的语音（如有）。用于关闭弹窗等场景。
 */
export function stopAllAudio() {
  if (active) {
    try {
      active.stop();
    } catch (_) {
      /* ignore */
    }
    active = null;
  }
}
