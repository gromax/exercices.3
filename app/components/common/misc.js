class Misc {
  /**
   * Retourne le temps restant entre now et la date fournie (yyyy-mm-dd).
   * Par défaut on considère la fin du jour (23:59:59.999) de la date.
   * Renvoie un objet { totalMs, days, hours, minutes, seconds, toString() }.
   * @param {string} dateStr Date au format 'yyyy-mm-dd'
   * @param {boolean} endOfDay Si true (par défaut), considère la fin de la journée
   * @return {int} nombre de millisecondes entre now et la date cible
   */
  static computeTimeFromNowToDate(dateStr, endOfDay = true) {
    if (!dateStr) return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, toString(){ return '0:00:00'; } };
    // parser en local : nouvelle Date(y, m-1, d, hh, mm, ss)
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = endOfDay
      ? new Date(y, m - 1, d, 23, 59, 59, 999)
      : new Date(y, m - 1, d, 0, 0, 0, 0);

    const now = new Date();
    let diff = target - now;
    return diff;
  }

  /**
   * Calcul le temps restant en ms avant la fin
   * si pas encore commencé ou déjà fini, renvoie null
   * @param {string} debut data au format 'yyyy-mm-dd'
   * @param {string} fin data au format 'yyyy-mm-dd'
   * @returns {number|null} temps restant en ms ou null
   */
  static computeTimeLeft(debut, fin) {
    if (!debut || !fin) return null;
    const nowToDebut = this.computeTimeFromNowToDate(debut, false);
    if (nowToDebut > 0) {
      // pas encore commencé
      return null;
    }
    const nowToFin = this.computeTimeFromNowToDate(fin, true);
    if (nowToFin <= 0) {
      // déjà fini
      return null;
    }
    return nowToFin;
  }
}

export default Misc;