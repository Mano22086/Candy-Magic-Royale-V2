(() => {
  'use strict';

  const ADMOB_IDS = {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712'
  };

  let initialized = false;
  const getPlugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  const isNative = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform() && getPlugin());

  async function initAdMob() {
    if (!isNative() || initialized) return;
    try {
      await getPlugin().initialize({ initializeForTesting: true });
      initialized = true;
    } catch {}
  }

  async function showRewarded(onReward, onFallback) {
    if (!isNative()) {
      if (typeof onFallback === 'function') onFallback();
      return;
    }
    try {
      await initAdMob();
      const AdMob = getPlugin();
      await AdMob.prepareRewardVideoAd({ adId: ADMOB_IDS.rewarded, isTesting: true });
      const reward = await AdMob.showRewardVideoAd();
      if (reward && typeof onReward === 'function') onReward(reward);
    } catch {
      if (typeof onFallback === 'function') onFallback();
    }
  }

  async function showInterstitial() {
    if (!isNative()) return false;
    try {
      await initAdMob();
      const AdMob = getPlugin();
      await AdMob.prepareInterstitial({ adId: ADMOB_IDS.interstitial, isTesting: true });
      await AdMob.showInterstitial();
      return true;
    } catch { return false; }
  }

  window.addEventListener('load', initAdMob);
  window.CMRAds = { isNative, initAdMob, showRewarded, showInterstitial, ADMOB_IDS };
})();
