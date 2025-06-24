async function generatePhrase(mode) {
  loading.value = true;
  error.value = null;
  phrase.value = null;
  showPhrase.value = true;
  phraseFilled.value = false;

  try {
    await getNewPhrases();

    if (newPhrases.value.length > 0) {
      const nextPhrase = newPhrases.value[0];
      phrase.value = nextPhrase;

      await saveCurrentPhrase(nextPhrase);
      await removeUsedNewPhrase(nextPhrase);

      setTimeout(() => {
        phraseFilled.value = true;
      }, 1000);

      return;
    }

    await getUserPhrases();

    const response = await axios.post(`${API_BASE_URL}/api/generatePhrase`, {
      mode,
      uid: currentUser.value.uid,
    });

    const list = response?.data?.phrases || [];
    if (!Array.isArray(list) || list.length === 0) throw new Error("Фразы не найдены");
    console.log("Сгенерированные фразы:", list);

    const normalize = s => s.toLowerCase().replace(/[.,!"'«»]/g, '').trim();
    const existing = userPhrases.value.map(normalize);

    const unique = list.filter(p => {
      const norm = normalize(p);
      return !existing.some(e => norm.includes(e) || e.includes(norm));
    });

    if (unique.length === 0) throw new Error("Все сгенерированные фразы уже использованы");

    const nextPhrase = unique[0];
    phrase.value = nextPhrase;

    await saveNewPhrases(unique);
    await saveCurrentPhrase(nextPhrase);
    await removeUsedNewPhrase(nextPhrase);

    setTimeout(() => {
      phraseFilled.value = true;
    }, 1000);

  } catch (err) {
    console.error("Ошибка при генерации фразы:", err);
    error.value = err.response?.data?.error || "Не удалось сгенерировать фразу";
  } finally {
    loading.value = false;
  }
}
